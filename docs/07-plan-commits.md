# Plan de commits

Cette documentation décrit la répartition du projet entre les membres de notre groupe
sur trois branches crees pour chacun d'entre nous. 
Les commandes d'exécution se trouvent dans [`08-guide-git.md`](08-guide-git.md).

## 1. Principes de notre groupe

- Le dépôt cree par yeiayel sur `main` est vide.
- Les 125 fichiers du projet ont ete poussees sur github en 30 commits que nous avons numérotés de 01 à 30.
- Chaque fichier apparaît dans un seul commit et sur une seule branche.
- Chaque membre a eu a réaliser 10 commits.
- Chaque commit porte l'identité de son auteur (email, pseudo git)

## 2. Répartition générale

| Membre | Branche | Commits | Fichiers | Nombre de Lignes de code |
| --- | --- | --- | --- | --- |
| NGOUMTSOP TEUZEM Yeiayel | `yeiayel` | 10 | 42 | 6159 |
| KAMGUENG YOLONG Ariane Sonita | `ariane` | 10 | 41 | 6118 |
| TONFACK MATENGUE Elvira Brenda | `elvira` | 10 | 42 | 6434 |
| **Total** | | **30** | **125** | **18711** |

Les lignes excluent `uv.lock` et `package-lock.json`.

## 3. Liste des commits de chacun

| N° | Branche | Auteur | Message | Fichiers |
| --- | --- | --- | --- | --- |
| 01 | `yeiayel` | Yeiayel | Configuration Django du projet | 6 |
| 02 | `elvira` | Elvira | Dépendances et environnement | 6 |
| 03 | `yeiayel` | Yeiayel | Modèles des comptes | 6 |
| 04 | `yeiayel` | Yeiayel | Authentification, profils et OAuth | 5 |
| 05 | `elvira` | Elvira | Modèles des sources, auteurs et articles | 7 |
| 06 | `ariane` | Ariane | Collecte des flux RSS | 5 |
| 07 | `elvira` | Elvira | Sources de départ et classement des articles | 3 |
| 08 | `yeiayel` | Yeiayel | Agent de résumé et enrichissement | 4 |
| 09 | `elvira` | Elvira | API de contenu et filtres de recherche | 4 |
| 10 | `ariane` | Ariane | Modèles de recommandation | 8 |
| 11 | `ariane` | Ariane | Calcul des vecteurs et moteur de similarité | 4 |
| 12 | `elvira` | Elvira | API de recommandation et préparation des envois | 8 |
| 13 | `elvira` | Elvira | Tests du backend | 3 |
| 14 | `ariane` | Ariane | Configuration du frontend | 5 |
| 15 | `elvira` | Elvira | Page hôte, favicon et documentation du frontend | 4 |
| 16 | `ariane` | Ariane | Entrée de l'application, routes et services | 7 |
| 17 | `ariane` | Ariane | Composants de structure | 4 |
| 18 | `yeiayel` | Yeiayel | Composants d'interface | 7 |
| 19 | `yeiayel` | Yeiayel | Pages d'authentification et profil | 3 |
| 20 | `ariane` | Ariane | Pages d'actualité | 3 |
| 21 | `yeiayel` | Yeiayel | Pages de recherche et de sujets | 3 |
| 22 | `elvira` | Elvira | Pages personnelles | 2 |
| 23 | `elvira` | Elvira | Pages de compte et tableau de bord | 3 |
| 24 | `ariane` | Ariane | Cahier des charges | 1 |
| 25 | `ariane` | Ariane | Documentation de l'agent de résumé | 2 |
| 26 | `yeiayel` | Yeiayel | Documentation n8n et workflows de diffusion | 4 |
| 27 | `yeiayel` | Yeiayel | Documentation de l'API et liste des sources | 2 |
| 28 | `ariane` | Ariane | Documentation du moteur de similarité | 2 |
| 29 | `yeiayel` | Yeiayel | Guide de tests et README | 2 |
| 30 | `elvira` | Elvira | Resume de commits des membres de l'equipe et guide Git | 2 |

## 4. Détail des fichiers

### Branche `yeiayel`

Auteur : NGOUMTSOP TEUZEM Yeiayel
Adresse email: digitalproservicesofficiel@gmail.com
Total : 10 commits, 42 fichiers, 6159 lignes.

#### 01. Configuration Django du projet

Fichiers (6) :

- `config/__init__.py`
- `config/asgi.py`
- `config/wsgi.py`
- `config/settings.py`
- `config/urls.py`
- `config/pagination.py`

