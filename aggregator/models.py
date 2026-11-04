"""Modeles de l'app aggregator : les sources, les familles et les articles.

Regle importante du projet : on ne republie jamais le texte d'un article.
On garde seulement les metadonnees (titre, lien, image, resume genere)
et on renvoie le visiteur vers la source d'origine.
"""

import hashlib
from datetime import timedelta

from django.db import models
from django.utils import timezone
from django.utils.text import slugify


def identifiant_depuis(valeur, longueur=90):
    """Fabrique un identifiant (slug) propre a partir d'un texte."""
    base = slugify(valeur)[:longueur].strip("-")
    return base or "sans-titre"


class Source(models.Model):
    """Un blog ou un site qui publie un flux RSS sur la data et l'IA."""

    nom = models.CharField("nom de la source", max_length=150)
    identifiant = models.SlugField("identifiant", max_length=100, unique=True, blank=True)
    description = models.TextField("description", max_length=400, blank=True)

    site_officiel = models.URLField("site officiel")
    url_flux = models.URLField("url du flux RSS")
    logo = models.URLField("logo", blank=True)
    favicon = models.URLField("favicon", blank=True)

    langue = models.CharField("langue", max_length=5, default="fr")
    pays = models.CharField("pays", max_length=80, blank=True)

    # l'admin note la source de 0 a 1 pour trier les articles par fiabilite
    fiabilite = models.FloatField("fiabilite", default=0.5)
    est_active = models.BooleanField("active", default=True)
    est_verifiee = models.BooleanField("verifiee par l'admin", default=False)

    # suivi de la collecte
    intervalle_collecte_minutes = models.IntegerField("intervalle de collecte (min)", default=30)
    derniere_collecte = models.DateTimeField("derniere collecte", null=True, blank=True)
    dernier_succes = models.DateTimeField("dernier succes", null=True, blank=True)
    derniere_erreur = models.CharField("derniere erreur", max_length=300, blank=True)
    nombre_articles = models.PositiveIntegerField("nombre d'articles", default=0)

    cree_le = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "source"
        verbose_name_plural = "sources"
        ordering = ["nom"]

    def __str__(self):
        return self.nom

    def save(self, *args, **kwargs):
        # l'identifiant se remplit tout seul la premiere fois
        if not self.identifiant:
            self.identifiant = identifiant_depuis(self.nom)
        super().save(*args, **kwargs)

    def est_perdue(self):
        """Vrai si la source n'a pas ete lue depuis trop longtemps."""
        if self.derniere_collecte is None:
            return True
        limite = timezone.now() - timedelta(minutes=self.intervalle_collecte_minutes * 2)
        return self.derniere_collecte < limite

    def marquer_succes(self):
        """Appele quand le flux a bien ete lu."""
        maintenant = timezone.now()
        self.derniere_collecte = maintenant
        self.dernier_succes = maintenant
        self.derniere_erreur = ""
        self.save(
            update_fields=["derniere_collecte", "dernier_succes", "derniere_erreur", "modifie_le"]
        )

    def marquer_erreur(self, message):
        """Appele quand la lecture du flux a echoue."""
        self.derniere_collecte = timezone.now()
        self.derniere_erreur = str(message)[:300]
        self.save(update_fields=["derniere_collecte", "derniere_erreur", "modifie_le"])


