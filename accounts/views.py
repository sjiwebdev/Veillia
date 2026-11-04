"""Vues de l'app accounts : inscription, connexion, profil, reseaux sociaux."""

import uuid

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from django.shortcuts import redirect
from rest_framework import status, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView

from .models import CompteReseau
from .serializers import (
    ChangementMotDePasseSerializer,
    CompteReseauSerializer,
    ConnexionSerializer,
    InscriptionSerializer,
    ProfilPublicSerializer,
    ProfilSerializer,
    creer_jetons,
)
from .services import oauth


class InscriptionView(APIView):
    """Creer un compte et renvoyer les jetons de connexion."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = InscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        utilisateur = serializer.save()
        jetons = creer_jetons(utilisateur)
        return Response(
            {"utilisateur": ProfilSerializer(utilisateur).data, **jetons},
            status=status.HTTP_201_CREATED,
        )


class ConnexionView(APIView):
    """Connexion pseudo + mot de passe."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ConnexionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        utilisateur = serializer.validated_data["utilisateur"]
        jetons = creer_jetons(utilisateur)
        return Response(
            {"utilisateur": ProfilSerializer(utilisateur).data, **jetons},
            status=status.HTTP_200_OK,
        )


class RafraichirJetonView(TokenRefreshView):
    """Renouvelle un jeton d'acces.

    SimpleJWT leve une exception si le compte du refresh token a ete supprime
    entre-temps : on renvoie alors un 401 propre pour que le front efface la
    session au lieu de recevoir une erreur 500.
    """

    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except get_user_model().DoesNotExist:
            return Response(
                {"detail": "Session expiree. Reconnectez-vous."},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class MonProfilView(APIView):
    """Profil de l'utilisateur connecte."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(ProfilSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfilSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ChangementMotDePasseView(APIView):
    """Changer son propre mot de passe."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangementMotDePasseSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Mot de passe mis a jour."})


def _extension_image(fichier):
    """Detecte le vrai format de l'image a partir de sa signature binaire."""
    fichier.seek(0)
    entete = fichier.read(16)
    fichier.seek(0)

    if entete.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if entete.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if entete.startswith((b"GIF87a", b"GIF89a")):
        return "gif"
    if entete[:4] == b"RIFF" and entete[8:12] == b"WEBP":
        return "webp"
    return None


def _supprimer_photo_locale(url, request):
    """Supprime le fichier precedent uniquement s'il appartient a nos medias."""
    if not url:
        return
    if url.startswith(settings.MEDIA_URL):
        chemin = url[len(settings.MEDIA_URL) :]
    else:
        prefixe = request.build_absolute_uri(settings.MEDIA_URL)
        if not url.startswith(prefixe):
            return
        chemin = url[len(prefixe) :]
    if chemin and default_storage.exists(chemin):
        default_storage.delete(chemin)


class PhotoProfilView(APIView):
    """Televersement et suppression de la photo de profil."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    TAILLE_MAX = 4 * 1024 * 1024

    def post(self, request):
        fichier = request.FILES.get("photo") or request.FILES.get("photo_profil")
        if fichier is None:
            return Response(
                {"detail": "Choisissez une image a televerser."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if fichier.size > self.TAILLE_MAX:
            return Response(
                {"detail": "L image ne doit pas depasser 4 Mo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        extension = _extension_image(fichier)
        if extension is None:
            return Response(
                {"detail": "Format non pris en charge. Utilisez JPG, PNG, GIF ou WebP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ancienne = request.user.photo_profil
        chemin = default_storage.save(
            f"avatars/{request.user.pk}/{uuid.uuid4().hex}.{extension}",
            fichier,
        )
        request.user.photo_profil = f"{settings.MEDIA_URL}{chemin}"
        request.user.save(update_fields=["photo_profil"])
        _supprimer_photo_locale(ancienne, request)

        return Response(ProfilSerializer(request.user).data)

    def delete(self, request):
        ancienne = request.user.photo_profil
        request.user.photo_profil = ""
        request.user.save(update_fields=["photo_profil"])
        _supprimer_photo_locale(ancienne, request)
        return Response(ProfilSerializer(request.user).data)


class ProfilPublicView(APIView):
    """Voir le profil public d'un autre membre."""

    permission_classes = [AllowAny]

    def get(self, request, username):
        Utilisateur = get_user_model()
        utilisateur = Utilisateur.objects.filter(username=username).first()
        if utilisateur is None:
            return Response(
                {"detail": "Utilisateur introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(ProfilPublicSerializer(utilisateur).data)


class CompteReseauViewSet(viewsets.ModelViewSet):
    """Comptes Github et Linkedin de l'utilisateur connecte."""

    serializer_class = CompteReseauSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CompteReseau.objects.filter(utilisateur=self.request.user)

    def perform_create(self, serializer):
        serializer.save(utilisateur=self.request.user)

    def perform_update(self, serializer):
        serializer.save(utilisateur=self.request.user)


class OAuthVueDepartView(APIView):
    """Renvoie l'utilisateur vers la page de connexion de Github ou Linkedin."""

    permission_classes = [AllowAny]

    def get(self, request, reseau):
        try:
            url = oauth.url_autorisation(reseau)
        except oauth.OAuthNonConfigure as erreur:
            return Response({"detail": str(erreur)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({"url": url, "type": reseau})


class OAuthCallbackView(APIView):
    """Recoit le retour du reseau social et connecte l'utilisateur."""

    permission_classes = [AllowAny]

    def get(self, request, reseau):
        code = request.query_params.get("code")
        if not code:
            return Response({"detail": "Code manquant."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            profil = oauth.profil(reseau, code)
        except oauth.OAuthErreur as erreur:
            return Response({"detail": str(erreur)}, status=status.HTTP_400_BAD_REQUEST)

        utilisateur = oauth.connecter_ou_creer(reseau, profil)
        jetons = creer_jetons(utilisateur)

        # en production on renvoie plutot un lien court vers le front React
        redirection = f"{settings.SITE_URL}/auth/callback?access={jetons['access']}"
        if request.query_params.get("json") == "1":
            return Response({"utilisateur": ProfilSerializer(utilisateur).data, **jetons})
        return redirect(redirection)