#### 03. Modèles des comptes

Fichiers (6) :

- `accounts/__init__.py`
- `accounts/apps.py`
- `accounts/models.py`
- `accounts/admin.py`
- `accounts/migrations/__init__.py`
- `accounts/migrations/0001_initial.py`

#### 04. Authentification, profils et OAuth

Fichiers (5) :

- `accounts/serializers.py`
- `accounts/services/__init__.py`
- `accounts/services/oauth.py`
- `accounts/views.py`
- `accounts/urls.py`

#### 08. Agent de résumé et enrichissement

Fichiers (4) :

- `aggregator/llm.py`
- `aggregator/services/agent.py`
- `aggregator/management/commands/enrichir_articles.py`
- `aggregator/management/commands/resume.py`

#### 18. Composants d'interface

Fichiers (7) :

- `frontend/src/components/ui/AuthLayout.jsx`
- `frontend/src/components/ui/Avatar.jsx`
- `frontend/src/components/ui/BasculeAffichage.jsx`
- `frontend/src/components/ui/FiltreAvance.jsx`
- `frontend/src/components/ui/Icons.jsx`
- `frontend/src/components/ui/Logo.jsx`
- `frontend/src/components/ui/WidgetProfil.jsx`

#### 19. Pages d'authentification et profil

Fichiers (3) :

- `frontend/src/pages/PageConnexion.jsx`
- `frontend/src/pages/PageInscription.jsx`
- `frontend/src/pages/PageProfil.jsx`

#### 21. Pages de recherche et de sujets

Fichiers (3) :

- `frontend/src/pages/PageRechercheAvancee.jsx`
- `frontend/src/pages/PageSujets.jsx`
- `frontend/src/pages/PageSujetDetail.jsx`

#### 26. Documentation n8n et workflows de diffusion

Fichiers (4) :

- `docs/03-n8n-whatsapp-telegram.md`
- `docs/n8n/veillia-reco-instantanee-telegram.json`
- `docs/n8n/veillia-resume-telegram.json`
- `docs/n8n/veillia-resume-whatsapp.json`

#### 27. Documentation de l'API et liste des sources

Fichiers (2) :

- `docs/04-api-et-exploitation.md`
- `docs/sources.json`

#### 29. Guide de tests et README

Fichiers (2) :

- `docs/06-guide-tests.md`
- `README.md`

### Branche `ariane`

Auteur : KAMGUENG YOLONG Ariane Sonita
Adresse email : sonitakamguen23@gmail.com
Total : 10 commits, 41 fichiers, 6118 lignes.

#### 06. Collecte des flux RSS

Fichiers (5) :

- `aggregator/management/__init__.py`
- `aggregator/management/commands/__init__.py`
- `aggregator/management/commands/collecter_flux.py`
- `aggregator/services/__init__.py`
- `aggregator/services/fetcher.py`

#### 10. Modèles de recommandation

Fichiers (8) :

- `recommender/__init__.py`
- `recommender/apps.py`
- `recommender/models.py`
- `recommender/admin.py`
- `recommender/migrations/__init__.py`
- `recommender/migrations/0001_initial.py`
- `recommender/migrations/0002_vecteurs_semantiques.py`
- `recommender/migrations/0003_libelles_francais.py`

#### 11. Calcul des vecteurs et moteur de similarité

Fichiers (4) :

- `recommender/services/__init__.py`
- `recommender/services/embeddings.py`
- `recommender/services/moteur.py`
- `recommender/management/commands/calculer_embeddings.py`

#### 14. Configuration du frontend

Fichiers (5) :

- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/vite.config.js`
- `frontend/tailwind.config.js`
- `frontend/.oxlintrc.json`

#### 16. Entrée de l'application, routes et services

Fichiers (7) :

- `frontend/src/App.jsx`
- `frontend/src/main.jsx`
- `frontend/src/index.css`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/services/api.js`
- `frontend/src/services/erreurs.js`
- `frontend/src/hooks/useAffichage.js`

#### 17. Composants de structure

Fichiers (4) :

- `frontend/src/components/Navbar.jsx`
- `frontend/src/components/ArticleCard.jsx`
- `frontend/src/components/ErrorBoundary.jsx`
- `frontend/src/components/RouteProtegee.jsx`

#### 20. Pages d'actualité

Fichiers (3) :

- `frontend/src/pages/PageAccueil.jsx`
- `frontend/src/pages/PageArticleDetail.jsx`
- `frontend/src/pages/PageArticlesDuJour.jsx`

