"""Tests de l'app aggregator."""

from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import Article, Source, Sujet
from .services.fetcher import extraire_date, extraire_image, nettoyer


def creer_source(**champs):
    defauts = {
        "nom": "Source test",
        "site_officiel": "https://exemple.com",
        "url_flux": "https://exemple.com/feed",
    }
    defauts.update(champs)
    return Source.objects.create(**defauts)


class TestSource(TestCase):
    def test_identifiant_genere_automatiquement(self):
        source = creer_source(nom="Le Monde Informatique")
        self.assertEqual(source.identifiant, "le-monde-informatique")

    def test_source_perdue_sans_collecte(self):
        source = creer_source()
        self.assertTrue(source.est_perdue())

    def test_marquage_reussite(self):
        source = creer_source()
        source.marquer_succes()
        self.assertIsNotNone(source.dernier_succes)
        self.assertFalse(source.est_perdue())

    def test_marquage_erreur(self):
        source = creer_source()
        source.marquer_erreur("flux introuvable")
        self.assertIn("flux introuvable", source.derniere_erreur)


class TestArticle(TestCase):
    def setUp(self):
        self.source = creer_source()

    def test_creer_article(self):
        article = Article.objects.create(
            titre="Comprendre les transformers",
            lien="https://exemple.com/transformers",
            source=self.source,
            publie_le=timezone.now(),
            resume="Un resume court sur les transformers.",
        )
        self.assertEqual(article.identifiant, "comprendre-les-transformers")
        self.assertTrue(article.identifiant_flux)
        self.assertEqual(article.source, self.source)

    def test_identifiant_unique_pour_deux_articles(self):
        for numero in range(2):
            Article.objects.create(
                titre="Meme titre",
                lien=f"https://exemple.com/article-{numero}",
                source=self.source,
                publie_le=timezone.now(),
            )
        self.assertEqual(Article.objects.filter(titre="Meme titre").count(), 2)

    def test_resume_court(self):
        article = Article.objects.create(
            titre="Titre",
            lien="https://exemple.com/a",
            source=self.source,
            publie_le=timezone.now(),
            resume="a " * 200,
        )
        self.assertLess(len(article.resume_court()), 200)

    def test_incrementer_clics(self):
        article = Article.objects.create(
            titre="Titre",
            lien="https://exemple.com/b",
            source=self.source,
            publie_le=timezone.now(),
        )
        article.incrementer_clics()
        article.refresh_from_db()
        self.assertEqual(article.nombre_clics, 1)

    def test_requete_du_jour(self):
        Article.objects.create(
            titre="Recent",
            lien="https://exemple.com/c",
            source=self.source,
            publie_le=timezone.now(),
        )
        Article.objects.create(
            titre="Vieux",
            lien="https://exemple.com/d",
            source=self.source,
            publie_le=timezone.now() - timedelta(days=5),
        )
        self.assertEqual(Article.objects.du_jour().count(), 1)


class TestOutilsDuFlux(TestCase):
    def test_nettoyer_enleve_le_html(self):
        texte = nettoyer("<p>Bonjour <b>monde</b></p>")
        self.assertEqual(texte, "Bonjour monde")

    def test_image_dans_les_enclosures(self):
        entree = {"enclosures": [{"type": "image/jpeg", "href": "https://exemple.com/i.jpg"}]}
        self.assertEqual(extraire_image(entree), "https://exemple.com/i.jpg")

    def test_image_dans_le_texte(self):
        entree = {"summary": '<img src="https://exemple.com/v.png" />'}
        self.assertEqual(extraire_image(entree), "https://exemple.com/v.png")

    def test_date_absente_renvoie_aujourdhui(self):
        self.assertIsNotNone(extraire_date({}))


class TestApiPublique(APITestCase):
    def setUp(self):
        self.source = creer_source()
        self.sujet = Sujet.objects.create(nom="Machine Learning", mots_cles="machine learning, ml")
        self.article = Article.objects.create(
            titre="Guide du machine learning",
            lien="https://exemple.com/ml",
            source=self.source,
            publie_le=timezone.now(),
            resume="Le guide pour debutter en machine learning.",
        )
        self.article.sujets.add(self.sujet)

    def test_liste_des_articles(self):
        reponse = self.client.get(reverse("article-list"))
        self.assertEqual(reponse.status_code, 200)
        self.assertEqual(reponse.data["count"], 1)

    def test_detail_avec_json_ld(self):
        reponse = self.client.get(reverse("article-detail", args=[self.article.identifiant]))
        self.assertEqual(reponse.status_code, 200)
        self.assertEqual(reponse.data["json_ld"]["@type"], "NewsArticle")

    def test_recherche_par_mot(self):
        reponse = self.client.get(reverse("article-list"), {"mot": "machine learning"})
        self.assertEqual(reponse.data["count"], 1)

    def test_filtre_par_sujet(self):
        reponse = self.client.get(reverse("article-list"), {"sujet": "machine-learning"})
        self.assertEqual(reponse.data["count"], 1)

    def test_clic_source(self):
        reponse = self.client.post(
            reverse("article-clic", args=[self.article.identifiant]),
            {"duree_secondes": 30},
            format="json",
        )
        self.assertEqual(reponse.status_code, 200)
        self.assertEqual(reponse.data["lien"], self.article.lien)

    def test_sujets_avec_articles(self):
        reponse = self.client.get(reverse("sujet-avec-articles"))
        self.assertEqual(len(reponse.data), 1)
