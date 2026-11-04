"""Serializers de l'app recommender."""

from rest_framework import serializers

from aggregator.serializers import ArticleListeSerializer

from .models import (
    AbonnementCanal,
    EvenementLecture,
    MotCle,
    Recommandation,
    ResumeQuotidien,
    SuiviSource,
    SuiviSujet,
)


class SuiviSujetSerializer(serializers.ModelSerializer):
    """Ajout ou suppression d'une famille suivie."""

    nom_sujet = serializers.CharField(source="sujet.nom", read_only=True)
    couleur_sujet = serializers.CharField(source="sujet.couleur", read_only=True)
    identifiant_sujet = serializers.CharField(source="sujet.identifiant", read_only=True)
    description_sujet = serializers.CharField(source="sujet.description", read_only=True)

    class Meta:
        model = SuiviSujet
        fields = [
            "id",
            "sujet",
            "nom_sujet",
            "identifiant_sujet",
            "description_sujet",
            "couleur_sujet",
            "poids",
        ]
        read_only_fields = ["id"]


class SuiviSourceSerializer(serializers.ModelSerializer):
    """Ajout ou suppression d'une source suivie."""

    nom_source = serializers.CharField(source="source.nom", read_only=True)
    logo_source = serializers.CharField(source="source.logo", read_only=True)

    class Meta:
        model = SuiviSource
        fields = ["id", "source", "nom_source", "logo_source", "poids"]
        read_only_fields = ["id"]


class EvenementLectureSerializer(serializers.ModelSerializer):
    """Un clic ou une vue enregistre depuis le front."""

    class Meta:
        model = EvenementLecture
        fields = ["id", "article", "action", "duree_secondes", "cree_le"]
        read_only_fields = ["id", "cree_le"]


class RecommandationSerializer(serializers.ModelSerializer):
    """Proposition avec l'article complet et la raison affichee."""

    article = ArticleListeSerializer(read_only=True)
    raison = serializers.CharField(source="raison_principale", read_only=True)
    sujet_proche_nom = serializers.SerializerMethodField()

    class Meta:
        model = Recommandation
        fields = [
            "id",
            "article",
            "score",
            "score_semantique",
            "sujet_proche",
            "sujet_proche_nom",
            "raisons",
            "raison",
            "est_cliquee",
            "cree_le",
        ]

    def get_sujet_proche_nom(self, obj):
        return obj.sujet_proche.nom if obj.sujet_proche else ""


class AbonnementCanalSerializer(serializers.ModelSerializer):
    """Canal externe ou l'utilisateur veut etre prevenu."""

    class Meta:
        model = AbonnementCanal
        fields = ["id", "canal", "destinataire", "est_actif", "cree_le", "dernier_envoi"]
        read_only_fields = ["id", "cree_le", "dernier_envoi"]


class ResumeQuotidienSerializer(serializers.ModelSerializer):
    """Resume quotidien, utilise surtout par l'agent n8n."""

    nombre_articles = serializers.IntegerField(read_only=True)
    destinataire = serializers.SerializerMethodField()
    pseudo_utilisateur = serializers.CharField(
        source="utilisateur.username", read_only=True
    )
    articles_detail = ArticleListeSerializer(source="articles", many=True, read_only=True)

    class Meta:
        model = ResumeQuotidien
        fields = [
            "id",
            "utilisateur",
            "pseudo_utilisateur",
            "jour",
            "canal",
            "destinataire",
            "etat",
            "nombre_articles",
            "articles",
            "articles_detail",
            "erreur",
            "envoye_le",
        ]
        read_only_fields = ["id", "utilisateur", "jour", "articles", "envoye_le"]

    def get_destinataire(self, obj):
        """Renvoie le chat id ou le numero a utiliser pour cet abonnement."""
        abonnement = obj.utilisateur.canaux.filter(canal=obj.canal, est_actif=True).first()
        return abonnement.destinataire if abonnement else ""


class MotCleSerializer(serializers.ModelSerializer):
    class Meta:
        model = MotCle
        fields = ["id", "mot", "identifiant"]
        read_only_fields = ["id", "identifiant"]
