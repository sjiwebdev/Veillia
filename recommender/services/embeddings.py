"""Vecteurs semantiques des articles et des centres d'interet.

Le modele d'embedding transforme un texte en une liste de nombres. Deux textes
qui parlent du meme sujet ont des vecteurs proches, ce qui permet de comparer
un resume d'article avec les familles suivies par un membre.

Le calcul se fait en local, sur le processeur, avec la commande
`calculer_embeddings`. Les vues ne chargent jamais le modele : elles lisent
seulement les vecteurs deja enregistres en base.
"""

import hashlib
import html
import importlib.util
import logging
import re
import threading

from django.conf import settings

logger = logging.getLogger(__name__)

_verrou = threading.Lock()
_modele = None
_espaces = re.compile(r"\s+")
_balises = re.compile(r"<[^>]+>")


class ModeleIndisponible(RuntimeError):
    """Le modele ne peut pas etre charge sur cette machine."""


class ModeleIncomplet(RuntimeError):
    """Le modele a renvoye un vecteur de taille inattendue."""


def modele_installe():
    """Vrai si la bibliotheque sentence-transformers est presente."""
    return importlib.util.find_spec("sentence_transformers") is not None


def charger_modele():
    """Charge le modele une seule fois par processus."""
    global _modele
    if _modele is not None:
        return _modele

    if not modele_installe():
        raise ModeleIndisponible(
            "sentence-transformers n'est pas installe. "
            "Lancer : uv sync --group embeddings"
        )

    with _verrou:
        if _modele is None:
            import torch
            from sentence_transformers import SentenceTransformer

            logger.info("Chargement du modele d'embedding %s", settings.EMBEDDING_MODELE)
            _modele = SentenceTransformer(
                settings.EMBEDDING_MODELE,
                device="cpu",
                # Le mode bfloat16 est plus lent que float32 sur ce type de processeur.
                model_kwargs={"dtype": torch.float32},
            )
    return _modele


def nettoyer_texte(texte):
    """Enleve les balises HTML et les espaces inutiles."""
    texte = html.unescape(texte or "")
    texte = _balises.sub(" ", texte)
    return _espaces.sub(" ", texte).strip()


def texte_article(article):
    """Texte qui represente un article : son titre puis son resume."""
    morceaux = [nettoyer_texte(article.titre)]
    if article.resume:
        morceaux.append(nettoyer_texte(article.resume))
    texte = "\n\n".join(morceau for morceau in morceaux if morceau)
    return texte[: settings.EMBEDDING_MAX_CARACTERES]


def texte_sujet(sujet):
    """Texte qui represente une famille : nom, description et mots cles."""
    morceaux = [nettoyer_texte(sujet.nom)]
    if sujet.description:
        morceaux.append(nettoyer_texte(sujet.description))
    if sujet.mots_cles:
        morceaux.append(nettoyer_texte(sujet.mots_cles))
    return "\n".join(morceau for morceau in morceaux if morceau)


def empreinte_texte(texte):
    """Empreinte stable du texte, pour detecter une modification."""
    return hashlib.sha256(texte.encode("utf-8")).hexdigest()


def encoder(textes):
    """Calcule les vecteurs normalises d'une liste de textes."""
    textes = [texte for texte in textes if texte]
    if not textes:
        return []

    modele = charger_modele()
    vecteurs = modele.encode(
        textes,
        batch_size=settings.EMBEDDING_LOT,
        normalize_embeddings=True,
        show_progress_bar=False,
    )

    resultat = []
    for vecteur in vecteurs:
        valeurs = [round(float(valeur), 6) for valeur in vecteur]
        if len(valeurs) != settings.EMBEDDING_DIMENSION:
            raise ModeleIncomplet(
                f"Le modele a renvoye {len(valeurs)} dimensions au lieu de "
                f"{settings.EMBEDDING_DIMENSION}."
            )
        resultat.append(valeurs)
    return resultat


def similarite_cosinus(vecteur_a, vecteur_b):
    """Similarite entre deux vecteurs deja normalises.

    Le resultat va de -1 (opposes) a 1 (identiques). En pratique, deux textes
    sans rapport tournent autour de 0,2 et deux textes proches depassent 0,4.
    """
    if not vecteur_a or not vecteur_b or len(vecteur_a) != len(vecteur_b):
        return 0.0
    produit = sum(a * b for a, b in zip(vecteur_a, vecteur_b))
    return max(-1.0, min(1.0, produit))


def normaliser_similarite(valeur):
    """Ramene une similarite brute dans une note de 0 a 1.

    Les deux seuils sont reglables dans le fichier .env. Ils servent a rendre
    le score lisible : une similarite de 0,30 vaut 0, une de 0,60 vaut 1.
    """
    bas = settings.EMBEDDING_SEUIL_BAS
    haut = settings.EMBEDDING_SEUIL_HAUT
    if haut <= bas:
        return max(0.0, min(1.0, valeur))
    return max(0.0, min(1.0, (valeur - bas) / (haut - bas)))


def etat_moteur():
    """Chiffres affiches dans le front pour suivre la couverture du modele."""
    from aggregator.models import Article, Sujet
    from recommender.models import VecteurArticle, VecteurSujet

    articles_total = Article.objects.filter(est_visible=True).count()
    articles_vectorises = VecteurArticle.objects.filter(
        article__est_visible=True,
        modele=settings.EMBEDDING_MODELE,
        dimension=settings.EMBEDDING_DIMENSION,
    ).count()
    sujets_total = Sujet.objects.filter(est_actif=True).count()
    sujets_vectorises = VecteurSujet.objects.filter(
        sujet__est_actif=True,
        modele=settings.EMBEDDING_MODELE,
        dimension=settings.EMBEDDING_DIMENSION,
    ).count()

    dernier = (
        VecteurArticle.objects.order_by("-mis_a_jour_le")
        .values_list("mis_a_jour_le", flat=True)
        .first()
    )

    return {
        "actif": articles_vectorises > 0 and sujets_vectorises > 0,
        "bibliotheque": modele_installe(),
        "modele": settings.EMBEDDING_MODELE,
        "dimension": settings.EMBEDDING_DIMENSION,
        "articles_total": articles_total,
        "articles_vectorises": articles_vectorises,
        "sujets_total": sujets_total,
        "sujets_vectorises": sujets_vectorises,
        "couverture": round(articles_vectorises / articles_total, 4) if articles_total else 0,
        "derniere_mise_a_jour": dernier,
    }
