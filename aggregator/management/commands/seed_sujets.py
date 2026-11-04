"""Cree les grandes familles de sujets de VEILLIA."""

from django.core.management.base import BaseCommand

from aggregator.models import Sujet

SUJETS = [
    {
        "nom": "Machine Learning",
        "couleur": "#2f6fed",
        "icone": "chart",
        "mots_cles": "machine learning, ml, classification, regression, random forest, gradient boosting",
        "description": "Les algorithmes d'apprentissage automatique et leurs usages concrets.",
    },
    {
        "nom": "Deep Learning",
        "couleur": "#7b4dff",
        "icone": "layers",
        "mots_cles": "deep learning, reseau de neurones, neural network, cnn, rnn, transformer",
        "description": "Reseaux de neurones, architectures profondes et entrainement de modeles.",
    },
    {
        "nom": "IA generative",
        "couleur": "#e0407a",
        "icone": "sparkles",
        "mots_cles": "generative ai, llm, gpt, chatgpt, claude, mistral, prompt, diffusion model",
        "description": "Modeles de langage, generation de texte et d'images, prompt engineering.",
    },
    {
        "nom": "AI engineering",
        "couleur": "#0aa678",
        "icone": "code",
        "mots_cles": "ai engineering, production, api, sdk, integration, mise en production",
        "description": "Comment integrer l'IA dans un vrai produit et la maintenir en production.",
    },
    {
        "nom": "MLOps",
        "couleur": "#c8760a",
        "icone": "loop",
        "mots_cles": "mlops, ci cd, pipeline, drift, monitoring, versionning modele",
        "description": "Deploiement, surveillance et cycle de vie des modeles de donnees.",
    },
    {
        "nom": "Business intelligence",
        "couleur": "#0b74c4",
        "icone": "chart-bar",
        "mots_cles": "business intelligence, power bi, tableau, dataviz, tableau de bord, datwarehouse",
        "description": "Tableaux de bord, visualisation et analyse de donnees pour le pilotage.",
    },
    {
        "nom": "Data engineering",
        "couleur": "#5b6b7c",
        "icone": "database",
        "mots_cles": "data engineering, etl, pipeline, airflow, dbt, kafka, lakehouse",
        "description": "Stockage, transformation et orchestration des donnees.",
    },
    {
        "nom": "Data science",
        "couleur": "#1f8a70",
        "icone": "beaker",
        "mots_cles": "data science, analyse, statistiques, pandas, numpy, experimentation",
        "description": "Methodologie, analyse et outils de la science des donnees.",
    },
    {
        "nom": "Traitement du langage",
        "couleur": "#9b3fa5",
        "icone": "chat",
        "mots_cles": "nlp, traitement du langage, embedding, fine tuning, recherche semantique",
        "description": "RAG, embeddings et comprehension du langage naturel.",
    },
    {
        "nom": "Vision par ordinateur",
        "couleur": "#d1495b",
        "icone": "eye",
        "mots_cles": "computer vision, image, detection, segmentation, yolo, vision langage",
        "description": "Analyse d'images, detection d'objets et modeles multimodaux.",
    },
    {
        "nom": "Gouvernance des donnees",
        "couleur": "#4a5568",
        "icone": "shield",
        "mots_cles": "gouvernance, rgpd, ethique, biais, conformite, llm security",
        "description": "Qualite, conformite et usage responsable des donnees et de l'IA.",
    },
    {
        "nom": "Cloud et Big Data",
        "couleur": "#2c7a7b",
        "icone": "cloud",
        "mots_cles": "cloud, aws, azure, gcp, spark, hadoop, big data",
        "description": "Stockage et calcul dans le cloud, plateformes de big data.",
    },
]


class Command(BaseCommand):
    help = "Cree les familles de sujets, on peut relancer la commande sans risque"

    def handle(self, *args, **options):
        for position, element in enumerate(SUJETS):
            nom = element["nom"]
            sujet, cree = Sujet.objects.update_or_create(
                nom=nom,
                defaults={
                    "couleur": element["couleur"],
                    "icone": element["icone"],
                    "mots_cles": element["mots_cles"],
                    "description": element["description"],
                    "ordre": position * 10,
                    "est_actif": True,
                },
            )
            action = "cree" if cree else "mis a jour"
            self.stdout.write(f"{action} : {sujet.nom}")
        self.stdout.write(self.style.SUCCESS(f"{len(SUJETS)} familles de sujets pretes."))
