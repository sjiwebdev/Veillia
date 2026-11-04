"""Agent d'ingestion : resume, classification et notation des articles.

L'agent travaille en trois temps :
1. il nettoie le texte de l'article
2. il demande a un modele de langue un resume court et des notes
   (Gemini en primaire, OpenRouter en fallback en cas de credits insuffisants)
3. si aucune cle API n'est configuree, il retombe sur une regle simple

Comme ca le projet tourne meme sans service externe.
"""

import json
import logging
import re
from dataclasses import dataclass

from aggregator.llm import (
    LimiteAtteinte,
    LLMConfigError,
    LLMError,
    generer,
)
from aggregator.llm import est_configure as llm_est_configure

logger = logging.getLogger(__name__)

TEMPO_LIMITE = 30
TAILLE_MAX_TEXTE = 4000

CONSIGNE = (
    "Tu es un redacteur de veille technologique. "
    "Tu analyses des articles de data science et d'intelligence artificielle. "
    "Reponds uniquement avec un objet JSON."
)


@dataclass
class Analyse:
    """Ce que renvoie l'agent pour un article."""

    resume: str = ""
    sujets: list = None
    note_qualite: float = 50
    note_pertinence: float = 50
    mots_cles: list = None
    utilise_modele: bool = False

    def __post_init__(self):
        if self.sujets is None:
            self.sujets = []
        if self.mots_cles is None:
            self.mots_cles = []


def resume_simple(titre, texte):
    """Resume de secours quand il n'y a pas de modele disponible.

    On prend les premieres phrases et on nettoie.
    """
    if not texte:
        return ""
    phrases = re.split(r"(?<=[.!?])\s+", texte)
    resume = " ".join(phrases[:3])
    return resume[:600].strip()


def noter_simple(titre, texte):
    """Notes de secours : on regarde la longueur et la presence de mots forts."""
    longueur = len(texte.split())
    qualite = 40 + min(40, longueur // 25)
    pertinence = 50
    if re.search(r"\b(how to|guide|tutorial|tutoriel|comment)\b", f"{titre} {texte}", re.I):
        pertinence += 20
    if re.search(r"\b(release|launch|annonce|nouvelle)\b", f"{titre} {texte}", re.I):
        pertinence += 10
    return max(0, min(100, qualite)), max(0, min(100, pertinence))


class AgentResume:
    """Client vers l'agent de resume (Gemini primaire, OpenRouter fallback).

    On l'appelle par son nom de service plutot que par le nom du fournisseur,
    comme ca on peut changer d'API sans toucher au reste du code.
    """

    @property
    def est_configure(self):
        return llm_est_configure()

    def analyser(self, titre, texte):
        """Demande un resume et des notes au modele (Gemini ou OpenRouter)."""
        if not self.est_configure:
            return self._version_simple(titre, texte)

        # On construit un prompt qui demande un JSON structure.
        prompt = (
            f"{CONSIGNE}\n\n"
            f"Titre : {titre}\n\n"
            f"Texte : {texte[:TAILLE_MAX_TEXTE]}\n\n"
            "Rends un JSON avec les cles suivantes :\n"
            '{"resume": "2 phrases en francais", "sujets": ["ml", "dl"], '
            '"note_qualite": 0-100, "note_pertinence": 0-100, '
            '"mots_cles": ["3 a 6 mots cles"]}'
        )

        try:
            contenu = generer(prompt)
            donnees = json.loads(contenu)
        except (LLMConfigError, LimiteAtteinte, LLMError, ValueError) as erreur:
            logger.warning("Modele indisponible, resume de secours utilise : %s", erreur)
            return self._version_simple(titre, texte)

        return Analyse(
            resume=str(donnees.get("resume", ""))[:900],
            sujets=donnees.get("sujets", [])[:3],
            note_qualite=float(donnees.get("note_qualite", 50)),
            note_pertinence=float(donnees.get("note_pertinence", 50)),
            mots_cles=[str(m)[:40] for m in donnees.get("mots_cles", [])][:6],
            utilise_modele=True,
        )

    def _version_simple(self, titre, texte):
        qualite, pertinence = noter_simple(titre, texte)
        return Analyse(
            resume=resume_simple(titre, texte),
            note_qualite=qualite,
            note_pertinence=pertinence,
            utilise_modele=False,
        )


def classer_par_mots_cles(article):
    """Classe l'article avec les mots cles des familles de sujets.

    Le modele fait un travail plus fin mais cette regle simple sert de
    filet de securite quand l'agent est indisponible.
    """
    from aggregator.models import Sujet

    texte = f"{article.titre} {article.resume}".lower()
    sujets_trouves = []
    for sujet in Sujet.objects.filter(est_actif=True):
        for mot in sujet.liste_mots_cles():
            # \b evite de trouver "ml" dans "html"
            if re.search(rf"\b{re.escape(mot)}\b", texte):
                sujets_trouves.append(sujet)
                break

    article.sujets.set(sujets_trouves[:3])
    return sujets_trouves
