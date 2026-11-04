"""Resumes d'articles avec Gemini (primaire) et OpenRouter (fallback).

Reglages dans le fichier .env :
    GEMINI_API_KEY=...                 # cle creee sur https://aistudio.google.com
    GEMINI_MODEL=gemini-3.5-flash      # modele peu gourmand en tokens (gratuit)
    GEMINI_THINKING_LEVEL=minimal      # raisonnement interne reduit pour economiser le quota
    GEMINI_PAUSE=6                     # secondes d'attente entre deux appels
    LANGUE_RESUME=fr                   # langue des resumes

    OPENROUTER_API_KEY=...             # cle creee sur https://openrouter.ai
    OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
    OPENROUTER_MODEL=google/gemini-3.5-flash-lite  # modele fallback peu couteux

Fonctions independantes de HTTP/Django : l'agent d'ingestion pourra les utiliser
directement comme « outils ».
"""

import os
import time

import requests

MODELE_PAR_DEFAUT = "gemini-3.5-flash"
URL_API_GEMINI = "https://generativelanguage.googleapis.com/v1beta/models/{modele}:generateContent"
URL_API_OPENROUTER = "https://openrouter.ai/api/v1/chat/completions"

MAX_CARACTERES = 4000      # on n'envoie pas plus de texte au modele (quota)
MAX_TOKENS_SORTIE = 1024   # limite basse pour economiser les tokens de sortie
SEUIL_COURT = 200          # en dessous, le contenu est deja un resume : pas d'appel LLM

LANGUES = {"fr": "francais", "en": "anglais", "es": "espagnol", "de": "allemand"}


class LLMError(Exception):
    """Erreur ponctuelle (reseau, reponse vide...) : on peut passer a l'article suivant."""


class LLMConfigError(LLMError):
    """Cle absente ou refusee : inutile de continuer."""


class LimiteAtteinte(LLMError):
    """Quota gratuit epuise (HTTP 429) : on essaie le fournisseur de secours."""


def fournisseur():
    return "gemini"


def est_configure():
    """Vrai des qu'un fournisseur (Gemini ou OpenRouter) est configure."""
    return bool(
        os.environ.get("GEMINI_API_KEY", "").strip()
        or os.environ.get("OPENROUTER_API_KEY", "").strip()
    )


def modele_gemini():
    return os.environ.get("GEMINI_MODEL", "").strip() or MODELE_PAR_DEFAUT


def modele_openrouter():
    return os.environ.get("OPENROUTER_MODEL", "google/gemini-3.5-flash-lite")


def pause_conseillee():
    """Secondes d'attente entre deux appels, pour rester sous la limite par minute."""
    try:
        return max(0.0, float(os.environ.get("GEMINI_PAUSE", "6")))
    except ValueError:
        return 6.0


def est_court(contenu):
    return len((contenu or "").strip()) < SEUIL_COURT


def _cle_gemini():
    cle = os.environ.get("GEMINI_API_KEY", "").strip()
    if not cle:
        raise LLMConfigError("GEMINI_API_KEY manquante : ajoutez-la dans votre fichier .env")
    return cle


def _cle_openrouter():
    cle = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if not cle:
        raise LLMConfigError("OPENROUTER_API_KEY manquante : ajoutez-la dans votre fichier .env")
    return cle


def _post_gemini(prompt):
    """POST vers Gemini avec 3 essais : reessaie sur erreurs reseau, 429 et 5xx."""
    config = {"maxOutputTokens": MAX_TOKENS_SORTIE}
    niveau = os.environ.get("GEMINI_THINKING_LEVEL", "").strip().lower()
    if niveau:
        config["thinkingConfig"] = {"thinkingLevel": niveau}

    for essai in range(3):
        dernier = essai == 2
        try:
            r = requests.post(
                URL_API_GEMINI.format(modele=modele_gemini()),
                timeout=60,
                headers={"x-goog-api-key": _cle_gemini()},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": config,
                },
            )
        except requests.RequestException as exc:
            if dernier:
                raise LLMError(f"Erreur réseau Gemini : {exc}") from exc
            time.sleep(2 * (essai + 1))
            continue
        if r.status_code == 429:
            if dernier:
                raise LimiteAtteinte("Limite du quota gratuit Gemini atteinte (HTTP 429)")
            time.sleep(10 * (essai + 1))
            continue
        if r.status_code >= 500:
            if dernier:
                raise LLMError(f"Erreur du serveur Gemini (HTTP {r.status_code})")
            time.sleep(3 * (essai + 1))
            continue
        if r.status_code in (401, 403):
            raise LLMConfigError(f"Cle API Gemini refusee (HTTP {r.status_code}). Verifiez votre .env")
        if r.status_code >= 400:
            raise LLMError(f"HTTP {r.status_code} : {r.text[:300]}")
        return r.json()

    raise LLMError("Nombre maximal d'essais atteints pour Gemini")


