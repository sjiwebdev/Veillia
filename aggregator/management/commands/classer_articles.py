"""Classe les articles deja enregistres dans les bonnes familles.

A lancer apres un import de sources quand la base contient beaucoup
d'articles qui n'ont pas encore de famille.
"""

from django.core.management.base import BaseCommand

from aggregator.models import Article
from aggregator.services import agent


class Command(BaseCommand):
    help = "Range les articles existants dans les familles de sujets avec les mots cles"

    def add_arguments(self, parser):
        parser.add_argument("--nombre", type=int, default=300, help="combien d'articles classer")

    def handle(self, *args, **options):
        articles = Article.objects.filter(est_visible=True).order_by("-publie_le")
        traites = 0
        classes = 0

        for article in articles[: options["nombre"]]:
            sujets = agent.classer_par_mots_cles(article)
            traites += 1
            classes += 1 if sujets else 0

        self.stdout.write(
            self.style.SUCCESS(
                f"{traites} articles analyses, {classes} ranges dans au moins une famille."
            )
        )
