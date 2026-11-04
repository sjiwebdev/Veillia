"""Calcule les recommandations de tous les membres connects."""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db.models import Q

from recommender.services.moteur import MoteurRecommendation


class Command(BaseCommand):
    help = "Genere les recommandations pour les utilisateurs qui ont des centres d'interet"

    def add_arguments(self, parser):
        parser.add_argument("--nombre", type=int, default=20, help="combien d'articles proposer")
        parser.add_argument("--utilisateur", type=str, help="ne traiter qu'un seul pseudo")

    def handle(self, *args, **options):
        Utilisateur = get_user_model()
        utilisateurs = Utilisateur.objects.filter(
            Q(suivis_sujets__isnull=False) | Q(suivis_sources__isnull=False)
        ).distinct()

        if options["utilisateur"]:
            utilisateurs = utilisateurs.filter(username=options["utilisateur"])

        total = 0
        for utilisateur in utilisateurs:
            moteur = MoteurRecommendation(utilisateur)
            resultats = moteur.generer(nombre=options["nombre"])
            total += len(resultats)
            self.stdout.write(f"{utilisateur.username} : {len(resultats)} recommandations")

        self.stdout.write(self.style.SUCCESS(f"{total} recommandations calculees."))
