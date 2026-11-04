"""Serializers de l'app aggregator."""

from rest_framework import serializers

from .models import Article, Auteur, Etiquette, JournalCollecte, Source, Sujet


class SourceSerializer(serializers.ModelSerializer):
    """Une source affichee dans la colonne de gauche."""

    class Meta:
        model = Source
        fields = [
            "id",
            "nom",
            "identifiant",
            "description",
            "site_officiel",
            "url_flux",
            "logo",
            "favicon",
            "langue",
            "pays",
            "fiabilite",
            "est_verifiee",
            "nombre_articles",
        ]
        read_only_fields = ["nombre_articles"]


class SourceAdminSerializer(serializers.ModelSerializer):
    """Version complete reservee a l'administrateur."""

    class Meta:
        model = Source
        fields = "__all__"


class SujetSerializer(serializers.ModelSerializer):
    """Une famille de sujets."""

    nombre_articles = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Sujet
        fields = [
            "id",
            "nom",
            "identifiant",
            "description",
            "couleur",
            "icone",
            "parent",
            "ordre",
            "est_actif",
            "nombre_articles",
        ]


class AuteurSerializer(serializers.ModelSerializer):
    """Auteur avec le lien vers sa page chez la source."""

    nom_source = serializers.CharField(source="source.nom", read_only=True, default="")
    lien = serializers.SerializerMethodField()

    class Meta:
        model = Auteur
        fields = ["id", "nom", "photo", "page_profil", "lien", "nom_source", "source"]

    def get_lien(self, obj):
        return obj.lien_public()


class EtiquetteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Etiquette
        fields = ["id", "nom"]


class ArticleListeSerializer(serializers.ModelSerializer):
    """Version courte pour le fil d'articles.

    On renvoie aussi un bloc json_ld : Google l'utilise pour afficher le
    titre, la source, l'image et la date dans les resultats.
    """

    source = SourceSerializer(read_only=True)
    sujets = SujetSerializer(many=True, read_only=True)
    auteurs = AuteurSerializer(many=True, read_only=True)
    json_ld = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            "id",
            "titre",
            "identifiant",
            "lien",
            "resume",
            "origine_resume",
            "image_couverture",
            "source",
            "sujets",
            "auteurs",
            "publie_le",
            "duree_lecture",
            "note_qualite",
            "a_la_une",
            "nombre_clics",
            "json_ld",
        ]

    def get_json_ld(self, obj):
        return {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": obj.titre,
            "url": obj.lien,
            "image": [obj.image_couverture] if obj.image_couverture else [],
            "datePublished": obj.publie_le.isoformat(),
            "author": [{"@type": "Person", "name": auteur.nom} for auteur in obj.auteurs.all()],
            "publisher": {
                "@type": "Organization",
                "name": obj.source.nom,
                "logo": {"@type": "ImageObject", "url": obj.source.logo},
            },
            "description": obj.resume[:300],
        }


class ArticleDetailSerializer(ArticleListeSerializer):
    """Version complete avec les etiquettes et l'origine du resume."""

    etiquettes = EtiquetteSerializer(many=True, read_only=True)
    collecte_le = serializers.DateTimeField(read_only=True)

    class Meta(ArticleListeSerializer.Meta):
        fields = ArticleListeSerializer.Meta.fields + [
            "etiquettes",
            "nombre_mots",
            "note_pertinence",
            "collecte_le",
        ]


class ArticleAdminSerializer(serializers.ModelSerializer):
    """L'administrateur peut tout modifier, y compris la visibilite."""

    class Meta:
        model = Article
        fields = "__all__"


class JournalCollecteSerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalCollecte
        fields = [
            "id",
            "source",
            "debut_le",
            "fin_le",
            "etat",
            "message",
            "articles_trouves",
            "articles_crees",
        ]


class ClicSourceSerializer(serializers.Serializer):
    """Enregistre un clic avant de rediriger vers la source."""

    duree_secondes = serializers.IntegerField(required=False, default=0)
