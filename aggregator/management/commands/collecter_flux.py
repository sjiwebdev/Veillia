"""Lance la collecte des flux RSS.

Exemple : uv run python manage.py collecter_flux
Exemple : uv run python manage.py collecter_flux --source towards-data-science
"""

from django.core.management.base import BaseCommand

from aggregator.models import Source
from aggregator.services import fetcher


class Command(BaseCommand):
    help = "Telecharge les flux des sources actives et enregistre les nouveaux articles"

    def add_arguments(self, parser):
        parser.add_argument(
            "--source",
            type=str,
            help="identifiant d'une seule source, utile pour tester",
        )
        parser.add_argument(
            "--perimees",
            action="store_true",
            help="ne collecte que les sources dont la derniere collecte est trop ancienne",
        )

    def handle(self, *args, **options):
        if options["source"]:
            sources = Source.objects.filter(identifiant=options["source"])
            if not sources.exists():
                self.stdout.write(self.style.ERROR("Source introuvable."))
                return
        elif options["perimees"]:
            sources = [source for source in Source.objects.filter(est_active=True) if source.est_perdue()]
        else:
            sources = Source.objects.filter(est_active=True)

        total_crees = 0
        for source in sources:
            resultat = fetcher.collecter(source)
            total_crees += resultat["crees"]
            if resultat["erreur"]:
                self.stdout.write(self.style.ERROR(f"{source.nom} : {resultat['erreur']}"))
            else:
                self.stdout.write(
                    f"{source.nom} : {resultat['crees']} nouveaux articles "
                    f"sur {resultat['trouves']} trouves"
                )

        self.stdout.write(self.style.SUCCESS(f"Collecte terminee, {total_crees} articles ajoutes."))
