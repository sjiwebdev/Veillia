# VEILLIA

VEILLIA est un agrégateur d'articles de data science et d'intelligence
artificielle. La plateforme lit les flux RSS de plus de cent sources fiables,
conserve les métadonnées utiles et renvoie le lecteur vers le site d'origine.
Aucun article n'est copié ni republié.

Le projet est composé d'une API Django, d'une interface React et de deux
traitements de fond : un agent de résumé et un moteur de similarité sémantique.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Démarrage rapide](#démarrage-rapide)
- [Interface React](#interface-react)
- [Variables d'environnement](#variables-denvironnement)
- [Commandes disponibles](#commandes-disponibles)
- [Tests](#tests)
- [Documentation](#documentation)
- [Organisation Git du groupe](#organisation-git-du-groupe)
- [Fusion sur la branche main](#fusion-sur-la-branche-main)
- [Licence](#licence)

## Fonctionnalités

- Un fil d'articles organisé par date, avec un bloc à la une et des filtres par
  famille, source, auteur, mot-clé et période.
- Douze familles de sujets : machine learning, deep learning, IA générative,
  AI engineering, MLOps, business intelligence, data engineering, data science,
  NLP, vision, gouvernance et cloud.
- Un résumé en français pour chaque article, produit par un agent avec un repli
  local lorsque le service de résumé est indisponible.
- Des recommandations personnelles fondées sur cinq critères : familles suivies,
  proximité sémantique, sources suivies, récence et qualité.
- Un moteur de similarité local qui compare le contenu des articles aux centres
  d'intérêt du membre, sans envoyer de texte à un service externe.
- Des profils complets avec avatar, présentation, fonction, entreprise, pays,
  site web et comptes GitHub et LinkedIn.
- Des suivis de familles, de sources et de mots-clés, avec un poids réglable.
- Un tableau de bord avec les lectures, le temps passé et l'activité par famille.
- Des résumés quotidiens préparés pour un agent n8n et envoyés sur Telegram et
  WhatsApp.
- Un référencement prêt pour les moteurs : `robots.txt`, sitemaps, flux Atom,
  page sans JavaScript et données structurées JSON-LD.
- Une interface responsive avec modes liste et grille, sans chevauchement.

## Architecture

| Application | Rôle | Contenu principal |
| --- | --- | --- |
| `accounts` | Comptes et identité | utilisateur, comptes sociaux, inscription, connexion JWT, OAuth |
| `aggregator` | Contenu | sources, familles, articles, auteurs, étiquettes, collecte RSS, agent de résumé, SEO |
| `recommender` | Personnalisation | suivis, historique, recommandations, canaux, résumés quotidiens, vecteurs |
| `config` | Configuration | réglages Django, routes racine, pagination |
| `frontend` | Interface | React, Vite, Tailwind CSS, pages et composants |

Les dépendances Python sont gérées par [uv](https://docs.astral.sh/uv/). Le
frontend utilise npm.

## Démarrage rapide

### 1. Prérequis

- Python 3.11 ou plus récent
- uv
- Node.js 20 ou plus récent
- Git

### 2. Installation du backend

```bash
uv sync
uv sync --group embeddings
```

Le groupe `embeddings` installe `sentence-transformers` et PyTorch. Il est
facultatif : sans lui, le site fonctionne, mais la page « Pour vous » n'a pas de
part sémantique.

### 3. Configuration

Copier `.env.exemple` en `.env`, puis remplacer les valeurs par les votres.

```bash
cp .env.exemple .env
```

Sous Windows PowerShell :

```powershell
Copy-Item .env.exemple .env
```

Les variables obligatoires sont `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`,
`DJANGO_ALLOWED_HOSTS` et `SITE_URL`. Les clés Gemini, OpenRouter, GitHub et
LinkedIn sont facultatives pour tester la plateforme en local.

### 4. Base de données

```bash
uv run python manage.py migrate
uv run python manage.py seed_sujets
uv run python manage.py seed_sources
uv run python manage.py createsuperuser
```

Pour remplir la base avec des articles réels :

```bash
uv run python manage.py collecter_flux
uv run python manage.py classer_articles
uv run python manage.py enrichir_articles --nombre 50
uv run python manage.py calculer_embeddings
```

Le calcul des vecteurs peut prendre plusieurs minutes. Il ne se lance jamais
pendant une requête HTTP.

### 5. Lancer le backend

```bash
uv run python manage.py runserver
```

| Adresse | Contenu |
| --- | --- |
| `http://localhost:8000/admin/` | administration Django |
| `http://localhost:8000/api/docs/` | documentation Swagger |
| `http://localhost:8000/api/schema/` | schéma OpenAPI |
| `http://localhost:8000/robots.txt` | règles pour les robots |
| `http://localhost:8000/sitemap.xml` | plan du site |

Comptes de démonstration que nous avons utilisés pendant le développement en local : `admin` /
`Veillia2024!` et `demo` / `Demo2024!`.
## Interface React

```bash
cd frontend
npm install
npm run dev
```

L'interface démarre sur `http://localhost:5173`. Elle attend l'API sur
`http://localhost:8000`. L'adresse de nom de domaine est ajoutée dans `frontend/.env` avec `VITE_API_URL`.

Commandes du frontend (cd frontend) :

```bash
npm run lint
npm run build
npm run preview
```

Le détail des pages et des tests d'interface se trouve dans
[`docs/06-guide-tests.md`](docs/06-guide-tests.md).

## Variables d'environnement

Le fichier `.env.exemple` contient la liste complète. Les variables importantes :

| Variable | Rôle |
| --- | --- |
| `DJANGO_SECRET_KEY` | clé de signature de Django |
| `DJANGO_DEBUG` | mode développement, `1` ou `0` |
| `DJANGO_ALLOWED_HOSTS` | hôtes autorisés, séparés par des virgules |
| `DJANGO_TIME_ZONE` | fuseau horaire, `Africa/Abidjan` par défaut |
| `CORS_ALLOWED_ORIGINS` | origines autorisées pour le frontend |
| `SITE_URL` | adresse publique du site |
| `POSTGRES_*` | bascule optionnelle vers PostgreSQL |
| `GEMINI_API_KEY` | clé du service de résumé principal |
| `GEMINI_MODEL` | modèle Gemini utilisé |
| `GEMINI_THINKING_LEVEL` | niveau de raisonnement, `minimal` conseillé |
| `GEMINI_PAUSE` | secondes entre deux appels |
| `OPENROUTER_API_KEY` | clé du service de secours |
| `OPENROUTER_MODEL` | modèle de secours |
| `EMBEDDING_MODELE` | modèle de similarité, `Qwen/Qwen3-Embedding-0.6B` |
| `EMBEDDING_DIMENSION` | dimension des vecteurs, `1024` |
| `EMBEDDING_SEUIL_BAS` | seuil bas de normalisation, `0.35` |
| `EMBEDDING_SEUIL_HAUT` | seuil haut de normalisation, `0.70` |
| `HF_TOKEN` | jeton facultatif pour Hugging Face |
| `GITHUB_CLIENT_ID` | identifiant OAuth GitHub |
| `GITHUB_CLIENT_SECRET` | secret OAuth GitHub |
| `GITHUB_REDIRECT_URI` | retour OAuth GitHub |
| `LINKEDIN_CLIENT_ID` | identifiant OAuth LinkedIn |
| `LINKEDIN_CLIENT_SECRET` | secret OAuth LinkedIn |
| `LINKEDIN_REDIRECT_URI` | retour OAuth LinkedIn |
| `N8N_WEBHOOK_TOKEN` | jeton partagé avec l'agent n8n |

Sans clé Gemini, l'agent de résumé utilise son repli local : les trois premières
phrases de l'article et des notes calculées par des règles simples. La plateforme
reste fonctionnelle.

## Commandes disponibles

| Commande | Rôle |
| --- | --- |
| `seed_sujets` | crée les douze familles de sujets |
| `seed_sources` | ajoute les sources de démonstration ou un fichier JSON ou CSV |
| `collecter_flux` | lit les flux RSS et enregistre les nouveaux articles |
| `classer_articles` | range les articles dans les familles avec les mots-clés |
| `enrichir_articles` | demande un résumé et des notes à l'agent |
| `resume` | génère le résumé d'un article précis, avec mode essai |
| `calculer_embeddings` | calcule les vecteurs des articles et des familles |
| `generer_recommandations` | calcule les recommandations des membres |
| `preparer_resumes` | prépare les résumés quotidiens pour l'agent n8n |
| `jeton_service` | crée un jeton pour un appel de service |

Exemples :

```bash
uv run python manage.py collecter_flux --source towards-data-science
uv run python manage.py resume --id 128 --dry-run
uv run python manage.py calculer_embeddings --simulation
uv run python manage.py calculer_embeddings --articles --limite 100
```

## Tests

La procédure complète est décrite dans
[`docs/06-guide-tests.md`](docs/06-guide-tests.md). Les commandes principales :

```bash
uv run python manage.py check
uv run python manage.py makemigrations --check --dry-run
uv run python manage.py test
uv run ruff check .

cd frontend
npm run lint
npm run build
```

Le guide couvre aussi les tests manuels dans le shell Django, la recette des
pages React et le test de chaque point d'entrée depuis Swagger.

## Documentation

| Document | Contenu |
| --- | --- |
| [`docs/01-cahier-des-charges.md`](docs/01-cahier-des-charges.md) | besoins, acteurs, architecture, diagrammes UML et parcours |
| [`docs/02-agent-resume.md`](docs/02-agent-resume.md) | agent de résumé, prompt, secours OpenRouter, repli local et supervision |
| [`docs/03-n8n-whatsapp-telegram.md`](docs/03-n8n-whatsapp-telegram.md) | workflows n8n de diffusion sur WhatsApp et Telegram |
| [`docs/04-api-et-exploitation.md`](docs/04-api-et-exploitation.md) | points d'entrée, conventions, mise en production et sauvegardes |
| [`docs/05-moteur-embeddings.md`](docs/05-moteur-embeddings.md) | modèle Qwen3, calcul des vecteurs, score à cinq critères et limites |
| [`docs/06-guide-tests.md`](docs/06-guide-tests.md) | tests backend, frontend et API Swagger |
| [`docs/images/agent-resume.svg`](docs/images/agent-resume.svg) | schéma d'architecture de l'agent de résumé |
| [`docs/images/agent-embeddings.svg`](docs/images/agent-embeddings.svg) | schéma d'architecture du moteur de similarité |
| [`docs/sources.json`](docs/sources.json) | liste de sources testées, prête à importer |
| [`docs/n8n/`](docs/n8n/) | workflows n8n à importer directement |

## Organisation Git du groupe

Le projet est réparti sur trois branches de travail, une par membre. Chaque
branche contient tous les commit effectues par chaque auteur.

| Membre | Pseudo | Branche | Adresse de commit |
| --- | --- | --- | --- |
| NGOUMTSOP TEUZEM Yeiayel | `teuzem` | `yeiayel` | `digitalproservicesofficiel@gmail.com` |
| KAMGUENG YOLONG Ariane Sonita | `@Ariane-git` | `ariane` | `sonitakamguen23@gmail.com` |
| TONFACK MATENGUE Elvira Brenda | `MatengueElvira` | `elvira` | `brendaelvira182@gmail.com` |

| Membre | Branche | 
| --- | --- | 
| NGOUMTSOP TEUZEM Yeiayel | `yeiayel` |
| KAMGUENG YOLONG Ariane Sonita | `ariane` | 
| TONFACK MATENGUE Elvira Brenda | `elvira` | 



### Consulter l'historique

```bash
git branch -a
git log --oneline --decorate --graph --all
git log --oneline yeiayel
git log --oneline ariane
git log --oneline elvira
```

### Vérifier l'auteur d'un commit

```bash
git show --stat <identifiant-du-commit>
```

## Fusion sur la branche main

La branche `main` ne contient au départ qu'un commit racine vide. Les trois
branches sont fusionnées à la suite de tous les commit de tous les membres du groupe.

### 1. Se placer sur main et vérifier l'état

```bash
git checkout main
git status
git branch
```

### 2. Fusionner la première branche

```bash
git merge --no-ff yeiayel -m "Fusion de la branche yeiayel"
```

L'option `--no-ff` conserve un commit de fusion explicite. L'historique montre
clairement le passage de la branche à `main`.

### 3. Fusionner la deuxième branche

```bash
git merge --no-ff ariane -m "Fusion de la branche ariane"
```

### 4. Fusionner la troisième branche

```bash
git merge --no-ff elvira -m "Fusion de la branche elvira"
```

### 5. Vérifier le résultat

```bash
git log --oneline --decorate --graph --all
git status
```

L'arbre doit montrer les trois branches reliées à `main` par trois commits de
fusion. Le dossier de travail est donc au complet.

### 6. Lancer les vérifications après fusion

```bash
uv run python manage.py check
uv run python manage.py test
uv run ruff check .

cd frontend
npm.cmd run lint
npm.cmd run build
```

La fusion est terminée lorsque toutes les commandes passent.

### 7. En cas de conflit

Un conflit ne devrait pas apparaître, car chaque fichier appartient à une seule
branche. Si un conflit survient malgré tout :

```bash
git status
```

Ouvrir les fichiers signalés, garder la version qui correspond au travail des
deux branches, puis :

```bash
git add <fichier-resolu>
git commit
```

Pour annuler une fusion non terminée :

```bash
git merge --abort
```

## Envoi vers un dépôt distant

Aucun dépôt distant n'est configuré dans cet environnement. Lorsque le dépôt
GitHub ou GitLab du groupe est créé, exécuter :

```bash
git remote add origin <adresse-du-depot>
git push -u origin main
git push origin yeiayel ariane elvira
```

Vérifier ensuite :

```bash
git remote -v
git branch -vv
```

Les trois branches doivent apparaître sur le dépôt distant, avec `main` comme
branche par défaut.

### Procédure de clonage de ce dépôt git du projet Veillia

1. Cloner le dépôt.
2. Se placer sur `main`.
3. Consulter `git log --graph --oneline --all` pour voir les trois branches et
   leurs commits de fusion.
4. Lancer les tests avec les commandes de la section précédente.
5. Ouvrir `docs/06-guide-tests.md` pour la procédure de recette complète.
6. Ouvrir `http://localhost:8000/api/docs/` après démarrage pour tester l'API.

## Licence

Projet académique, usage pédagogique. 
