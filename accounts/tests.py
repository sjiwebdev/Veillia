"""Tests de l'app accounts."""

from django.urls import reverse
from rest_framework.test import APITestCase

from .models import CompteReseau, User


class TestInscription(APITestCase):
    def test_inscription_renvoie_les_jetons(self):
        reponse = self.client.post(
            reverse("inscription"),
            {
                "username": "aminata",
                "email": "aminata@veillia.com",
                "first_name": "Aminata",
                "last_name": "Diallo",
                "mot_de_passe": "Motdepasse2024!",
                "confirmer_mot_de_passe": "Motdepasse2024!",
            },
            format="json",
        )
        self.assertEqual(reponse.status_code, 201)
        self.assertIn("access", reponse.data)
        self.assertEqual(User.objects.count(), 1)

    def test_mots_de_passe_differents(self):
        reponse = self.client.post(
            reverse("inscription"),
            {
                "username": "koffi",
                "email": "koffi@veillia.com",
                "mot_de_passe": "Motdepasse2024!",
                "confirmer_mot_de_passe": "Autre2024!",
            },
            format="json",
        )
        self.assertEqual(reponse.status_code, 400)

    def test_email_deja_utilise(self):
        User.objects.create_user(username="test", email="test@veillia.com", password="x")
        reponse = self.client.post(
            reverse("inscription"),
            {
                "username": "autre",
                "email": "test@veillia.com",
                "mot_de_passe": "Motdepasse2024!",
                "confirmer_mot_de_passe": "Motdepasse2024!",
            },
            format="json",
        )
        self.assertEqual(reponse.status_code, 400)


class TestConnexion(APITestCase):
    def setUp(self):
        self.utilisateur = User.objects.create_user(
            username="fatou",
            email="fatou@veillia.com",
            password="Motdepasse2024!",
            first_name="Fatou",
            last_name="Sarr",
        )

    def test_connexion_reussie(self):
        reponse = self.client.post(
            reverse("connexion"),
            {"username": "fatou", "mot_de_passe": "Motdepasse2024!"},
            format="json",
        )
        self.assertEqual(reponse.status_code, 200)
        self.assertEqual(reponse.data["utilisateur"]["username"], "fatou")

    def test_mot_de_passe_faux(self):
        reponse = self.client.post(
            reverse("connexion"),
            {"username": "fatou", "mot_de_passe": "mauvais"},
            format="json",
        )
        self.assertEqual(reponse.status_code, 400)


class TestProfil(APITestCase):
    def setUp(self):
        self.utilisateur = User.objects.create_user(
            username="moussa",
            email="moussa@veillia.com",
            password="Motdepasse2024!",
            first_name="Moussa",
            last_name="Ba",
        )

    def test_nom_affiche_avec_prenom_et_nom(self):
        self.assertEqual(self.utilisateur.nom_affiche, "Moussa Ba")

    def test_initiales(self):
        self.assertEqual(self.utilisateur.initiales, "MB")

    def test_modifier_le_profil(self):
        self.client.force_authenticate(user=self.utilisateur)
        reponse = self.client.patch(
            reverse("profil"),
            {"fonction": "Data analyst", "pays": "Senegal"},
            format="json",
        )
        self.assertEqual(reponse.status_code, 200)
        self.utilisateur.refresh_from_db()
        self.assertEqual(self.utilisateur.fonction, "Data analyst")

    def test_compte_reseau_github(self):
        compte = CompteReseau.objects.create(
            utilisateur=self.utilisateur,
            reseau=CompteReseau.Reseau.GITHUB,
            identifiant_reseau="12345",
            pseudo_reseau="moussa-ba",
        )
        self.assertTrue(compte.est_github)
        self.assertFalse(compte.est_linkedin)
