"""Calcule les vecteurs semantiques des articles et des familles.

Exemples :
    python manage.py calculer_embeddings --simulation
    python manage.py calculer_embeddings --sujets
    python manage.py calculer_embeddings --articles --limite 100
    python manage.py calculer_embeddings --tout
"""

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from aggregator.models import Article, Sujet
from recommender.models import VecteurArticle, VecteurSujet
from recommender.services.embeddings import (
    ModeleIncomplet,
    ModeleIndisponible,
    charger_modele,
    empreinte_texte,
    encoder,
    modele_installe,
    texte_article,
    texte_sujet,
)

TAILLE_LOT = 24


class Command(BaseCommand):
    help = "Calcule les vecteurs des articles et des centres d'interet"

    def add_arguments(self, parser):
        parser.add_argument(
            "--tout",
            action="store_true",
            help="recalcule aussi les vecteurs deja a jour",
        )
        parser.add_argument(
            "--limite",
            type=int,
            default=0,
            help="nombre maximum d'articles a traiter (0 = tous)",
        )
        parser.add_argument(
            "--sujets",
            action="store_true",
            help="traite seulement les familles de sujets",
        )
        parser.add_argument(
            "--articles",
            action="store_true",
            help="traite seulement les articles",
        )
        parser.add_argument(
            "--simulation",
            action="store_true",
            help="affiche le travail a faire sans charger le modele",
        )

    def handle(self, *args, **options):
        traiter_sujets = options["sujets"] or not options["articles"]
        traiter_articles = options["articles"] or not options["sujets"]

        sujets = self._sujets_a_traiter(options["tout"]) if traiter_sujets else []
        articles = (
            self._articles_a_traiter(options["tout"], options["limite"])
            if traiter_articles
            else []
        )

        if options["simulation"]:
            self._afficher_simulation(sujets, articles)
            return

        if not sujets and not articles:
            self.stdout.write(self.style.SUCCESS("Tous les vecteurs sont deja a jour."))
            return

        try:
            charger_modele()
            if sujets:
                self._traiter_sujets(sujets)
            if articles:
                self._traiter_articles(articles)
        except ModeleIndisponible as erreur:
            raise CommandError(str(erreur)) from erreur
        except ModeleIncomplet as erreur:
            raise CommandError(str(erreur)) from erreur

        self.stdout.write(
            self.style.SUCCESS(
                f"Termine : {len(sujets)} sujet(s) et {len(articles)} article(s) traites."
            )
        )

    def _sujets_a_traiter(self, tout):
        existants = {vecteur.sujet_id: vecteur for vecteur in VecteurSujet.objects.all()}
        a_traiter = []
        for sujet in Sujet.objects.filter(est_actif=True).order_by("id"):
            texte = texte_sujet(sujet)
            empreinte = empreinte_texte(texte)
            existant = existants.get(sujet.pk)
            if self._doit_recalculer(existant, empreinte, tout):
                a_traiter.append((sujet, texte, empreinte))
        return a_traiter

    def _articles_a_traiter(self, tout, limite):
        existants = {vecteur.article_id: vecteur for vecteur in VecteurArticle.objects.all()}
        a_traiter = []
        articles = Article.objects.visibles().only("id", "titre", "resume").order_by("id")
        for article in articles:
            texte = texte_article(article)
            if not texte:
                continue
            empreinte = empreinte_texte(texte)
            existant = existants.get(article.pk)
            if self._doit_recalculer(existant, empreinte, tout):
                a_traiter.append((article, texte, empreinte))
                if limite and len(a_traiter) >= limite:
                    break
        return a_traiter

    def _doit_recalculer(self, existant, empreinte, tout):
        if tout or existant is None:
            return True
        return (
            existant.empreinte != empreinte
            or existant.modele != settings.EMBEDDING_MODELE
            or existant.dimension != settings.EMBEDDING_DIMENSION
        )

    def _afficher_simulation(self, sujets, articles):
        self.stdout.write(f"Modele : {settings.EMBEDDING_MODELE}")
        self.stdout.write(f"Dimensions : {settings.EMBEDDING_DIMENSION}")
        self.stdout.write(f"Bibliotheque installee : {'oui' if modele_installe() else 'non'}")
        self.stdout.write(f"Familles a calculer : {len(sujets)}")
        self.stdout.write(f"Articles a calculer : {len(articles)}")
        if not modele_installe():
            self.stdout.write(
                self.style.WARNING("Installer le moteur avec : uv sync --group embeddings")
            )

    def _traiter_sujets(self, sujets):
        self.stdout.write(f"Familles : {len(sujets)} a calculer")
        self._par_lots(sujets, VecteurSujet, "sujet")

    def _traiter_articles(self, articles):
        self.stdout.write(f"Articles : {len(articles)} a calculer")
        self._par_lots(articles, VecteurArticle, "article")

    def _par_lots(self, objets, modele_vecteur, etiquette):
        total = len(objets)
        for debut in range(0, total, TAILLE_LOT):
            lot = objets[debut : debut + TAILLE_LOT]
            vecteurs = encoder([texte for _, texte, _ in lot])
            maintenant = timezone.now()
            for (objet, _, empreinte), vecteur in zip(lot, vecteurs):
                modele_vecteur.objects.update_or_create(
                    **{etiquette: objet},
                    defaults={
                        "vecteur": vecteur,
                        "modele": settings.EMBEDDING_MODELE,
                        "dimension": len(vecteur),
                        "empreinte": empreinte,
                        "mis_a_jour_le": maintenant,
                    },
                )
            fin = min(debut + len(lot), total)
            self.stdout.write(f"  {etiquette}s : {fin}/{total}")