class Sujet(models.Model):
    """Grande famille de sujets (Machine Learning, Deep Learning...)."""

    nom = models.CharField("nom", max_length=120)
    identifiant = models.SlugField("identifiant", max_length=100, unique=True, blank=True)
    description = models.TextField("description", max_length=300, blank=True)
    couleur = models.CharField("couleur", max_length=7, default="#2f6fed")
    icone = models.CharField("icone", max_length=40, blank=True)
    # une sous famille pointe vers sa famille par exemple LLM sous Generative AI
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="sous_familles",
        verbose_name="famille parente",
    )
    ordre = models.IntegerField("ordre d'affichage", default=100)
    est_actif = models.BooleanField("actif", default=True)

    # ces mots servent a reconnaitre le sujet dans un article
    mots_cles = models.TextField(
        "mots cles",
        blank=True,
        help_text="mots cles separes par des virgules, utilises pour classer les articles",
    )

    class Meta:
        verbose_name = "famille de sujets"
        verbose_name_plural = "familles de sujets"
        ordering = ["ordre", "nom"]

    def __str__(self):
        return self.nom

    def save(self, *args, **kwargs):
        if not self.identifiant:
            self.identifiant = identifiant_depuis(self.nom)
        super().save(*args, **kwargs)

    def liste_mots_cles(self):
        """Renvoie la liste propre des mots cles."""
        return [mot.strip().lower() for mot in self.mots_cles.split(",") if mot.strip()]


class Auteur(models.Model):
    """Auteur d'article, avec un lien vers son profil chez la source."""

    nom = models.CharField("nom", max_length=150)
    identifiant = models.SlugField("identifiant", max_length=100, unique=True, blank=True)
    source = models.ForeignKey(
        Source,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="auteurs",
        verbose_name="source",
    )
    page_profil = models.URLField("page auteur", blank=True)
    photo = models.URLField("photo", blank=True)
    biographie = models.TextField("biographie", max_length=400, blank=True)
    email = models.EmailField(blank=True)
    twitter = models.URLField("compte twitter", blank=True)

    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "auteur"
        verbose_name_plural = "auteurs"
        ordering = ["nom"]

    def __str__(self):
        return self.nom

    def save(self, *args, **kwargs):
        if not self.identifiant:
            self.identifiant = identifiant_depuis(f"{self.nom}-{self.source_id}")
        super().save(*args, **kwargs)

    def lien_public(self):
        """Si l'auteur n'a pas de page, on renvoie vers la source."""
        return self.page_profil or (self.source.site_officiel if self.source else "")


class Etiquette(models.Model):
    """Etiquette libre ajoutee a un article."""

    nom = models.CharField("nom", max_length=80, unique=True)

    class Meta:
        verbose_name = "etiquette"
        verbose_name_plural = "etiquettes"
        ordering = ["nom"]

    def __str__(self):
        return self.nom

    def save(self, *args, **kwargs):
        self.nom = self.nom.strip()
        super().save(*args, **kwargs)


class ArticleQuerySet(models.QuerySet):
    """Requetes utilisees souvent, regroupees ici."""

    def visibles(self):
        return self.filter(est_visible=True)

    def recents(self):
        return self.order_by("-publie_le")

    def du_jour(self):
        debut = timezone.localdate()
        return self.filter(publie_le__date=debut)


