"""Modeles de l'app recommender : suivi des centres d'interet et recommandations.

Elle garde la trace de ce que l'utilisateur a choisi (familles, sources, mots) et de ce qu'il a lu,
puis elle calcule des propositions d'articles.
"""

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from aggregator.models import Article, Source, Sujet


class SuiviSujet(models.Model):
    """Famille de sujets suivie par un utilisateur.

    poids est la force de l'interet : 1.0 c'est un sujet favori,
    0.2 c'est un sujet qu'il regarde de temps en temps.
    """

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="suivis_sujets",
        verbose_name="utilisateur",
    )
    sujet = models.ForeignKey(
        Sujet,
        on_delete=models.CASCADE,
        related_name="suivis",
        verbose_name="sujet",
    )
    poids = models.FloatField("force de l'interet", default=0.6)
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "suivi de famille"
        verbose_name_plural = "suivis de familles"
        ordering = ["-poids"]
        constraints = [
            models.UniqueConstraint(fields=["utilisateur", "sujet"], name="sujet_unique_par_user"),
        ]

    def __str__(self):
        return f"{self.utilisateur.username} suit {self.sujet.nom}"


class SuiviSource(models.Model):
    """Source suivie par un utilisateur."""

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="suivis_sources",
        verbose_name="utilisateur",
    )
    source = models.ForeignKey(
        Source,
        on_delete=models.CASCADE,
        related_name="suivis",
        verbose_name="source",
    )
    poids = models.FloatField("prefere cette source", default=0.7)
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "suivi de source"
        verbose_name_plural = "suivis de sources"
        ordering = ["-poids"]
        constraints = [
            models.UniqueConstraint(
                fields=["utilisateur", "source"],
                name="source_unique_par_user",
            ),
        ]

    def __str__(self):
        return f"{self.utilisateur.username} suit {self.source.nom}"


class EvenementLecture(models.Model):
    """Un evenement de lecture enregistre quand l'utilisateur interagit avec un article.

    On garde ces evenements quelques semaines, ils servent au moteur de
    recommandation et affichent aussi l'historique de lecture du profil.
    """

    class Action(models.TextChoices):
        VUE = "vue", "Vu dans le fil"
        CLIC_SOURCE = "clic_source", "Clic sur l'article"
        CLIC_AUTEUR = "clic_auteur", "Clic sur l'auteur"
        AJOUT = "ajout", "Ajoute aux favoris"
        PARTAGE = "partage", "Partage"

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="evenements_lecture",
        verbose_name="utilisateur",
    )
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name="evenements",
        verbose_name="article",
    )
    action = models.CharField(
        "action",
        max_length=20,
        choices=Action.choices,
        default=Action.VUE,
    )
    duree_secondes = models.PositiveIntegerField("temps passe", default=0)
    cree_le = models.DateTimeField("quand", default=timezone.now, db_index=True)

    class Meta:
        verbose_name = "evenement de lecture"
        verbose_name_plural = "evenements de lecture"
        ordering = ["-cree_le"]
        indexes = [models.Index(fields=["utilisateur", "-cree_le"])]

    def __str__(self):
        court = self.article.titre[:40]
        return f"{self.utilisateur.username} - {self.get_action_display()} - {court}"

    @property
    def poids_interaction(self):
        table = {
            self.Action.VUE: 0.2,
            self.Action.CLIC_SOURCE: 1.0,
            self.Action.CLIC_AUTEUR: 0.6,
            self.Action.AJOUT: 1.4,
            self.Action.PARTAGE: 1.6,
        }
        return table.get(self.action, 0.2)


class VecteurArticle(models.Model):
    """Vecteur du titre et du resume d'un article.

    Le vecteur est calcule par la commande `calculer_embeddings`, pas pendant
    une requete HTTP. L'empreinte permet de savoir si le texte a change depuis
    le dernier calcul.
    """

    article = models.OneToOneField(
        Article,
        on_delete=models.CASCADE,
        related_name="vecteur_semantique",
        verbose_name="article",
    )
    vecteur = models.JSONField("vecteur")
    modele = models.CharField("modele", max_length=120)
    dimension = models.PositiveSmallIntegerField("dimensions", default=1024)
    empreinte = models.CharField("empreinte du texte", max_length=64)
    mis_a_jour_le = models.DateTimeField("mis a jour le", default=timezone.now)

    class Meta:
        verbose_name = "vecteur d'article"
        verbose_name_plural = "vecteurs d'articles"

    def __str__(self):
        return f"Vecteur de {self.article.titre[:50]}"


class VecteurSujet(models.Model):
    """Vecteur du nom et de la description d'une famille de sujets."""

    sujet = models.OneToOneField(
        Sujet,
        on_delete=models.CASCADE,
        related_name="vecteur_semantique",
        verbose_name="sujet",
    )
    vecteur = models.JSONField("vecteur")
    modele = models.CharField("modele", max_length=120)
    dimension = models.PositiveSmallIntegerField("dimensions", default=1024)
    empreinte = models.CharField("empreinte du texte", max_length=64)
    mis_a_jour_le = models.DateTimeField("mis a jour le", default=timezone.now)

    class Meta:
        verbose_name = "vecteur de sujet"
        verbose_name_plural = "vecteurs de sujets"

    def __str__(self):
        return f"Vecteur de {self.sujet.nom}"


