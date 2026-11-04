"""Lecture des flux RSS et creation des articles.

C'est le coeur de l'agregateur : on lit le flux de la source, on garde les
metadonnees utiles et on ne recopie jamais le texte de l'article.
"""

import logging
import re
from datetime import datetime
from datetime import timezone as dt_timezone

import feedparser
import requests
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from aggregator.models import Article, Auteur, Etiquette, JournalCollecte

logger = logging.getLogger(__name__)

TEMPO_LIMITE = 20
TAILLE_MAX_TEXTE = 4000


class FluxInvalide(Exception):
    """Le flux renvoye n'est pas du XML valide."""


def lire_flux(source):
    """Telecharge et analyse le flux d'une source."""
    try:
        reponse = requests.get(
            source.url_flux,
            timeout=TEMPO_LIMITE,
            headers={"User-Agent": "VEILLIA/1.0 (+https://veillia.com)"},
        )
        reponse.raise_for_status()
    except requests.RequestException as erreur:
        raise FluxInvalide(f"Impossible de telecharger le flux : {erreur}") from erreur

    contenu = reponse.content
    analyse = feedparser.parse(contenu)
    if analyse.bozo and not analyse.entries:
        raise FluxInvalide("Flux illisible par le parseur.")
    return analyse


@transaction.atomic
def collecter(source):
    """Ramene les nouveaux articles d'une source.

    Renvoie un dictionnaire avec le nombre d'articles trouves et crees.
    """
    journal = JournalCollecte.objects.create(source=source)
    try:
        analyse = lire_flux(source)
    except FluxInvalide as erreur:
        source.marquer_erreur(erreur)
        journal.etat = JournalCollecte.Etat.KO
        journal.message = str(erreur)[:300]
        journal.fin_le = timezone.now()
        journal.save()
        return {"trouves": 0, "crees": 0, "erreur": str(erreur)}

    crees = 0
    for entree in analyse.entries:
        try:
            if creer_article(source, entree):
                crees += 1
        except Exception as erreur:  # un article casse ne doit pas arreter la collecte
            logger.warning("Article ignore sur %s : %s", source.nom, erreur)

    source.marquer_succes()
    source.nombre_articles = Article.objects.filter(source=source).count()
    source.save(update_fields=["nombre_articles", "modifie_le"])

    journal.articles_trouves = len(analyse.entries)
    journal.articles_crees = crees
    journal.fin_le = timezone.now()
    journal.save()

    return {"trouves": len(analyse.entries), "crees": crees, "erreur": None}


def creer_article(source, entree):
    """Cree un article a partir d'une entree de flux. Renvoie False si deja connu."""
    lien = (entree.get("link") or "").strip()
    titre = (entree.get("title") or "").strip()
    if not lien or not titre:
        return False

    identifiant = entree.get("id") or entree.get("guid") or ""
    if identifiant and Article.objects.filter(source=source, identifiant_flux=identifiant).exists():
        return False

    texte = nettoyer(entree.get("summary", "") or "")
    if not texte:
        texte = nettoyer(entree.get("description", "") or "")

    article = Article.objects.create(
        titre=titre[:400],
        lien=lien,
        identifiant_flux=identifiant or None,
        source=source,
        resume=texte[:900],
        origine_resume="flux",
        image_couverture=extraire_image(entree),
        publie_le=extraire_date(entree),
        langue=source.langue,
        nombre_mots=len(texte.split()),
        duree_lecture=max(1, round(len(texte.split()) / 200)),
    )

    rattacher_auteur(article, source, entree)
    rattacher_etiquette(article, entree)
    return True


def nettoyer(texte):
    """Enleve le HTML et les espaces en trop du texte du flux."""
    sans_balise = re.sub(r"<[^>]+>", " ", texte)
    return re.sub(r"\s+", " ", sans_balise).strip()


def extraire_image(entree):
    """Cherche l'image de couverture dans les endroits habituels du flux."""
    # 1. les enclosures type image
    for media in entree.get("enclosures", []):
        if media.get("type", "").startswith("image"):
            return media.get("href") or media.get("url", "")

    # 2. les balises media:content et media:thumbnail
    for media in entree.get("media_content", []) + entree.get("media_thumbnail", []):
        if media.get("url"):
            return media["url"]

    # 3. la premiere image du texte
    trouve = re.search(r'<img[^>]+src="([^"]+)"', entree.get("summary", ""))
    if trouve:
        return trouve.group(1)

    return ""


def extraire_date(entree):
    """Renvoie la date de publication, ou maintenant si le flux n'en donne pas."""
    for cle in ["published_parsed", "updated_parsed", "created_parsed"]:
        if cle in entree and entree[cle]:
            struct = entree[cle]
            return datetime(
                struct[0],
                struct[1],
                struct[2],
                struct[3],
                struct[4],
                struct[5],
                tzinfo=dt_timezone.utc,
            )
    date_brute = entree.get("published") or entree.get("updated")
    if date_brute:
        date = parse_datetime(date_brute)
        if date is not None:
            if timezone.is_naive(date):
                date = timezone.make_aware(date)
            return date
    return timezone.now()


def rattacher_auteur(article, source, entree):
    """Cree l'auteur si besoin et le rattache a l'article."""
    detail = entree.get("author_detail") or {}
    nom = (detail.get("name") or entree.get("author") or "").strip()
    if not nom:
        return

    auteur, _ = Auteur.objects.get_or_create(
        nom=nom[:150],
        source=source,
        defaults={
            "page_profil": detail.get("href", ""),
            "photo": detail.get("photo", ""),
        },
    )
    article.auteurs.add(auteur)


def rattacher_etiquette(article, entree):
    """Recopie les etiquettes du flux quand elles sont simples."""
    for tag in entree.get("tags", [])[:5]:
        nom = (tag.get("term") or "").strip()
        if not nom or len(nom) > 60:
            continue
        etiquette, _ = Etiquette.objects.get_or_create(nom=nom)
        article.etiquettes.add(etiquette)
