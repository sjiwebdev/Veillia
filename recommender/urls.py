"""Urls de l'app recommender."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("suivis-sujets", views.SuiviSujetViewSet, basename="suivi-sujet")
router.register("suivis-sources", views.SuiviSourceViewSet, basename="suivi-source")
router.register("mots-cles", views.MotCleViewSet, basename="mot-cle")
router.register("historique", views.EvenementLectureViewSet, basename="historique")
router.register("recommandations", views.RecommandationViewSet, basename="recommandation")
router.register("canaux", views.AbonnementCanalViewSet, basename="canal")
router.register("resumes", views.ResumeQuotidienViewSet, basename="resume")

urlpatterns = [
    path("tableau-de-bord/", views.MonTableauDeBordView.as_view(), name="tableau-de-bord"),
    path("panorama/", views.PanoramaPublicView.as_view(), name="panorama"),
    path("", include(router.urls)),
]
