"""Tests de l'app recommender."""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from aggregator.models import Article, Source, Sujet

from .models import (
    AbonnementCanal,
    EvenementLecture,
    MotCle,
    Recommandation,
    ResumeQuotidien,
    SuiviSource,
    SuiviSujet,
    VecteurArticle,
    VecteurSujet,
)
from .services.embeddings import normaliser_similarite, similarite_cosinus
from .services.moteur import MoteurRecommendation

Utilisateur = get_user_model()


class TestSuivis(TestCase):
    def setUp(self):
        self.utilisateur = Utilisateur.objects.create_user(
            username="awa", email="awa@veillia.com", password="x"
        )
        self.sujet = Sujet.objects.create(nom="Deep Learning")
        self.source = Source.objects.create(
            nom="Blog IA", site_officiel="https://blog-ia.com", url_flux="https://blog-ia.com/feed"
        )

    def test_suivre_un_sujet(self):
        SuiviSujet.objects.create(utilisateur=self.utilisateur, sujet=self.sujet, poids=0.9)
        self.assertEqual(self.utilisateur.suivis_sujets.count(), 1)

    def test_suivre_une_source(self):
        SuiviSource.objects.create(utilisateur=self.utilisateur, source=self.source)
        self.assertEqual(self.utilisateur.suivis_sources.count(), 1)

    def test_mot_cle_genere_son_identifiant(self):
        mot = MotCle.objects.create(utilisateur=self.utilisateur, mot="Gradient Boosting")
        self.assertEqual(mot.identifiant, "gradient-boosting")


class TestMoteurRecommendation(TestCase):
    def setUp(self):
        self.utilisateur = Utilisateur.objects.create_user(
            username="ira", email="ira@veillia.com", password="x"
        )
        self.sujet_ia = Sujet.objects.create(nom="IA generative", mots_cles="llm")
        self.sujet_bi = Sujet.objects.create(nom="Business intelligence", mots_cles="tableau de bord")

        self.source_a = Source.objects.create(
            nom="Source A", site_officiel="https://a.com", url_flux="https://a.com/feed"
        )
        self.source_b = Source.objects.create(
            nom="Source B", site_officiel="https://b.com", url_flux="https://b.com/feed"
        )

        self.article_ia = Article.objects.create(
            titre="Les nouveaux modeles de langage",
            lien="https://a.com/llm",
            source=self.source_a,
            publie_le=timezone.now() - timedelta(hours=2),
            resume="Panorama des modeles de langage.",
            note_qualite=80,
        )
        self.article_ia.sujets.add(self.sujet_ia)

        self.article_bi = Article.objects.create(
            titre="Tableau de bord pour la direction",
            lien="https://b.com/bi",
            source=self.source_b,
            publie_le=timezone.now() - timedelta(days=6),
            resume="Construire un tableau de bord efficace.",
            note_qualite=40,
        )
        self.article_bi.sujets.add(self.sujet_bi)

        SuiviSujet.objects.create(utilisateur=self.utilisateur, sujet=self.sujet_ia, poids=0.9)
        SuiviSource.objects.create(utilisateur=self.utilisateur, source=self.source_a, poids=0.8)

    def test_le_calcul_privilegie_le_sujet_suivi(self):
        moteur = MoteurRecommendation(self.utilisateur)
        resultats = moteur.calculer(nombre=10)
        self.assertGreaterEqual(len(resultats), 1)
        self.assertEqual(resultats[0]["article"], self.article_ia)

    def test_les_raisons_sont_remplies(self):
        moteur = MoteurRecommendation(self.utilisateur)
        score, raisons, _, _ = moteur.scorer(self.article_ia)
        self.assertGreater(score, 0)
        self.assertTrue(raisons)

    def test_les_articles_deja_lus_sont_exclus(self):
        EvenementLecture.objects.create(
            utilisateur=self.utilisateur,
            article=self.article_ia,
            action=EvenementLecture.Action.CLIC_SOURCE,
        )
        moteur = MoteurRecommendation(self.utilisateur)
        resultats = moteur.calculer(nombre=10)
        self.assertNotIn(self.article_ia, [item["article"] for item in resultats])

    def test_enregistrement_des_recommandations(self):
        MoteurRecommendation(self.utilisateur).generer(nombre=5)
        self.assertTrue(Recommandation.objects.filter(utilisateur=self.utilisateur).exists())


