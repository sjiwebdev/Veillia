"""Urls de l'app accounts."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("comptes-reseaux", views.CompteReseauViewSet, basename="compte-reseau")

urlpatterns = [
    path("inscription/", views.InscriptionView.as_view(), name="inscription"),
    path("connexion/", views.ConnexionView.as_view(), name="connexion"),
    path("profil/", views.MonProfilView.as_view(), name="profil"),
    path("profil/photo/", views.PhotoProfilView.as_view(), name="photo-profil"),
    path("profil/mot-de-passe/", views.ChangementMotDePasseView.as_view(), name="mot-de-passe"),
    path("profil/<str:username>/", views.ProfilPublicView.as_view(), name="profil-public"),
    path("oauth/<str:reseau>/", views.OAuthVueDepartView.as_view(), name="oauth-depart"),
    path("oauth/<str:reseau>/callback/", views.OAuthCallbackView.as_view(), name="oauth-callback"),
    path("jeton/rafraichir/", views.RafraichirJetonView.as_view(), name="rafraichir-jeton"),
    path("", include(router.urls)),
]