def _post_openrouter(prompt):
    """POST vers OpenRouter (fournisseur de secours)."""
    try:
        r = requests.post(
            URL_API_OPENROUTER,
            timeout=60,
            headers={
                "Authorization": f"Bearer {_cle_openrouter()}",
                "Content-Type": "application/json",
                "HTTP-Referer": os.environ.get("SITE_URL", "http://localhost:8000"),
                "X-Title": "VEILLIA",
            },
            json={
                "model": modele_openrouter(),
                # On transmet le prompt tel quel : l'agent y ajoute ses consignes
                # JSON, le resume y ajoute ses consignes de texte libre.
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "Tu es un assistant de veille technologique. "
                            "Suis exactement les instructions de l'utilisateur."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
                "max_tokens": MAX_TOKENS_SORTIE,
            },
        )
        if r.status_code >= 400:
            raise LLMError(
                f"HTTP {r.status_code} OpenRouter : {r.text[:300]}"
            )
        return r.json()
    except requests.RequestException as exc:
        raise LLMError(f"Erreur réseau OpenRouter : {exc}") from exc


def _extraire_texte_gemini(data):
    """Extrait le texte de la reponse Gemini en ignorant les parties 'raisonnement'."""
    candidats = data.get("candidates") if isinstance(data, dict) else None
    candidat = candidats[0] if candidats else {}
    parties = (candidat.get("content") or {}).get("parts") or []
    texte = "".join(p.get("text", "") for p in parties if not p.get("thought")).strip()
    if not texte:
        raison = candidat.get("finishReason", "inconnue")
        raise LLMError(f"Reponse vide de Gemini (finishReason : {raison})")
    return texte


def _extraire_texte_openrouter(data):
    """Extrait le texte de la reponse OpenRouter."""
    try:
        return data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError) as exc:
        raise LLMError(f"Reponse invalide de OpenRouter : {exc}") from exc


def generer(prompt):
    """Envoie un prompt a Gemini, avec bascule automatique sur OpenRouter en fallback.

    L'ordre de tentative :
    1. Gemini (primaire, faible consommation de tokens)
    2. OpenRouter (secours si quota epuise ou cle invalide)
    """
    derniere_erreur = None

    # Tentative 1 : Gemini
    if os.environ.get("GEMINI_API_KEY", "").strip():
        try:
            data = _post_gemini(prompt)
            return _extraire_texte_gemini(data)
        except (LLMError, LLMConfigError) as exc:
            derniere_erreur = exc
            # Si c'est une erreur de config (cle manquee), on ne tente pas OpenRouter
            # si ce dernier n'est pas configure non plus.
            if isinstance(exc, LLMConfigError) and not os.environ.get(
                "OPENROUTER_API_KEY", ""
            ).strip():
                raise

    # Tentative 2 : OpenRouter (fallback)
    if os.environ.get("OPENROUTER_API_KEY", "").strip():
        try:
            data = _post_openrouter(prompt)
            return _extraire_texte_openrouter(data)
        except (LLMError, LLMConfigError) as exc:
            derniere_erreur = exc

    if derniere_erreur:
        raise derniere_erreur
    raise LLMError("Aucun fournisseur LLM n'est configure.")


def resumer(titre, contenu, langue=None):
    """Resumes un article en 2-3 phrases. Retourne '' s'il n'y a rien a resumer.

    Si le contenu est deja court (< SEUIL_COURT caracteres), on le garde tel quel
    sans appeler le LLM (economise le quota gratuit).
    """
    contenu = (contenu or "").strip()
    if not contenu:
        return ""
    if est_court(contenu):
        return contenu
    langue = langue or os.environ.get("LANGUE_RESUME", "fr")
    prompt = (
        "Tu es un assistant de veille technologique. Résume l'article ci-dessous en "
        f"{LANGUES.get(langue, langue)}, en 2 a 3 phrases (60 mots maximum), de facon factuelle, "
        "sans rien inventer et sans opinion. Reponds uniquement par le resume.\n\n"
        f"Titre : {titre}\n\nTexte : {contenu[:MAX_CARACTERES]}"
    )
    return generer(prompt)
