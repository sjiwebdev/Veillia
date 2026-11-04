"""Vues de l'app aggregator : les API publiques de l'agregateur."""

from datetime import timedelta
from functools import partial

from django.contrib.auth import get_user_model
from django.contrib.sitemaps import Sitemap
from django.contrib.sitemaps.views import sitemap as vue_sitemap
from django.db.models import Count, Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from recommender.models import EvenementLecture

from .filters import ArticleFiltre
from .models import Article, Auteur, Etiquette, JournalCollecte, Source, Sujet
from .serializers import (
    ArticleDetailSerializer,
    ArticleListeSerializer,
    AuteurSerializer,
    ClicSourceSerializer,
    EtiquetteSerializer,
    JournalCollecteSerializer,
    SourceSerializer,
    SujetSerializer,
)


def articles_visibles():
    """Filtre reutilise pour ne compter que les articles visibles."""
    return Q(articles__est_visible=True)


class SourceViewSet(viewsets.ReadOnlyModelViewSet):
    """Liste des sources, pour le menu et le pied de page."""

    queryset = Source.objects.filter(est_active=True)
    serializer_class = SourceSerializer
    permission_classes = [AllowAny]
    lookup_field = "identifiant"
    search_fields = ["nom", "description"]
    ordering_fields = ["nom", "fiabilite", "nombre_articles"]


class SujetViewSet(viewsets.ReadOnlyModelViewSet):
    """Liste des grandes familles de sujets."""

    queryset = Sujet.objects.filter(est_actif=True).annotate(
        nombre_articles=Count("articles", filter=articles_visibles())
    )
    serializer_class = SujetSerializer
    permission_classes = [AllowAny]
    lookup_field = "identifiant"
    pagination_class = None

    @action(detail=False, methods=["get"])
    def avec_articles(self, request):
        """Familles qui ont au moins un article, pour la barre du haut."""
        sujets = self.get_queryset().filter(nombre_articles__gt=0)
        return Response(SujetSerializer(sujets, many=True).data)


class AuteurViewSet(viewsets.ReadOnlyModelViewSet):
    """Auteurs cliquables vers leur page a la source."""

    queryset = Auteur.objects.select_related("source")
    serializer_class = AuteurSerializer
    permission_classes = [AllowAny]
    lookup_field = "identifiant"
    search_fields = ["nom"]


class EtiquetteViewSet(viewsets.ReadOnlyModelViewSet):
    """Petites etiquettes utilisees pour le nuage de mots."""

    queryset = Etiquette.objects.all()
    serializer_class = EtiquetteSerializer
    permission_classes = [AllowAny]
    lookup_field = "nom"
    pagination_class = None


class ArticleViewSet(viewsets.ReadOnlyModelViewSet):
    """Le fil d'articles, c'est la vue principale de l'agregateur."""

    serializer_class = ArticleListeSerializer
    permission_classes = [AllowAny]
    filterset_class = ArticleFiltre
    lookup_field = "identifiant"
    search_fields = ["titre", "resume", "auteurs__nom", "source__nom"]
    ordering_fields = ["publie_le", "note_qualite", "note_pertinence", "nombre_clics"]

    def get_queryset(self):
        # l'admin voit tout, les visiteurs seulement les articles visibles
        queryset = Article.objects.select_related("source").prefetch_related(
            "sujets", "auteurs", "etiquettes"
        )
        if not self.request.user.is_staff:
            queryset = queryset.filter(est_visible=True)
        return queryset

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ArticleDetailSerializer
        return ArticleListeSerializer

    @action(detail=False, methods=["get"])
    def une(self, request):
        """Le bloc 'A la une' : les meilleurs articles du moment."""
        queryset = self.filter_queryset(self.get_queryset())
        une = queryset.filter(a_la_une=True)[:5]
        if une.count() < 5:
            une = queryset[:5]
        return Response(self.get_serializer(une, many=True).data)

    @action(detail=False, methods=["get"])
    def du_jour(self, request):
        """Tous les articles du jour, du plus recent au plus ancien.

        Si aucun article n'a ete collecté aujourd'hui, on retombe sur les
        articles les plus recents pour que la page ne soit jamais vide.
        Support la pagination pour le chargement infini et tous les filtres
        avances (recherche, sujet, source, plage de dates, tri).
        """
        # Base : articles du jour, ou tous les articles si aucun aujourd'hui
        base = self.get_queryset()
        queryset = base.du_jour()
        if not queryset.exists():
            queryset = base

        # Appliquer tous les filtres avances (search, sujet, source, date_debut, date_fin, ordering)
        queryset = self.filter_queryset(queryset)

        # Tri personnalise (surcharge l'ordering par defaut)
        tri = request.query_params.get("tri")
        ordre_map = {
            "recents": "-publie_le",
            "plus_anciens": "publie_le",
            "qualite": "-note_qualite",
            "popularite": "-nombre_clics",
        }
        if tri in ordre_map:
            queryset = queryset.order_by(ordre_map[tri])

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset[:50], many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def clic(self, request, identifiant=None):
        """Enregistre le clic et renvoie le lien de la source.

        Le front passe toujours par ce point d'entree pour les boutons
        'lire sur le site', ce qui nous permet de mesurer les sorties.
        """
        article = self.get_object()
        serializer = ClicSourceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        article.incrementer_clics()

        if request.user.is_authenticated:
            EvenementLecture.objects.create(
                utilisateur=request.user,
                article=article,
                action=EvenementLecture.Action.CLIC_SOURCE,
                duree_secondes=serializer.validated_data.get("duree_secondes", 0),
            )
        return Response({"lien": article.lien, "source": article.source.nom})

    @action(detail=True, methods=["get"])
    def similaires(self, request, identifiant=None):
        """Articles proches : meme famille de sujets ou meme source."""
        article = self.get_object()
        sujets = article.sujets.values_list("id", flat=True)
        proches = (
            Article.objects.visibles()
            .exclude(pk=article.pk)
            .filter(Q(sujets__in=sujets) | Q(source=article.source))
            .distinct()[:6]
        )
        return Response(self.get_serializer(proches, many=True).data)


