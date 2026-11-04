"""Prepare les resumes quotidiens que l'agent n8n va envoyer.

La commande cree une ligne ResumeQuotidien par utilisateur et par canal.
n8n vient ensuite lire ces lignes, envoie les messages, puis met le statut a jour.
"""


from django.core.management.base import BaseCommand
from django.utils import timezone

from recommender.models import AbonnementCanal, ResumeQuotidien
from recommender.services.moteur import MoteurRecommendation


class Command(BaseCommand):
    help = "Cree les resumes du jour pour chaque abonnement actif"

    def add_arguments(self, parser):
        parser.add_argument("--nombre", type=int, default=5, help="combien d'articles par resume")
        parser.add_argument(
            "--force",
            action="store_true",
            help="recreer les resumes du jour meme s'ils existent deja",
        )

    def handle(self, *args, **options):
        jour = timezone.localdate()
        canaux = AbonnementCanal.objects.filter(est_actif=True).select_related("utilisateur")

        crees = 0
        for abonnement in canaux:
            existant = ResumeQuotidien.objects.filter(
                utilisateur=abonnement.utilisateur, jour=jour, canal=abonnement.canal
            ).first()
            if existant and not options["force"]:
                continue

            moteur = MoteurRecommendation(abonnement.utilisateur)
            resultats = moteur.calculer(nombre=options["nombre"])

            resume, _ = ResumeQuotidien.objects.update_or_create(
                utilisateur=abonnement.utilisateur,
                jour=jour,
                canal=abonnement.canal,
                defaults={"etat": ResumeQuotidien.Etat.EN_ATTENTE, "erreur": ""},
            )
            resume.articles.set([item["article"] for item in resultats])
            resume.save()
            crees += 1
            self.stdout.write(
                f"{abonnement.utilisateur.username} / {abonnement.canal} : "
                f"{len(resultats)} articles"
            )

        moment = timezone.now().strftime("%d/%m/%Y %H:%M")
        self.stdout.write(self.style.SUCCESS(f"{crees} resumes prets a envoyer le {moment}."))