@override_settings(EMBEDDING_MODELE="test", EMBEDDING_DIMENSION=3)
class TestVecteursSemantiques(TestCase):
    def setUp(self):
        self.utilisateur = Utilisateur.objects.create_user(
            username="moussa", email="moussa@veillia.com", password="x"
        )
        self.sujet = Sujet.objects.create(nom="MLOps", description="Cycle de vie des modeles")
        self.source = Source.objects.create(
            nom="Source", site_officiel="https://d.com", url_flux="https://d.com/feed"
        )
        self.article = Article.objects.create(
            titre="Deployer un modele en production",
            lien="https://d.com/deploiement",
            source=self.source,
            publie_le=timezone.now(),
            resume="Un pipeline surveille le modele apres sa mise en production.",
            note_qualite=80,
        )
        SuiviSujet.objects.create(utilisateur=self.utilisateur, sujet=self.sujet, poids=1.0)
        VecteurSujet.objects.create(
            sujet=self.sujet,
            vecteur=[1.0, 0.0, 0.0],
            modele="test",
            dimension=3,
            empreinte="sujet",
        )
        VecteurArticle.objects.create(
            article=self.article,
            vecteur=[0.8, 0.6, 0.0],
            modele="test",
            dimension=3,
            empreinte="article",
        )

    def test_similarite_cosinus(self):
        self.assertAlmostEqual(similarite_cosinus([1, 0], [1, 0]), 1.0)
        self.assertAlmostEqual(similarite_cosinus([1, 0], [0, 1]), 0.0)

    def test_normalisation_de_la_similarite(self):
        from django.conf import settings

        self.assertEqual(normaliser_similarite(settings.EMBEDDING_SEUIL_BAS), 0.0)
        self.assertEqual(normaliser_similarite(settings.EMBEDDING_SEUIL_HAUT), 1.0)
        self.assertGreater(normaliser_similarite(0.50), 0.0)

    def test_le_moteur_ajoute_l_affinite_semantique(self):
        moteur = MoteurRecommendation(self.utilisateur)
        score, raisons, score_semantique, sujet_proche = moteur.scorer(self.article)
        self.assertGreater(score, 0)
        self.assertGreater(score_semantique, 0.9)
        self.assertEqual(sujet_proche["nom"], "MLOps")
        self.assertTrue(any(raison["type"] == "semantique" for raison in raisons))

    def test_l_affinite_est_enregistree(self):
        moteur = MoteurRecommendation(self.utilisateur)
        resultats = moteur.generer(nombre=5)
        self.assertTrue(resultats)
        recommandation = Recommandation.objects.get(
            utilisateur=self.utilisateur, article=self.article
        )
        self.assertGreater(recommandation.score_semantique, 0.9)
        self.assertEqual(recommandation.sujet_proche, self.sujet)


class TestCommandeVecteurs(TestCase):
    def test_la_simulation_ne_charge_pas_le_modele(self):
        from io import StringIO

        from django.core.management import call_command

        sortie = StringIO()
        call_command("calculer_embeddings", "--simulation", stdout=sortie)
        self.assertIn("Articles a calculer", sortie.getvalue())



class TestPondérationEvenements(TestCase):
    def test_un_partage_compte_plus_qu_une_vue(self):
        vue = EvenementLecture(action=EvenementLecture.Action.VUE)
        partage = EvenementLecture(action=EvenementLecture.Action.PARTAGE)
        self.assertGreater(partage.poids_interaction, vue.poids_interaction)


class TestResumeQuotidien(TestCase):
    def setUp(self):
        self.utilisateur = Utilisateur.objects.create_user(
            username="sali", email="sali@veillia.com", password="x"
        )
        self.canal = AbonnementCanal.objects.create(
            utilisateur=self.utilisateur,
            canal=AbonnementCanal.Canal.TELEGRAM,
            destinataire="123456789",
        )

    def test_marquer_envoye(self):
        resume = ResumeQuotidien.objects.create(
            utilisateur=self.utilisateur, canal=self.canal.canal
        )
        resume.marquer_envoye()
        self.assertEqual(resume.etat, ResumeQuotidien.Etat.ENVOYE)
        self.assertIsNotNone(resume.envoye_le)

    def test_marquer_echec(self):
        resume = ResumeQuotidien.objects.create(
            utilisateur=self.utilisateur, canal=self.canal.canal
        )
        resume.marquer_echec("bot bloque")
        self.assertEqual(resume.etat, ResumeQuotidien.Etat.ECHEC)


class TestApiRecommandations(APITestCase):
    def setUp(self):
        self.utilisateur = Utilisateur.objects.create_user(
            username="nadia", email="nadia@veillia.com", password="x"
        )
        self.sujet = Sujet.objects.create(nom="MLOps")
        self.source = Source.objects.create(
            nom="Source", site_officiel="https://c.com", url_flux="https://c.com/feed"
        )
        self.article = Article.objects.create(
            titre="Le MLOps en production",
            lien="https://c.com/mlops",
            source=self.source,
            publie_le=timezone.now(),
            resume="Comment industrialiser un modele.",
        )
        self.article.sujets.add(self.sujet)
        SuiviSujet.objects.create(utilisateur=self.utilisateur, sujet=self.sujet, poids=1.0)

    def test_generer_des_recommandations(self):
        self.client.force_authenticate(user=self.utilisateur)
        reponse = self.client.get(reverse("recommandation-generer"))
        self.assertEqual(reponse.status_code, 200)
        self.assertEqual(len(reponse.data), 1)
        self.assertIn("score_semantique", reponse.data[0])
        self.assertIn("sujet_proche_nom", reponse.data[0])

    def test_etat_du_moteur(self):
        self.client.force_authenticate(user=self.utilisateur)
        reponse = self.client.get(reverse("recommandation-moteur"))
        self.assertEqual(reponse.status_code, 200)
        self.assertIn("articles_vectorises", reponse.data)
        self.assertIn("couverture", reponse.data)

    def test_panorama_public(self):
        reponse = self.client.get(reverse("panorama"))
        self.assertEqual(reponse.status_code, 200)
        self.assertEqual(reponse.data["nombre_articles"], 1)

    def test_tableau_de_bord(self):
        self.client.force_authenticate(user=self.utilisateur)
        reponse = self.client.get(reverse("tableau-de-bord"))
        self.assertEqual(reponse.status_code, 200)
        self.assertEqual(reponse.data["sujets_suivis"], 1)