class Article(models.Model):
    """Un article collecte dans un flux RSS.

    On ne stocke que les metadonnees, le texte complet reste chez la source.
    """

    titre = models.CharField("titre", max_length=400)
    identifiant = models.SlugField("identifiant", max_length=120, unique=True, blank=True)
    lien = models.URLField("lien vers l'article")
    identifiant_flux = models.CharField("identifiant du flux", max_length=300, blank=True)

    # resume ecrit par l'agent d'ingestion
    resume = models.TextField("resume", max_length=900, blank=True)
    origine_resume = models.CharField(
        "origine du resume",
        max_length=20,
        choices=[("agent", "agent IA"), ("flux", "texte du flux"), ("manuel", "manuel")],
        default="flux",
    )

    image_couverture = models.URLField("image de couverture", blank=True)
    source = models.ForeignKey(
        Source,
        on_delete=models.CASCADE,
        related_name="articles",
        verbose_name="source",
    )
    sujets = models.ManyToManyField(Sujet, related_name="articles", blank=True, verbose_name="sujets")
    auteurs = models.ManyToManyField(Auteur, related_name="articles", blank=True, verbose_name="auteurs")
    etiquettes = models.ManyToManyField(
        Etiquette, related_name="articles", blank=True, verbose_name="etiquettes"
    )

    publie_le = models.DateTimeField("date de publication")
    collecte_le = models.DateTimeField("date de collecte", auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)

    langue = models.CharField("langue", max_length=5, default="fr")
    duree_lecture = models.PositiveIntegerField("temps de lecture (min)", default=3)
    nombre_mots = models.PositiveIntegerField("nombre de mots", default=0)

    # notes sur 100 donnees par l'agent, servent au classement
    note_qualite = models.FloatField("qualite", default=50)
    note_pertinence = models.FloatField("pertinence", default=50)

    est_visible = models.BooleanField("visible", default=True)
    a_la_une = models.BooleanField("a la une", default=False)
    nombre_clics = models.PositiveIntegerField("nb de clics", default=0)

    objects = ArticleQuerySet.as_manager()

    class Meta:
        verbose_name = "article"
        verbose_name_plural = "articles"
        ordering = ["-publie_le"]
        indexes = [
            models.Index(fields=["-publie_le"]),
            models.Index(fields=["source", "-publie_le"]),
            models.Index(fields=["est_visible", "-publie_le"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["source", "identifiant_flux"],
                name="article_unique_par_source",
            ),
        ]

    def __str__(self):
        return self.titre

    def save(self, *args, **kwargs):
        if not self.identifiant:
            self.identifiant = self._identifiant_unique()
        if not self.identifiant_flux:
            self.identifiant_flux = self._identifiant_du_lien()
        super().save(*args, **kwargs)

    def _identifiant_unique(self):
        """Identifiant du titre avec un petit suffixe pour rester unique."""
        base = identifiant_depuis(self.titre, 100)
        meme_identifiant = Article.objects.filter(identifiant=base).exclude(pk=self.pk)
        if not meme_identifiant.exists():
            return base
        # on rajoute un nombre derive du lien pour eviter les collisions
        nombre = hashlib.md5(self.lien.encode()).hexdigest()[:6]
        return f"{base}-{nombre}"

    def _identifiant_du_lien(self):
        """Identifiant stable quand le flux ne fournit pas de guid."""
        return hashlib.md5(self.lien.encode()).hexdigest()

    def incrementer_clics(self):
        """Appele quand un visiteur ouvre la source depuis la plateforme."""
        Article.objects.filter(pk=self.pk).update(nombre_clics=models.F("nombre_clics") + 1)
        self.nombre_clics += 1

    def lien_source(self):
        """Lien officiel de la source pour le bouton rediriger."""
        return self.source.site_officiel

    def resume_court(self, longueur=180):
        """Version courte du resume pour les cartes de la page d'accueil."""
        if not self.resume:
            return ""
        if len(self.resume) <= longueur:
            return self.resume
        return self.resume[:longueur].rsplit(" ", 1)[0] + "..."


class JournalCollecte(models.Model):
    """Journal des collectes, utile pour surveiller les pannes."""

    class Etat(models.TextChoices):
        OK = "ok", "Reussi"
        KO = "ko", "Echec"

    source = models.ForeignKey(
        Source,
        on_delete=models.CASCADE,
        related_name="journaux",
        verbose_name="source",
    )
    debut_le = models.DateTimeField(auto_now_add=True)
    fin_le = models.DateTimeField(null=True, blank=True)
    etat = models.CharField(max_length=5, choices=Etat.choices, default=Etat.OK)
    message = models.CharField(max_length=300, blank=True)
    articles_trouves = models.PositiveIntegerField(default=0)
    articles_crees = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "journal de collecte"
        verbose_name_plural = "journaux de collecte"
        ordering = ["-debut_le"]

    def __str__(self):
        return f"{self.source.nom} - {self.etat}"

    @property
    def duree_secondes(self):
        if self.fin_le is None:
            return None
        return round((self.fin_le - self.debut_le).total_seconds(), 1)
