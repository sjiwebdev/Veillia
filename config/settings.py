"""Reglages du projet VEILLIA.

On lit le fichier .env s'il existe, sinon on garde les valeurs par defaut.
Ca permet de changer de base de donnees ou de cle secrete sans toucher au code.
"""

import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")


def env(nom, defaut=""):
    """Renvoie la variable d'environnement ou la valeur par defaut."""
    return os.environ.get(nom, defaut)


# Cle secrete et mode debug
SECRET_KEY = env("DJANGO_SECRET_KEY", "django-insecure-cle-de-developpement-veillia")
DEBUG = env("DJANGO_DEBUG", "1") == "1"

ALLOWED_HOSTS = [h.strip() for h in env("DJANGO_ALLOWED_HOSTS", "*").split(",") if h.strip()]

# En production on force HTTPS et les cookies securises
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"

# Liste des apps du projet
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sitemaps",
    # nos trois apps
    "accounts",
    "aggregator",
    "recommender",
    # librairies
    "rest_framework",
    "django_filters",
    "corsheaders",
    "drf_spectacular",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Base de donnees : SQLite en local, PostgreSQL si les variables sont remplies
if env("POSTGRES_DB"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("POSTGRES_DB"),
            "USER": env("POSTGRES_USER"),
            "PASSWORD": env("POSTGRES_PASSWORD"),
            "HOST": env("POSTGRES_HOST", "localhost"),
            "PORT": env("POSTGRES_PORT", "5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "fr"
TIME_ZONE = env("DJANGO_TIME_ZONE", "Africa/Abidjan")
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Fichiers televerses par les membres (photos de profil)
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Le compte admin cree par la commande createsuperuser
AUTH_USER_MODEL = "accounts.User"

# Connexion au front React
CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in env(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
    ).split(",")
    if o.strip()
]
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

# Reglages de Django Rest Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticatedOrReadOnly"],
    "DEFAULT_PAGINATION_CLASS": "config.pagination.PaginationVeillia",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DATETIME_FORMAT": "iso-8601",
}

# Documentation automatique de l'API
SPECTACULAR_SETTINGS = {
    "TITLE": "API VEILLIA",
    "DESCRIPTION": "Agregateur d'articles de data science et d'intelligence artificielle",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# JWT
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=14),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# Provider OAuth pour GitHub
GITHUB_CLIENT_ID = env("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = env("GITHUB_CLIENT_SECRET")
GITHUB_REDIRECT_URI = env("GITHUB_REDIRECT_URI", "http://localhost:8000/api/oauth/github/callback/")

# Provider OAuth pour LinkedIn
LINKEDIN_CLIENT_ID = env("LINKEDIN_CLIENT_ID")
LINKEDIN_CLIENT_SECRET = env("LINKEDIN_CLIENT_SECRET")
LINKEDIN_REDIRECT_URI = env("LINKEDIN_REDIRECT_URI", "http://localhost:8000/api/oauth/linkedin/callback/")

# Referencement
SITE_NAME = "VEILLIA"
SITE_URL = env("SITE_URL", "https://veillia.com")
SITE_DESCRIPTION = (
    "VEILLIA regroupe les meilleurs articles de data science et d'intelligence artificielle "
    "issus de plus de 100 sources fiables."
)

# Modele d'embedding utilise pour rapprocher les articles des centres d'interet.
# Le calcul tourne en local sur le processeur, aucun texte n'est envoye a un service externe.
EMBEDDING_MODELE = env("EMBEDDING_MODELE", "Qwen/Qwen3-Embedding-0.6B")
EMBEDDING_DIMENSION = int(env("EMBEDDING_DIMENSION", "1024"))
EMBEDDING_LOT = int(env("EMBEDDING_LOT", "8"))
EMBEDDING_MAX_CARACTERES = int(env("EMBEDDING_MAX_CARACTERES", "1800"))
# Similarite brute en dessous de laquelle l'article est considere comme sans lien.
EMBEDDING_SEUIL_BAS = float(env("EMBEDDING_SEUIL_BAS", "0.35"))
# Similarite brute a partir de laquelle l'affinite est notee 100 sur 100.
EMBEDDING_SEUIL_HAUT = float(env("EMBEDDING_SEUIL_HAUT", "0.70"))
