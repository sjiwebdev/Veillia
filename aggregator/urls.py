"""Urls de l'app aggregator (partie api)."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("articles", views.ArticleViewSet, basename="article")
router.register("sources", views.SourceViewSet, basename="source")
router.register("sujets", views.SujetViewSet, basename="sujet")
router.register("auteurs", views.AuteurViewSet, basename="auteur")
router.register("etiquettes", views.EtiquetteViewSet, basename="etiquette")
router.register("journaux", views.JournalCollecteViewSet, basename="journal")

urlpatterns = [
    path("", include(router.urls)),
]
