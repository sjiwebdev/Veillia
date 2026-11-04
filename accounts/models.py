"""Modeles de l'app accounts : les utilisateurs de VEILLIA."""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Utilisateur de la plateforme.

    On part du User de Django et on ajoute les infos que l'agregateur
    affiche dans le profil public.
    """

    first_name = models.CharField("prenom", max_length=150, blank=True)
    last_name = models.CharField("nom", max_length=150, blank=True)
    email = models.EmailField("adresse email", unique=True)

    photo_profil = models.URLField("photo de profil", blank=True)
    presentation = models.TextField("presentation", max_length=500, blank=True)
    fonction = models.CharField("fonction", max_length=120, blank=True)
    entreprise = models.CharField("entreprise", max_length=120, blank=True)
    pays = models.CharField("pays", max_length=80, blank=True)
    site_web = models.URLField("site web", blank=True)

    # preferences de lecture
    langue = models.CharField("langue", max_length=5, default="fr")
    recevoir_newsletter = models.BooleanField("recevoir la newsletter", default=False)

    cree_le = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)

    REQUIRED_FIELDS = ["email"]

    class Meta:
        verbose_name = "utilisateur"
        verbose_name_plural = "utilisateurs"
        ordering = ["-date_joined"]

    def __str__(self):
        return self.nom_affiche

    @property
    def nom_affiche(self):
        """Nom affiche dans le front. On evite de montrer le pseudo seul si possible."""
        complet = self.get_full_name().strip()
        return complet or self.username

    @property
    def initiales(self):
        """Deux lettres pour l'avatar quand l'image n'existe pas."""
        mots = self.nom_affiche.split()
        if len(mots) >= 2:
            return (mots[0][0] + mots[1][0]).upper()
        return self.nom_affiche[:2].upper()

    def infos_profil(self):
        """Renvoie un dictionnaire simple utilise par le serializer public."""
        return {
            "identifiant": self.pk,
            "pseudo": self.username,
            "nom_affiche": self.nom_affiche,
            "photo_profil": self.photo_profil,
            "presentation": self.presentation,
            "fonction": self.fonction,
            "entreprise": self.entreprise,
            "pays": self.pays,
            "inscrit_le": self.cree_le,
        }


class CompteReseau(models.Model):
    """Compte Github ou Linkedin rattache a un utilisateur VEILLIA."""

    class Reseau(models.TextChoices):
        GITHUB = "github", "Github"
        LINKEDIN = "linkedin", "Linkedin"

    utilisateur = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="comptes_reseaux",
        verbose_name="utilisateur",
    )
    reseau = models.CharField("reseau social", max_length=20, choices=Reseau.choices)
    # identifiant renvoye par le reseau social, sert a reconnaitre le compte
    identifiant_reseau = models.CharField("identifiant chez le reseau", max_length=100)
    pseudo_reseau = models.CharField("pseudo chez le reseau", max_length=150, blank=True)
    lien_profil = models.URLField("page de profil", blank=True)
    photo_profil = models.URLField("photo de profil", blank=True)

    cree_le = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "compte reseau social"
        verbose_name_plural = "comptes reseaux sociaux"
        constraints = [
            models.UniqueConstraint(
                fields=["reseau", "identifiant_reseau"],
                name="reseau_identifiant_unique",
            ),
            models.UniqueConstraint(
                fields=["utilisateur", "reseau"],
                name="un_reseau_par_utilisateur",
            ),
        ]

    def __str__(self):
        return f"{self.utilisateur.username} - {self.get_reseau_display()}"

    @property
    def est_github(self):
        return self.reseau == self.Reseau.GITHUB

    @property
    def est_linkedin(self):
        return self.reseau == self.Reseau.LINKEDIN
