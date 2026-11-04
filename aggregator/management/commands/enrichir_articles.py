"""Passe les articles dans l'agent pour completer les resumes et les familles.

L'agent ecrit un resume en francais, donne deux notes et range l'article dans
les bonnes familles de sujets.
"""

from django.core.management.base import BaseCommand

from aggregator.models import Article
from aggregator.services import agent as service_agent
from aggregator.services.fetcher import nettoyer


class Command(BaseCommand):
    help = "Genere les resumes manquants et classe les articles par famille"

    def add_arguments(self, parser):
        parser.add_argument("--nombre", type=int, default=50, help="combien d'articles traiter")
        parser.add_argument(
            "--reprendre",
            action="store_true",
            help="retraiter aussi les articles qui ont deja un resume",
        )

    def handle(self, *args, **options):
        analyseur = service_agent.AgentResume()
        if not analyseur.est_configure:
            self.stdout.write(
                self.style.WARNING(
                    "Aucune cle GEMINI_API_KEY ou OPENROUTER_API_KEY dans le .env, "
                    "l'agent utilise la version de secours."
                )
            )

        articles = Article.objects.visibles().order_by("-publie_le")
        if not options["reprendre"]:
            articles = articles.filter(origine_resume="flux")
        articles = articles[: options["nombre"]]

        traites = 0
        for article in articles:
            texte = article.resume
            if not texte:
                self.stdout.write(f"{article.titre[:50]} : pas de texte dans le flux, ignore")
                continue

            analyse = analyseur.analyser(article.titre, nettoyer(texte))
            article.resume = analyse.resume or article.resume
            article.origine_resume = "agent" if analyse.utilise_modele else "flux"
            article.note_qualite = analyse.note_qualite
            article.note_pertinence = analyse.note_pertinence
            article.save()

            sujets = service_agent.classer_par_mots_cles(article)
            traites += 1
            noms = ", ".join(sujet.nom for sujet in sujets) or "aucune famille"
            self.stdout.write(f"{article.titre[:50]} : {noms}")

        self.stdout.write(self.style.SUCCESS(f"{traites} articles traites par l'agent."))
