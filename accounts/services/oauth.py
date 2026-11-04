"""Connexion aux reseaux professionnels Github et Linkedin.

On fait l'echange de code contre jeton a la main avec requests, c'est court
et ca evite d'ajouter une grosse librairie pour deux reseaux.
"""

import secrets

import requests
from django.conf import settings
from django.db import transaction
from django.utils.text import slugify

from accounts.models import CompteReseau, User

GITHUB_URLS = {
    "autorisation": "https://github.com/login/oauth/authorize",
    "jeton": "https://github.com/login/oauth/access_token",
    "profil": "https://api.github.com/user",
    "portee": "read:user user:email",
}

LINKEDIN_URLS = {
    "autorisation": "https://www.linkedin.com/oauth/v2/authorization",
    "jeton": "https://www.linkedin.com/oauth/v2/accessToken",
    "profil": "https://api.linkedin.com/v2/userinfo",
    "portee": "openid profile email",
}

URLS_PAR_RESEAU = {
    "github": GITHUB_URLS,
    "linkedin": LINKEDIN_URLS,
}

DELAI = 15


class OAuthErreur(Exception):
    """Le reseau social a refuse la demande."""


class OAuthNonConfigure(Exception):
    """Les variables d'environnement du reseau ne sont pas remplies."""


def _identifiants(reseau):
    if reseau == "github":
        return settings.GITHUB_CLIENT_ID, settings.GITHUB_CLIENT_SECRET, settings.GITHUB_REDIRECT_URI
    if reseau == "linkedin":
        return settings.LINKEDIN_CLIENT_ID, settings.LINKEDIN_CLIENT_SECRET, settings.LINKEDIN_REDIRECT_URI
    raise OAuthNonConfigure(f"Reseau inconnu : {reseau}")


def url_autorisation(reseau):
    """Fabrique l'URL vers laquelle on renvoie le navigateur."""
    client_id, secret, redirect_uri = _identifiants(reseau)
    if not client_id or not secret:
        raise OAuthNonConfigure(f"Les identifiants {reseau} ne sont pas configures dans le .env")

    urls = URLS_PAR_RESEAU[reseau]
    return (
        f"{urls['autorisation']}"
        f"?client_id={client_id}"
        f"&redirect_uri={redirect_uri}"
        f"&scope={urls['portee']}"
        f"&state={secrets.token_urlsafe(16)}"
    )


def profil(reseau, code):
    """Echange le code contre un jeton puis renvoie le profil du reseau."""
    client_id, secret, redirect_uri = _identifiants(reseau)
    urls = URLS_PAR_RESEAU[reseau]

    reponse = requests.post(
        urls["jeton"],
        data={
            "client_id": client_id,
            "client_secret": secret,
            "code": code,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        },
        headers={"Accept": "application/json"},
        timeout=DELAI,
    )
    donnees = reponse.json()
    if "access_token" not in donnees:
        raise OAuthErreur(donnees.get("error_description", "Jeton non obtenu."))

    jeton = donnees["access_token"]
    reponse = requests.get(
        urls["profil"],
        headers={"Authorization": f"Bearer {jeton}", "Accept": "application/json"},
        timeout=DELAI,
    )
    infos = reponse.json()
    if reponse.status_code != 200:
        raise OAuthErreur("Profil inaccessible.")

    return _normaliser(reseau, infos)


def _normaliser(reseau, infos):
    """Met les infos Github et Linkedin dans la meme forme."""
    if reseau == "github":
        return {
            "identifiant": str(infos["id"]),
            "pseudo": infos.get("login", ""),
            "nom": infos.get("name") or infos.get("login", ""),
            "email": infos.get("email", ""),
            "photo": infos.get("avatar_url", ""),
            "lien_profil": infos.get("html_url", ""),
        }
    return {
        "identifiant": infos["sub"],
        "pseudo": infos.get("preferred_username", ""),
        "nom": infos.get("name", ""),
        "email": infos.get("email", ""),
        "photo": infos.get("picture", ""),
        "lien_profil": infos.get("profile", ""),
    }


@transaction.atomic
def connecter_ou_creer(reseau, infos):
    """Trouve ou cree le compte VEILLIA associe a ce profil reseau.

    Deux cas :
    - le reseau est deja relie a un utilisateur, on le renvoie
    - le réseau est inconnu, on cree un compte avec le pseudo du reseau
    """
    compte = CompteReseau.objects.filter(
        reseau=reseau,
        identifiant_reseau=infos["identifiant"],
    ).first()

    if compte is not None:
        return compte.utilisateur

    # si un compte VEILLIA porte deja le meme email, on le relie
    utilisateur = None
    if infos["email"]:
        utilisateur = User.objects.filter(email__iexact=infos["email"]).first()

    if utilisateur is None:
        utilisateur = User.objects.create(
            username=_pseudo_libre(infos["pseudo"] or infos["nom"]),
            email=infos["email"] or f"{reseau}-{infos['identifiant']}@veillia.local",
            first_name=_premier_mot(infos["nom"]),
            last_name=_suite(infos["nom"]),
            photo_profil=infos["photo"],
        )
        utilisateur.set_unusable_password()
        utilisateur.save()

    CompteReseau.objects.create(
        utilisateur=utilisateur,
        reseau=reseau,
        identifiant_reseau=infos["identifiant"],
        pseudo_reseau=infos["pseudo"],
        lien_profil=infos["lien_profil"],
        photo_profil=infos["photo"],
    )
    return utilisateur


def _pseudo_libre(pseudo):
    """Ajoute un nombre si le pseudo est deja pris."""
    base = slugify(pseudo)[:24] or "membre"
    candidat = base
    numero = 1
    while User.objects.filter(username=candidat).exists():
        numero += 1
        candidat = f"{base}{numero}"
    return candidat


def _premier_mot(nom):
    mots = (nom or "").split()
    return mots[0] if mots else ""


def _suite(nom):
    mots = (nom or "").split()
    return " ".join(mots[1:]) if len(mots) > 1 else ""
