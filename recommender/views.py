"""Vues de l'app recommender : suivi des interets et recommandations."""

from datetime import timedelta

from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from aggregator.models import Article, Sujet

from .models import (
    AbonnementCanal,
    EvenementLecture,
    MotCle,
    Recommandation,
    ResumeQuotidien,
    SuiviSource,
    SuiviSujet,
)
from .serializers import (
    AbonnementCanalSerializer,
    EvenementLectureSerializer,
    MotCleSerializer,
    RecommandationSerializer,
    ResumeQuotidienSerializer,
    SuiviSourceSerializer,
    SuiviSujetSerializer,
)
from .services.embeddings import etat_moteur
from .services.moteur import MoteurRecommendation


class SuiviSujetViewSet(viewsets.ModelViewSet):
    """Familles de sujets que l'utilisateur suit."""

    serializer_class = SuiviSujetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SuiviSujet.objects.filter(utilisateur=self.request.user).select_related("sujet")

    def perform_create(self, serializer):
        serializer.save(utilisateur=self.request.user)


class SuiviSourceViewSet(viewsets.ModelViewSet):
    """Sources que l'utilisateur suit."""

    serializer_class = SuiviSourceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SuiviSource.objects.filter(utilisateur=self.request.user).select_related("source")

    def perform_create(self, serializer):
        serializer.save(utilisateur=self.request.user)


class MotCleViewSet(viewsets.ModelViewSet):
    """Mots cles suivis par l'utilisateur."""

    serializer_class = MotCleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MotCle.objects.filter(utilisateur=self.request.user)

    def perform_create(self, serializer):
        serializer.save(utilisateur=self.request.user)


class EvenementLectureViewSet(viewsets.ModelViewSet):
    """Historique de lecture et remontée des clics."""

    serializer_class = EvenementLectureSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["action", "article"]

    def get_queryset(self):
        return EvenementLecture.objects.filter(utilisateur=self.request.user).select_related("article")

    def perform_create(self, serializer):
        serializer.save(utilisateur=self.request.user)