class JournalCollecteViewSet(viewsets.ReadOnlyModelViewSet):
    """Historique des collectes, reserve aux membres connectes."""

    serializer_class = JournalCollecteSerializer
    permission_classes = [AllowAny]
    filterset_fields = ["source", "etat"]

    def get_queryset(self):
        # les visiteurs ne voient pas les journaux techniques
        if not self.request.user.is_authenticated:
            return JournalCollecte.objects.none()
        return JournalCollecte.objects.select_related("source")


# Partie referencement : ce que les moteurs explorent


class PlanDuSite(Sitemap):
    """Sitemap general : familles, sources et articles recents."""

    def items(self):
        sujets = Sujet.objects.filter(est_actif=True)
        sources = Source.objects.filter(est_active=True)
        articles = Article.objects.filter(est_visible=True).order_by("-publie_le")[:1000]
        return list(sujets) + list(sources) + list(articles)

    def lastmod(self, obj):
        return obj.modifie_le if hasattr(obj, "modifie_le") else timezone.now()

    def location(self, obj):
        if isinstance(obj, Sujet):
            return f"https://veillia.com/sujet/{obj.identifiant}/"
        if isinstance(obj, Source):
            return f"https://veillia.com/source/{obj.identifiant}/"
        return f"https://veillia.com/article/{obj.identifiant}/"


class SitemapActualites(Sitemap):
    """Sitemap news : seulement les articles des deux derniers jours."""

    changefreq = "hourly"
    priority = 0.9

    def items(self):
        limite = timezone.now() - timedelta(days=2)
        return Article.objects.filter(est_visible=True, publie_le__gte=limite)

    def lastmod(self, obj):
        return obj.publie_le

    def location(self, obj):
        return f"https://veillia.com/article/{obj.identifiant}/"


sitemap_contenu = partial(vue_sitemap, sitemaps={"contenu": PlanDuSite})
sitemap_actualites = partial(vue_sitemap, sitemaps={"actualites": SitemapActualites})


def robots_txt(request):
    """Fichier robots.txt : tout le contenu public reste ouvert."""
    lignes = [
        "User-agent: *",
        "Disallow: /admin/",
        "Disallow: /api/",
        "Allow: /",
        "",
        "Sitemap: https://veillia.com/sitemap.xml",
        "Sitemap: https://veillia.com/sitemap-news.xml",
        "",
    ]
    return HttpResponse("\n".join(lignes), content_type="text/plain")


def page_sans_javascript(request):
    """Page d'accueil en HTML simple pour les robots qui n'executent pas le JS.

    Google execute le JavaScript, beaucoup d'autres moteurs non, on garde
    donc une page minimale qui contient les derniers titres.
    """
    articles = Article.objects.visibles().recents()[:30]
    liste = "".join(
        f'<li><a href="https://veillia.com/article/{a.identifiant}/">{a.titre}</a></li>'
        for a in articles
    )
    html = (
        '<!doctype html><html lang="fr"><head><meta charset="utf-8">'
        "<title>VEILLIA - Data et intelligence artificielle</title>"
        '<meta name="description" content="Les meilleurs articles de data science '
        "et d'intelligence artificielle : Machine Learning, Deep Learning, MLOps.\">"
        f"</head><body><h1>VEILLIA</h1><ul>{liste}</ul></body></html>"
    )
    return HttpResponse(html, content_type="text/html")


def page_profil_public(request, username):
    """Page HTML d'un membre, pour le referencement des profils."""
    Utilisateur = get_user_model()
    utilisateur = Utilisateur.objects.filter(username=username).first()
    if utilisateur is None:
        return HttpResponse("Utilisateur introuvable", status=404, content_type="text/html")

    infos = utilisateur.infos_profil()
    nb_articles = EvenementLecture.objects.filter(utilisateur=utilisateur).count()
    html = (
        '<!doctype html><html lang="fr"><head><meta charset="utf-8">'
        f"<title>{infos['nom_affiche']} - VEILLIA</title>"
        f'<meta name="description" content="{infos["presentation"]}">'
        f'</head><body><h1>{infos["nom_affiche"]}</h1>'
        f"<p>{infos['fonction']} {infos['entreprise']}</p>"
        f"<p>{nb_articles} articles lus sur VEILLIA</p></body></html>"
    )
    return HttpResponse(html, content_type="text/html")


def flux_atom(request):
    """Flux Atom de l'agregateur, pratique pour les lecteurs RSS tiers."""
    articles = Article.objects.visibles().recents()[:50]
    parties = [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<feed xmlns="http://www.w3.org/2005/Atom">',
        "<title>VEILLIA</title>",
        "<id>https://veillia.com/flux/</id>",
        f"<updated>{timezone.now().isoformat()}</updated>",
    ]
    for article in articles:
        parties.append("<entry>")
        parties.append(f"<title>{article.titre}</title>")
        parties.append(f'<link href="{article.lien}"/>')
        parties.append(f"<id>{article.lien}</id>")
        parties.append(f"<updated>{article.publie_le.isoformat()}</updated>")
        parties.append(f"<summary>{article.resume}</summary>")
        parties.append("</entry>")
    parties.append("</feed>")
    return HttpResponse("\n".join(parties), content_type="application/atom+xml; charset=utf-8")