class Recommandation(models.Model):
    "Proposition d'article calculee pour un utilisateur."

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recommandations",
        verbose_name="utilisateur",
    )
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name="recommandations",
        verbose_name="article",
    )
    score = models.FloatField("score", default=0)
    score_semantique = models.FloatField("affinite semantique", default=0)
    sujet_proche = models.ForeignKey(
        Sujet,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="sujet proche",
    )
    raisons = models.JSONField("raisons", default=list, blank=True)
    est_cliquee = models.BooleanField("cliquee", default=False)
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "recommandation"
        verbose_name_plural = "recommandations"
        ordering = ["-score", "-cree_le"]
        constraints = [
            models.UniqueConstraint(
                fields=["utilisateur", "article"],
                name="recommandation_unique_par_user",
            ),
        ]

    def __str__(self):
        return f"{self.utilisateur.username} -> {self.article.titre[:40]} ({self.score:.2f})"

    @property
    def raison_principale(self):
        if not self.raisons:
            return ""
        return self.raisons[0].get("texte", "")


class AbonnementCanal(models.Model):
    """Canal de diffusion externe utilise par l'agent n8n.

    Telegram et WhatsApp n'ont pas d'API appelee depuis Django, on envoie
    simplement l'identifiant du canal pour que n8n puisse notifier l'utilisateur.
    """

    class Canal(models.TextChoices):
        TELEGRAM = "telegram", "Telegram"
        WHATSAPP = "whatsapp", "Whatsapp"
        EMAIL = "email", "Email"

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="canaux",
        verbose_name="utilisateur",
    )
    canal = models.CharField("canal", max_length=20, choices=Canal.choices)
    # identifiant de chat telegram ou numero de telephone pour whatsapp
    destinataire = models.CharField("destinataire", max_length=120)
    est_actif = models.BooleanField("actif", default=True)
    cree_le = models.DateTimeField(auto_now_add=True)
    dernier_envoi = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "abonnement a un canal"
        verbose_name_plural = "abonnements aux canaux"
        constraints = [
            models.UniqueConstraint(
                fields=["utilisateur", "canal", "destinataire"],
                name="canal_unique_par_user",
            ),
        ]

    def __str__(self):
        return f"{self.utilisateur.username} - {self.canal} - {self.destinataire}"


class ResumeQuotidien(models.Model):
    """Resume quotidien envoye sur les canaux de diffusion externes.
    n8n lit les lignes 'en_attente', envoie les messages, puis met le statut a jour.
    """

    class Etat(models.TextChoices):
        EN_ATTENTE = "en_attente", "En attente"
        ENVOYE = "envoye", "Envoye"
        ECHEC = "echec", "Echec"

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="resumes_quotidiens",
        verbose_name="utilisateur",
    )
    jour = models.DateField("journee", default=timezone.localdate, db_index=True)
    canal = models.CharField(max_length=20, choices=AbonnementCanal.Canal.choices)
    etat = models.CharField(max_length=10, choices=Etat.choices, default=Etat.EN_ATTENTE)
    articles = models.ManyToManyField(Article, related_name="resumes", blank=True)
    erreur = models.CharField(max_length=300, blank=True)
    cree_le = models.DateTimeField(auto_now_add=True)
    envoye_le = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "resume quotidien"
        verbose_name_plural = "resumes quotidiens"
        ordering = ["-jour"]
        constraints = [
            models.UniqueConstraint(
                fields=["utilisateur", "jour", "canal"],
                name="resume_unique_par_user_jour",
            ),
        ]

    def __str__(self):
        return f"{self.utilisateur.username} - {self.jour} - {self.get_etat_display()}"

    @property
    def nombre_articles(self):
        return self.articles.count()

    def marquer_envoye(self):
        self.etat = self.Etat.ENVOYE
        self.envoye_le = timezone.now()
        self.save(update_fields=["etat", "envoye_le"])

    def marquer_echec(self, message):
        self.etat = self.Etat.ECHEC
        self.erreur = str(message)[:300]
        self.save(update_fields=["etat", "erreur"])


class MotCle(models.Model):
    """Mot cle suivi par l'utilisateur dans le moteur de la plateforme."""

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mots_cles",
        verbose_name="utilisateur",
    )
    mot = models.CharField("mot cle", max_length=80)
    identifiant = models.SlugField(max_length=80, blank=True)

    class Meta:
        verbose_name = "mot cle suivi"
        verbose_name_plural = "mots cles suivis"
        ordering = ["mot"]
        constraints = [
            models.UniqueConstraint(fields=["utilisateur", "mot"], name="mot_unique_par_user"),
        ]

    def __str__(self):
        return f"{self.utilisateur.username} - {self.mot}"

    def save(self, *args, **kwargs):
        self.mot = self.mot.strip()
        if not self.identifiant:
            self.identifiant = slugify(self.mot)
        super().save(*args, **kwargs)
