"""Serializers de l'app accounts."""

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CompteReseau

Utilisateur = get_user_model()


class InscriptionSerializer(serializers.ModelSerializer):
    """Creation de compte : pseudo, email, mot de passe."""

    mot_de_passe = serializers.CharField(write_only=True, style={"input_type": "password"})
    confirmer_mot_de_passe = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = Utilisateur
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "mot_de_passe",
            "confirmer_mot_de_passe",
        ]

    def validate_username(self, valeur):
        """Le pseudo doit rester unique, meme en changeant la casse."""
        valeur = valeur.strip()
        if Utilisateur.objects.filter(username__iexact=valeur).exists():
            raise serializers.ValidationError("Ce pseudo est deja utilise.")
        return valeur

    def validate_email(self, valeur):
        """On stocke toujours l'email en minuscules pour eviter les doublons."""
        valeur = valeur.strip().lower()
        if Utilisateur.objects.filter(email__iexact=valeur).exists():
            raise serializers.ValidationError("Cette adresse email est deja utilisee.")
        return valeur

    def validate(self, donnees):
        # les deux mots de passe doivent etre identiques
        confirmation = donnees.pop("confirmer_mot_de_passe", None)
        if donnees["mot_de_passe"] != confirmation:
            raise serializers.ValidationError(
                {"confirmer_mot_de_passe": "Les deux mots de passe ne sont pas identiques."}
            )
        try:
            validate_password(donnees["mot_de_passe"])
        except DjangoValidationError as erreur:
            raise serializers.ValidationError({"mot_de_passe": list(erreur.messages)})
        return donnees

    def create(self, donnees):
        mot_de_passe = donnees.pop("mot_de_passe")
        utilisateur = Utilisateur(**donnees)
        utilisateur.set_password(mot_de_passe)
        utilisateur.save()
        return utilisateur


class ConnexionSerializer(serializers.Serializer):
    """Connexion classique pseudo + mot de passe."""

    username = serializers.CharField()
    mot_de_passe = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, donnees):
        pseudo = donnees["username"].strip()
        mot_de_passe = donnees["mot_de_passe"]

        utilisateur = authenticate(username=pseudo, password=mot_de_passe)
        if utilisateur is None:
            # On accepte aussi le pseudo saisi avec une casse differente.
            candidat = Utilisateur.objects.filter(username__iexact=pseudo).first()
            if candidat is not None and candidat.check_password(mot_de_passe):
                utilisateur = candidat

        if utilisateur is None:
            raise serializers.ValidationError("Pseudo ou mot de passe incorrect.")
        if not utilisateur.is_active:
            raise serializers.ValidationError("Ce compte est desactive.")
        donnees["utilisateur"] = utilisateur
        return donnees


class ProfilSerializer(serializers.ModelSerializer):
    """Profil complet, modifiable par son proprietaire."""

    nom_affiche = serializers.ReadOnlyField()
    initiales = serializers.ReadOnlyField()

    class Meta:
        model = Utilisateur
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "nom_affiche",
            "initiales",
            "photo_profil",
            "presentation",
            "fonction",
            "entreprise",
            "pays",
            "site_web",
            "langue",
            "recevoir_newsletter",
            "cree_le",
        ]
        read_only_fields = ["id", "cree_le"]

    def validate_username(self, valeur):
        """Le pseudo reste unique et sert d'adresse au profil public."""
        valeur = valeur.strip()
        if len(valeur) < 3:
            raise serializers.ValidationError("Le pseudo doit contenir au moins 3 caracteres.")
        autres = Utilisateur.objects.filter(username__iexact=valeur).exclude(pk=self.instance.pk)
        if autres.exists():
            raise serializers.ValidationError("Ce pseudo est deja utilise.")
        return valeur

    def validate_email(self, valeur):
        valeur = valeur.strip().lower()
        autres = Utilisateur.objects.filter(email__iexact=valeur).exclude(pk=self.instance.pk)
        if autres.exists():
            raise serializers.ValidationError("Cette adresse email est deja utilisee.")
        return valeur


class ProfilPublicSerializer(serializers.ModelSerializer):
    """Version courte du profil visible par les autres.

    On n'expose jamais l'email : uniquement les informations que le membre
    a choisi de rendre publiques.
    """

    nom_affiche = serializers.ReadOnlyField()
    initiales = serializers.ReadOnlyField()
    inscrit_le = serializers.DateTimeField(source="cree_le", read_only=True)

    class Meta:
        model = Utilisateur
        fields = [
            "id",
            "username",
            "nom_affiche",
            "initiales",
            "photo_profil",
            "presentation",
            "fonction",
            "entreprise",
            "pays",
            "site_web",
            "inscrit_le",
        ]


class ChangementMotDePasseSerializer(serializers.Serializer):
    """Changement de mot de passe."""

    ancien_mot_de_passe = serializers.CharField(write_only=True)
    nouveau_mot_de_passe = serializers.CharField(write_only=True)

    def validate(self, donnees):
        utilisateur = self.context["request"].user
        if not utilisateur.check_password(donnees["ancien_mot_de_passe"]):
            raise serializers.ValidationError({"ancien_mot_de_passe": "Mot de passe incorrect."})
        validate_password(donnees["nouveau_mot_de_passe"], utilisateur)
        donnees["utilisateur"] = utilisateur
        return donnees

    def save(self):
        utilisateur = self.validated_data["utilisateur"]
        utilisateur.set_password(self.validated_data["nouveau_mot_de_passe"])
        utilisateur.save(update_fields=["password"])
        return utilisateur


class CompteReseauSerializer(serializers.ModelSerializer):
    """Un compte Github ou Linkedin rattache."""

    nom_reseau = serializers.CharField(source="get_reseau_display", read_only=True)

    class Meta:
        model = CompteReseau
        fields = ["id", "reseau", "nom_reseau", "pseudo_reseau", "lien_profil", "photo_profil"]

    def validate_pseudo_reseau(self, valeur):
        valeur = valeur.strip()
        if not valeur:
            raise serializers.ValidationError("Indiquez votre pseudo sur ce reseau.")
        return valeur

    def create(self, donnees):
        # L'identifiant du reseau sert de cle unique : le pseudo suffit pour
        # les ajouts faits depuis le formulaire de profil.
        donnees.setdefault("identifiant_reseau", donnees.get("pseudo_reseau", "").lower())
        return super().create(donnees)


def creer_jetons(utilisateur):
    """Fabrique un couple access token / refresh token."""
    refresh = RefreshToken.for_user(utilisateur)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }
