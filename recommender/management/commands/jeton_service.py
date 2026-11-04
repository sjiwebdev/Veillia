"""Cree un jeton de service pour l'agent n8n.

n8n appelle l'api avec un jeton porte par un compte technique.
On utilise un compte de service plutot que le compte d'un membre,
ainsi on peut le revoquer sans toucher aux comptes reels.

Exemple :
uv run python manage.py jeton_service --utilisateur robot
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from rest_framework_simplejwt.tokens import RefreshToken

JOURS_VALIDITE = 365


class Command(BaseCommand):
    help = "Cree le compte technique de n8n et affiche son jeton d'acces"

    def add_arguments(self, parser):
        parser.add_argument("--utilisateur", type=str, default="robot", help="nom du compte technique")
        parser.add_argument("--email", type=str, default="robot@veillia.local")
        parser.add_argument(
            "--revoquer",
            action="store_true",
            help="desactive le compte technique existant",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        Utilisateur = get_user_model()
        nom = options["utilisateur"]

        utilisateur = Utilisateur.objects.filter(username=nom).first()

        if options["revoquer"]:
            if utilisateur is None:
                raise CommandError("Ce compte technique n'existe pas.")
            utilisateur.is_active = False
            utilisateur.save(update_fields=["is_active"])
            self.stdout.write(self.style.SUCCESS(f"Compte {nom} desactive."))
            return

        if utilisateur is None:
            utilisateur = Utilisateur.objects.create(
                username=nom,
                email=options["email"],
                first_name="Robot",
                last_name="Diffusion",
                is_staff=False,
            )
            utilisateur.set_unusable_password()
            utilisateur.save()
            self.stdout.write(f"Compte technique {nom} cree.")
        else:
            self.stdout.write(f"Compte technique {nom} deja present.")

        jeton = RefreshToken.for_user(utilisateur)
        jeton.set_exp(lifetime=timedelta(days=JOURS_VALIDITE))

        self.stdout.write("")
        self.stdout.write("Copier ces valeurs dans les credentials HTTP de n8n :")
        self.stdout.write("URL      : {base}/api/resumes/?etat=en_attente")
        self.stdout.write(f"Header   : Authorization: Bearer {jeton.access_token}")
        self.stdout.write("")
        self.stdout.write(self.style.WARNING("Le jeton est affiche une seule fois."))