class RecommandationViewSet(viewsets.ReadOnlyModelViewSet):
    """Articles recommandes pour l'utilisateur connecte.

    GET /api/recommandations/ renvoie les recommandations memorisees.
    POST /api/recommandations/generer/ relance le calcul a la volee.
    """

    serializer_class = RecommandationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Recommandation.objects.filter(
            utilisateur=self.request.user
        ).select_related("article", "article__source", "sujet_proche")

    @action(detail=False, methods=["get", "post"])
    def generer(self, request):
        """Calcule les recommandations et les enregistre."""
        nombre_brut = request.data.get("nombre") or request.query_params.get("nombre", 20)
        try:
            nombre = max(1, min(int(nombre_brut), 100))
        except (TypeError, ValueError):
            nombre = 20

        moteur = MoteurRecommendation(request.user)
        resultats = moteur.calculer(nombre=nombre)
        recommandations = moteur.enregistrer(resultats)

        serializer = RecommandationSerializer(
            Recommandation.objects.filter(pk__in=[r.pk for r in recommandations]).order_by("-score"),
            many=True,
        )
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def clic(self, request, pk=None):
        """Marque une recommandation comme cliquée."""
        recommandation = self.get_object()
        recommandation.est_cliquee = True
        recommandation.save(update_fields=["est_cliquee"])
        return Response(RecommandationSerializer(recommandation).data)

    @action(detail=False, methods=["get"])
    def moteur(self, request):
        """Etat du modele d'embedding et couverture des articles."""
        return Response(etat_moteur())

    @action(detail=False, methods=["get"])
    def instantanees(self, request):
        """Reco instantanee demandee par n8n pour un membre identifie par son canal.

        Le membre est retrouve avec le destinataire du canal, par exemple
        l'identifiant de son chat Telegram ou son numero WhatsApp.
        """
        destinataire = request.query_params.get("destinataire", "")
        abonnement = (
            AbonnementCanal.objects.filter(destinataire=destinataire, est_actif=True)
            .select_related("utilisateur")
            .first()
        )
        if abonnement is None:
            return Response(
                {"detail": "Aucun membre actif pour ce destinataire."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            nombre = max(1, min(int(request.query_params.get("nombre", 3)), 100))
        except (TypeError, ValueError):
            nombre = 3
        moteur = MoteurRecommendation(abonnement.utilisateur)
        moteur.generer(nombre=nombre)

        recommandations = Recommandation.objects.filter(
            utilisateur=abonnement.utilisateur
        ).select_related("article", "article__source")[:nombre]

        return Response(
            {
                "pseudo": abonnement.utilisateur.username,
                "canal": abonnement.canal,
                "recommandations": RecommandationSerializer(recommandations, many=True).data,
            }
        )


class AbonnementCanalViewSet(viewsets.ModelViewSet):
    """Canaux Telegram, Whatsapp et email."""

    serializer_class = AbonnementCanalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AbonnementCanal.objects.filter(utilisateur=self.request.user)

    def perform_create(self, serializer):
        serializer.save(utilisateur=self.request.user)


class ResumeQuotidienViewSet(viewsets.ReadOnlyModelViewSet):
    """Resumes quotidiens, lus par l'agent n8n."""

    serializer_class = ResumeQuotidienSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["etat", "canal", "jour"]

    def get_queryset(self):
        return ResumeQuotidien.objects.filter(utilisateur=self.request.user).prefetch_related(
            "articles"
        )

    @action(detail=True, methods=["post"])
    def statut(self, request, pk=None):
        """n8n appelle ce point d'entree apres l'envoi du message."""
        resume = self.get_object()
        etat = request.data.get("etat")
        if etat == ResumeQuotidien.Etat.ENVOYE:
            resume.marquer_envoye()
        elif etat == ResumeQuotidien.Etat.ECHEC:
            resume.marquer_echec(request.data.get("erreur", ""))
        return Response(ResumeQuotidienSerializer(resume).data)


class MonTableauDeBordView(APIView):
    """Statistiques reelles de l'utilisateur pour son tableau de bord.

    Toutes les valeurs sont calculees a partir de ses suivis et de son
    historique de lecture : aucun chiffre n'est simule cote front.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        utilisateur = request.user
        evenements = EvenementLecture.objects.filter(utilisateur=utilisateur)
        limite_semaine = timezone.now() - timedelta(days=7)

        suivis_sujets = SuiviSujet.objects.filter(utilisateur=utilisateur)
        suivis_sources = SuiviSource.objects.filter(utilisateur=utilisateur)

        total_secondes = evenements.aggregate(total=Sum("duree_secondes"))["total"] or 0
        secondes_semaine = (
            evenements.filter(cree_le__gte=limite_semaine)
            .aggregate(total=Sum("duree_secondes"))["total"]
            or 0
        )

        lectures = evenements.count()
        lectures_semaine = evenements.filter(cree_le__gte=limite_semaine).count()

        # Lectures des sept derniers jours, jours vides inclus.
        debut = timezone.localdate() - timedelta(days=6)
        compte_par_jour = {
            ligne["jour"]: ligne["total"]
            for ligne in (
                evenements.filter(cree_le__date__gte=debut)
                .annotate(jour=TruncDate("cree_le"))
                .values("jour")
                .annotate(total=Count("id"))
            )
        }
        noms_jours = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."]
        lectures_par_jour = []
        for decalage in range(7):
            jour = debut + timedelta(days=decalage)
            lectures_par_jour.append(
                {
                    "date": jour.isoformat(),
                    "jour": noms_jours[jour.weekday()],
                    "lectures": compte_par_jour.get(jour, 0),
                }
            )

        # Repartition de l'activite par famille de sujets.
        sujets_actifs = (
            Sujet.objects.filter(articles__evenements__utilisateur=utilisateur)
            .annotate(nombre=Count("articles__evenements", distinct=True))
            .order_by("-nombre")[:6]
        )
        activite_sujets = [
            {"nom": sujet.nom, "couleur": sujet.couleur, "valeur": sujet.nombre}
            for sujet in sujets_actifs
        ]
        if not activite_sujets:
            # Un membre qui vient de s'inscrire n'a pas encore d'historique :
            # on affiche au moins les familles qu'il a choisies.
            activite_sujets = [
                {
                    "nom": suivi.sujet.nom,
                    "couleur": suivi.sujet.couleur,
                    "valeur": max(1, round(suivi.poids * 10)),
                }
                for suivi in suivis_sujets.select_related("sujet")[:6]
            ]

        nombre_sujets = suivis_sujets.count()
        nombre_sources = suivis_sources.count()
        score_interet = min(100, nombre_sujets * 12 + nombre_sources * 8 + min(lectures, 20) * 2)

        dernieres_lectures = [
            {
                "id": evenement.article_id,
                "titre": evenement.article.titre,
                "identifiant": evenement.article.identifiant,
                "source": evenement.article.source.nom,
                "action": evenement.action,
                "quand": evenement.cree_le,
            }
            for evenement in evenements.select_related("article__source")[:5]
        ]

        recommandations_du_jour = Recommandation.objects.filter(
            utilisateur=utilisateur,
            cree_le__date=timezone.localdate(),
        ).count()

        return Response(
            {
                "sujets_suivis": nombre_sujets,
                "sources_suivies": nombre_sources,
                "articles_lus": lectures,
                "articles_lu_cette_semaine": lectures_semaine,
                "temps_lecture_minutes": round(total_secondes / 60),
                "temps_lecture_semaine_minutes": round(secondes_semaine / 60),
                "score_interet": score_interet,
                "recommandations_du_jour": recommandations_du_jour,
                "lectures_par_jour": lectures_par_jour,
                "activite_sujets": activite_sujets,
                "sujets_favoris": activite_sujets,
                "dernieres_lectures": dernieres_lectures,
            }
        )


class PanoramaPublicView(APIView):
    """Chiffres publics affiches sur la page d'accueil.

    Aucune donnee personnelle n'est renvoyee, c'est ce que voient les
    visiteurs non connectes et les moteurs de recherche.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "nombre_articles": Article.objects.filter(est_visible=True).count(),
                "nombre_sources": Article.objects.values("source").distinct().count(),
                "nombre_sujets": Sujet.objects.filter(est_actif=True).count(),
            }
        )
