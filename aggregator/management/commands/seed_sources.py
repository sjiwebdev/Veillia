"""Ajoute des sources a VEILLIA.

Sans argument la commande ajoute les trois sources de demonstration.
Avec --fichier, elle lit un fichier JSON ou CSV contenant la liste complete
des sources a integrer (une par ligne : nom, site officiel, flux, langue).
"""

import csv
import json

from django.core.management.base import BaseCommand, CommandError

from aggregator.models import Source

SOURCES_DEMO = [
    {
        "nom": "Towards Data Science",
        "site_officiel": "https://towardsdatascience.com/",
        "url_flux": "https://towardsdatascience.com/feed/",
        "logo": "https://towardsdatascience.com/sdr_logo_tds.png",
        "langue": "en",
        "pays": "Etats-Unis",
        "fiabilite": 0.9,
        "est_verifiee": True,
    },
    {
        "nom": "KDnuggets",
        "site_officiel": "https://www.kdnuggets.com/",
        "url_flux": "https://www.kdnuggets.com/feed",
        "logo": "https://www.kdnuggets.com/images/KDnuggets_logo.png",
        "langue": "en",
        "pays": "Etats-Unis",
        "fiabilite": 0.85,
        "est_verifiee": True,
    },
    {
        "nom": "Silicon",
        "site_officiel": "https://www.silicon.fr/",
        "url_flux": "https://www.silicon.fr/feed",
        "logo": "https://www.silicon.fr/wp-content/uploads/2021/05/silicon-logo.png",
        "langue": "fr",
        "pays": "France",
        "fiabilite": 0.8,
        "est_verifiee": True,
    },
]


class Command(BaseCommand):
    help = "Ajoute des sources depuis un fichier JSON ou CSV, ou les trois sources de démonstration"

    def add_arguments(self, parser):
        parser.add_argument(
            "--fichier",
            type=str,
            help="chemin du fichier JSON ou CSV qui contient les sources",
        )
        parser.add_argument(
            "--sans-demo",
            action="store_true",
            help="ne pas ajouter les sources de démonstration",
        )

    def handle(self, *args, **options):
        donnees = []
        if options["fichier"]:
            donnees = self.lire_fichier(options["fichier"])
        elif not options["sans_demo"]:
            donnees = SOURCES_DEMO
        else:
            self.stdout.write("Rien a faire, aucune source fournie.")
            return

        if not donnees:
            raise CommandError("Le fichier ne contient aucune source.")

        compte = 0
        for element in donnees:
            nom = element.get("nom")
            url_flux = element.get("url_flux")
            if not nom or not url_flux:
                self.stdout.write(self.style.WARNING(f"Source ignoree : {element}"))
                continue
            source, cree = Source.objects.update_or_create(
                url_flux=url_flux,
                defaults={
                    "nom": nom,
                    "site_officiel": element.get("site_officiel", url_flux),
                    "logo": element.get("logo", ""),
                    "description": element.get("description", ""),
                    "langue": element.get("langue", "fr"),
                    "pays": element.get("pays", ""),
                    "fiabilite": float(element.get("fiabilite", 0.6)),
                    "est_verifiee": bool(element.get("est_verifiee", False)),
                    "est_active": True,
                },
            )
            compte += 1
            action = "ajoutee" if cree else "mise a jour"
            self.stdout.write(f"source {action} : {source.nom}")

        self.stdout.write(self.style.SUCCESS(f"{compte} sources enregistrees."))

    def lire_fichier(self, chemin):
        """Lit un fichier JSON (liste) ou CSV (colonnes en tete)."""
        if chemin.endswith(".csv"):
            with open(chemin, newline="", encoding="utf-8") as fichier:
                return list(csv.DictReader(fichier))
        with open(chemin, encoding="utf-8") as fichier:
            contenu = json.load(fichier)
        return contenu["sources"] if isinstance(contenu, dict) else contenu