#### 24. Cahier des charges

Fichiers (1) :

- `docs/01-cahier-des-charges.md`

#### 25. Documentation de l'agent de résumé

Fichiers (2) :

- `docs/02-agent-resume.md`
- `docs/images/agent-resume.svg`

#### 28. Documentation du moteur de similarité

Fichiers (2) :

- `docs/05-moteur-embeddings.md`
- `docs/images/agent-embeddings.svg`

### Branche `elvira`

Auteur : TONFACK MATENGUE Elvira Brenda
Adresse : brendaelvira182@gmail.com
Total : 10 commits, 42 fichiers, 6434 lignes.

#### 02. Dépendances et environnement

Fichiers (6) :

- `.env.exemple`
- `.gitignore`
- `.python-version`
- `manage.py`
- `pyproject.toml`
- `uv.lock`

#### 05. Modèles des sources, auteurs et articles

Fichiers (7) :

- `aggregator/__init__.py`
- `aggregator/apps.py`
- `aggregator/models.py`
- `aggregator/admin.py`
- `aggregator/migrations/__init__.py`
- `aggregator/migrations/0001_initial.py`
- `aggregator/migrations/0002_libelles_francais.py`

#### 07. Sources de départ et classement des articles

Fichiers (3) :

- `aggregator/management/commands/seed_sources.py`
- `aggregator/management/commands/seed_sujets.py`
- `aggregator/management/commands/classer_articles.py`

#### 09. API de contenu et filtres de recherche

Fichiers (4) :

- `aggregator/filters.py`
- `aggregator/serializers.py`
- `aggregator/views.py`
- `aggregator/urls.py`

#### 12. API de recommandation et préparation des envois

Fichiers (8) :

- `recommender/serializers.py`
- `recommender/views.py`
- `recommender/urls.py`
- `recommender/management/__init__.py`
- `recommender/management/commands/__init__.py`
- `recommender/management/commands/generer_recommandations.py`
- `recommender/management/commands/jeton_service.py`
- `recommender/management/commands/preparer_resumes.py`

#### 13. Tests du backend

Fichiers (3) :

- `accounts/tests.py`
- `aggregator/tests.py`
- `recommender/tests.py`

#### 15. Page hôte, favicon et documentation du frontend

Fichiers (4) :

- `frontend/index.html`
- `frontend/.gitignore`
- `frontend/public/favicon.svg`
- `frontend/README.md`

#### 22. Pages personnelles

Fichiers (2) :

- `frontend/src/pages/PagePourVous.jsx`
- `frontend/src/pages/PageSuivis.jsx`

#### 23. Pages de compte et tableau de bord

Fichiers (3) :

- `frontend/src/pages/PageNotifications.jsx`
- `frontend/src/pages/PageParametres.jsx`
- `frontend/src/pages/PageTableauDeBord.jsx`

#### 30. Plan de commits et guide Git

Fichiers (2) :

- `docs/07-plan-commits.md`
- `docs/08-guide-git.md`


## 5. Vérifier la couverture

Avant de commencer, la commande suivante va lister 125 fichiers non suivis :

```powershell
git status --porcelain -uall
```

Après les trois branches, les fichiers sont répartis ainsi :

| Branche | Fichiers |
| --- | --- |
| `yeiayel` | 42 |
| `ariane` | 41 |
| `elvira` | 42 |

La somme fait 125. Pour vérifier qu'aucun fichier n'est présent deux fois :

```powershell
$branches = @("yeiayel", "ariane", "elvira")
$files = foreach ($b in $branches) { git ls-tree -r --name-only $b }
"Total : $($files.Count)"
"Uniques : $(($files | Sort-Object -Unique).Count)"
```

Après la fusion sur `main`, la même vérification s'applique :

```powershell
(git ls-tree -r --name-only main | Measure-Object -Line).Lines
```

## 6. Ordre d'exécution

1. Création du commit racine vide sur `main`.
2. Création des branches `yeiayel`, `ariane` et `elvira` depuis `main`.
3. Exécution des commits de la branche `yeiayel`.
4. Exécution des commits de la branche `ariane`.
5. Exécution des commits de la branche `elvira`.
6. Vérification des auteurs et la couverture des fichiers.
7. Création du dépôt distant, pour pousser `main` et les trois branches.
8. Fusion des trois branches sur `main` avec `--no-ff`, par `yeiayel`
9. Lancer les tests et les vérifications du projet en ligne.

Les commandes utilisees sont dans [`08-guide-git.md`](08-guide-git.md).