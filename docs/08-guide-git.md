# Guide Git

Ce guide décrit notre procede de travail collaboratif sur github dans
le cadre de ce projet dev de groupe, l'envoi vers GitHub et la fusion
des trois branches sur `main`. Il applique le plan détaillé dans
[`07-plan-commits.md`](07-plan-commits.md). Les commandes sont écrites pour
Windows PowerShell et fonctionnent aussi dans Git Bash.

## 1. Avant de commencer

Vérifier que Git est installé et que le dépôt est dans l'état attendu :

```powershell
git --version
git status
git branch --show-current
git remote -v
```

Résultat attendu :

- la branche courante est `main` ;
- le dépôt ne contient encore aucun commit ;
- les 125 fichiers du projet sont non suivis ;
- aucune adresse distante n'est configurée.

La liste complète des fichiers se vérifie avec :

```powershell
git status --porcelain -uall
```

Il faut 125 lignes. Les fichiers `.env`, `db.sqlite3`, `node_modules`, `.venv`
et `dist` ne doivent pas apparaître.

## 2. Régler l'identité Git

L'identité locale sert au commit racine. Les commits de travail utilisent
ensuite l'option `-c`, qui impose l'auteur sans modifier la configuration git globale.

```powershell
git config user.name "Votre nom"
git config user.email "votre-adresseemail"
```

Remplacer les deux valeurs par celles de la personne qui initialise le dépôt.
Vérifier :

```powershell
git config --get user.name
git config --get user.email
```

## 3. Créer le commit racine

Le commit racine est vide. Il donne un point de départ commun aux trois
branches, sans attribuer de fichier à un membre.

```powershell
git commit --allow-empty -m "Initialisation du dépôt VEILLIA"
git log --oneline
```

Le journal doit afficher un seul commit.

## 4. Créer les trois branches

```powershell
git branch yeiayel main
git branch ariane main
git branch elvira main
git branch --list
```

Les trois branches pointent vers le commit racine.

## 5. Exécuter les commits

### Branche `yeiayel`

Auteur : NGOUMTSOP TEUZEM Yeiayel <digitalproservicesofficiel@gmail.com>

```powershell
git checkout yeiayel

# Commit 01
git add -- config/__init__.py config/asgi.py config/wsgi.py config/settings.py config/urls.py config/pagination.py
git -c user.name="NGOUMTSOP TEUZEM Yeiayel" -c user.email="digitalproservicesofficiel@gmail.com" commit -m "Configuration Django du projet"

# Commit 03
git add -- accounts/__init__.py accounts/apps.py accounts/models.py accounts/admin.py accounts/migrations/__init__.py accounts/migrations/0001_initial.py
git -c user.name="NGOUMTSOP TEUZEM Yeiayel" -c user.email="digitalproservicesofficiel@gmail.com" commit -m "Modèles des comptes"

# Commit 04
git add -- accounts/serializers.py accounts/services/__init__.py accounts/services/oauth.py accounts/views.py accounts/urls.py
git -c user.name="NGOUMTSOP TEUZEM Yeiayel" -c user.email="digitalproservicesofficiel@gmail.com" commit -m "Authentification, profils et OAuth"

# Commit 08
git add -- aggregator/llm.py aggregator/services/agent.py aggregator/management/commands/enrichir_articles.py aggregator/management/commands/resume.py
git -c user.name="NGOUMTSOP TEUZEM Yeiayel" -c user.email="digitalproservicesofficiel@gmail.com" commit -m "Agent de résumé et enrichissement"

# Commit 18
git add -- frontend/src/components/ui/AuthLayout.jsx frontend/src/components/ui/Avatar.jsx frontend/src/components/ui/BasculeAffichage.jsx frontend/src/components/ui/FiltreAvance.jsx frontend/src/components/ui/Icons.jsx frontend/src/components/ui/Logo.jsx frontend/src/components/ui/WidgetProfil.jsx
git -c user.name="NGOUMTSOP TEUZEM Yeiayel" -c user.email="digitalproservicesofficiel@gmail.com" commit -m "Composants d'interface"

# Commit 19
git add -- frontend/src/pages/PageConnexion.jsx frontend/src/pages/PageInscription.jsx frontend/src/pages/PageProfil.jsx
git -c user.name="NGOUMTSOP TEUZEM Yeiayel" -c user.email="digitalproservicesofficiel@gmail.com" commit -m "Pages d'authentification et profil"

# Commit 21
git add -- frontend/src/pages/PageRechercheAvancee.jsx frontend/src/pages/PageSujets.jsx frontend/src/pages/PageSujetDetail.jsx
git -c user.name="NGOUMTSOP TEUZEM Yeiayel" -c user.email="digitalproservicesofficiel@gmail.com" commit -m "Pages de recherche et de sujets"

# Commit 26
git add -- docs/03-n8n-whatsapp-telegram.md docs/n8n/veillia-reco-instantanee-telegram.json docs/n8n/veillia-resume-telegram.json docs/n8n/veillia-resume-whatsapp.json
git -c user.name="NGOUMTSOP TEUZEM Yeiayel" -c user.email="digitalproservicesofficiel@gmail.com" commit -m "Documentation n8n et workflows de diffusion"

# Commit 27
git add -- docs/04-api-et-exploitation.md docs/sources.json
git -c user.name="NGOUMTSOP TEUZEM Yeiayel" -c user.email="digitalproservicesofficiel@gmail.com" commit -m "Documentation de l'API et liste des sources"

# Commit 29
git add -- docs/06-guide-tests.md README.md
git -c user.name="NGOUMTSOP TEUZEM Yeiayel" -c user.email="digitalproservicesofficiel@gmail.com" commit -m "Guide de tests et README"
```

### Branche `ariane`

Auteur : KAMGUENG YOLONG Ariane Sonita <sonitakamguen23@gmail.com>

```powershell
git checkout ariane

# Commit 06
git add -- aggregator/management/__init__.py aggregator/management/commands/__init__.py aggregator/management/commands/collecter_flux.py aggregator/services/__init__.py aggregator/services/fetcher.py
git -c user.name="KAMGUENG YOLONG Ariane Sonita" -c user.email="sonitakamguen23@gmail.com" commit -m "Collecte des flux RSS"

# Commit 10
git add -- recommender/__init__.py recommender/apps.py recommender/models.py recommender/admin.py recommender/migrations/__init__.py recommender/migrations/0001_initial.py recommender/migrations/0002_vecteurs_semantiques.py recommender/migrations/0003_libelles_francais.py
git -c user.name="KAMGUENG YOLONG Ariane Sonita" -c user.email="sonitakamguen23@gmail.com" commit -m "Modèles de recommandation"

# Commit 11
git add -- recommender/services/__init__.py recommender/services/embeddings.py recommender/services/moteur.py recommender/management/commands/calculer_embeddings.py
git -c user.name="KAMGUENG YOLONG Ariane Sonita" -c user.email="sonitakamguen23@gmail.com" commit -m "Calcul des vecteurs et moteur de similarité"

# Commit 14
git add -- frontend/package.json frontend/package-lock.json frontend/vite.config.js frontend/tailwind.config.js frontend/.oxlintrc.json
git -c user.name="KAMGUENG YOLONG Ariane Sonita" -c user.email="sonitakamguen23@gmail.com" commit -m "Configuration du frontend"

# Commit 16
git add -- frontend/src/App.jsx frontend/src/main.jsx frontend/src/index.css frontend/src/context/AuthContext.jsx frontend/src/services/api.js frontend/src/services/erreurs.js frontend/src/hooks/useAffichage.js
git -c user.name="KAMGUENG YOLONG Ariane Sonita" -c user.email="sonitakamguen23@gmail.com" commit -m "Entrée de l'application, routes et services"

# Commit 17
git add -- frontend/src/components/Navbar.jsx frontend/src/components/ArticleCard.jsx frontend/src/components/ErrorBoundary.jsx frontend/src/components/RouteProtegee.jsx
git -c user.name="KAMGUENG YOLONG Ariane Sonita" -c user.email="sonitakamguen23@gmail.com" commit -m "Composants de structure"

# Commit 20
git add -- frontend/src/pages/PageAccueil.jsx frontend/src/pages/PageArticleDetail.jsx frontend/src/pages/PageArticlesDuJour.jsx
git -c user.name="KAMGUENG YOLONG Ariane Sonita" -c user.email="sonitakamguen23@gmail.com" commit -m "Pages d'actualité"

# Commit 24
git add -- docs/01-cahier-des-charges.md
git -c user.name="KAMGUENG YOLONG Ariane Sonita" -c user.email="sonitakamguen23@gmail.com" commit -m "Cahier des charges"

# Commit 25
git add -- docs/02-agent-resume.md docs/images/agent-resume.svg
git -c user.name="KAMGUENG YOLONG Ariane Sonita" -c user.email="sonitakamguen23@gmail.com" commit -m "Documentation de l'agent de résumé"

# Commit 28
git add -- docs/05-moteur-embeddings.md docs/images/agent-embeddings.svg
git -c user.name="KAMGUENG YOLONG Ariane Sonita" -c user.email="sonitakamguen23@gmail.com" commit -m "Documentation du moteur de similarité"
```

### Branche `elvira`

Auteur : TONFACK MATENGUE Elvira Brenda <brendaelvira182@gmail.com>

```powershell
git checkout elvira

# Commit 02
git add -- .env.exemple .gitignore .python-version manage.py pyproject.toml uv.lock
git -c user.name="TONFACK MATENGUE Elvira Brenda" -c user.email="brendaelvira182@gmail.com" commit -m "Dépendances et environnement"

# Commit 05
git add -- aggregator/__init__.py aggregator/apps.py aggregator/models.py aggregator/admin.py aggregator/migrations/__init__.py aggregator/migrations/0001_initial.py aggregator/migrations/0002_libelles_francais.py
git -c user.name="TONFACK MATENGUE Elvira Brenda" -c user.email="brendaelvira182@gmail.com" commit -m "Modèles des sources, auteurs et articles"

# Commit 07
git add -- aggregator/management/commands/seed_sources.py aggregator/management/commands/seed_sujets.py aggregator/management/commands/classer_articles.py
git -c user.name="TONFACK MATENGUE Elvira Brenda" -c user.email="brendaelvira182@gmail.com" commit -m "Sources de départ et classement des articles"

# Commit 09
git add -- aggregator/filters.py aggregator/serializers.py aggregator/views.py aggregator/urls.py
git -c user.name="TONFACK MATENGUE Elvira Brenda" -c user.email="brendaelvira182@gmail.com" commit -m "API de contenu et filtres de recherche"

# Commit 12
git add -- recommender/serializers.py recommender/views.py recommender/urls.py recommender/management/__init__.py recommender/management/commands/__init__.py recommender/management/commands/generer_recommandations.py recommender/management/commands/jeton_service.py recommender/management/commands/preparer_resumes.py
git -c user.name="TONFACK MATENGUE Elvira Brenda" -c user.email="brendaelvira182@gmail.com" commit -m "API de recommandation et préparation des envois"

# Commit 13
git add -- accounts/tests.py aggregator/tests.py recommender/tests.py
git -c user.name="TONFACK MATENGUE Elvira Brenda" -c user.email="brendaelvira182@gmail.com" commit -m "Tests du backend"

# Commit 15
git add -- frontend/index.html frontend/.gitignore frontend/public/favicon.svg frontend/README.md
git -c user.name="TONFACK MATENGUE Elvira Brenda" -c user.email="brendaelvira182@gmail.com" commit -m "Page hôte, favicon et documentation du frontend"

# Commit 22
git add -- frontend/src/pages/PagePourVous.jsx frontend/src/pages/PageSuivis.jsx
git -c user.name="TONFACK MATENGUE Elvira Brenda" -c user.email="brendaelvira182@gmail.com" commit -m "Pages personnelles"

# Commit 23
git add -- frontend/src/pages/PageNotifications.jsx frontend/src/pages/PageParametres.jsx frontend/src/pages/PageTableauDeBord.jsx
git -c user.name="TONFACK MATENGUE Elvira Brenda" -c user.email="brendaelvira182@gmail.com" commit -m "Pages de compte et tableau de bord"

# Commit 30
git add -- docs/07-plan-commits.md docs/08-guide-git.md
git -c user.name="TONFACK MATENGUE Elvira Brenda" -c user.email="brendaelvira182@gmail.com" commit -m "Plan de commits et guide Git"
```

## 6. Vérifier les branches

Afficher l'arbre :

```powershell
git log --all --graph --oneline --decorate
```

Afficher les auteurs :

```powershell
git log --all --format="%h | %an | %ae | %s"
```

Chaque commit de travail doit porter le nom et l'adresse de son auteur. Le
commit racine porte l'identité choisie à l'étape 2.

Compter les fichiers par branche :

```powershell
$branches = @("yeiayel", "ariane", "elvira")
foreach ($b in $branches) {
    "$b : $((git ls-tree -r --name-only $b | Measure-Object -Line).Lines) fichiers"
}
```

Résultat attendu :

| Branche | Fichiers |
| --- | --- |
| `yeiayel` | 42 |
| `ariane` | 41 |
| `elvira` | 42 |

Vérifier qu'aucun fichier n'est présent deux fois :

```powershell
$branches = @("yeiayel", "ariane", "elvira")
$files = foreach ($b in $branches) { git ls-tree -r --name-only $b }
"Total : $($files.Count)"
"Uniques : $(($files | Sort-Object -Unique).Count)"
```

Les deux nombres doivent être égaux à 125.

## 7. Créer le dépôt distant

Créer un dépôt vide sur GitHub. Ne pas ajouter de README, de licence ni de
fichier `.gitignore` : le projet les contient déjà.

Nom du repos : `veillia`.

Récupérer l'adresse du dépôt, puis :

```powershell
git remote add origin https://github.com/teuzem/veillia.git
git remote -v
```

Pour GitHub, l'authentification se fait avec un jeton personnel ou une clé SSH.
Le mot de passe du compte n'est plus accepté. Si l'outil `gh` est installé :

```powershell
gh auth login
gh auth setup-git
```

## 8. Pousser les branches

```powershell
git push -u origin main
git push -u origin yeiayel
git push -u origin ariane
git push -u origin elvira
```

Vérifier sur GitHub que `main` et les trois branches sont présentes. Ne pas
supprimer les branches après la fusion : le correcteur doit pouvoir consulter
l'historique de chacune.

## 9. Fusionner sur main

```powershell
git checkout main
git merge --no-ff yeiayel -m "Fusion de la branche yeiayel"
git merge --no-ff ariane -m "Fusion de la branche ariane"
git merge --no-ff elvira -m "Fusion de la branche elvira"
```

L'option `--no-ff` crée un commit de fusion explicite pour chaque branche. Les
fichiers étant répartis entre les branches, aucune fusion ne doit produire de
conflit.

Vérifier l'arbre :

```powershell
git log --oneline --graph --decorate --all
git status
```

Le dossier de travail doit être propre. La branche `main` contient alors le
commit racine, les 30 commits de travail et les 3 commits de fusion, soit 34
commits.

```powershell
git rev-list --count main
```

## 10. Vérifications finales

Créer le fichier `.env` à partir de `.env.exemple` s'il n'existe pas encore,
puis renseigner les clés locales. Le fichier n'est pas versionné.

```powershell
uv sync
uv sync --group embeddings
uv run python manage.py check
uv run python manage.py makemigrations --check --dry-run
uv run python manage.py test
uv run ruff check .
```

Résultat attendu : 47 tests réussis et aucune erreur de migration ou de style.

Pour le frontend :

```powershell
cd frontend
npm.cmd install
npm.cmd run lint
npm.cmd run build
cd ..
```

Le lint ne doit signaler aucune erreur. Quelques avertissements React sont
acceptés, notamment sur les exports de composants et les appels `setState` dans
un effet. Le build doit se terminer sans erreur.

## 11. Pousser la fusion

```powershell
git push origin main
```

Vérifier une dernière fois sur GitHub :

- `main` contient les 125 fichiers ;
- les trois branches sont toujours visibles ;
- le graphe montre les trois fusions ;
- les auteurs des 30 commits sont corrects.

## 12. Problèmes courants

### Un commit porte le mauvais auteur

Tant que le commit n'est pas poussé, corriger le dernier commit :

```powershell
git commit --amend --author="Nom <adresse@users.noreply.github.com>" --no-edit
```

Pour un commit plus ancien, il faut réécrire l'historique avec `git rebase -i`.
Cette opération est réservée à la personne qui maîtrise Git. Dans le doute,
recommencer la branche depuis le commit racine.

### Un fichier a été oublié

Ajouter le fichier au dernier commit :

```powershell
git add -- chemin/du/fichier
git commit --amend --no-edit
```

Si le commit est déjà poussé, créer un nouveau commit au lieu de réécrire
l'historique.

### Un fichier est dans le mauvais commit

Annuler le dernier commit sans perdre les modifications :

```powershell
git reset --soft HEAD~1
git restore --staged .
```

Puis refaire le `git add` et le `git commit` avec la bonne liste de fichiers.

### La fusion signale un conflit

Un conflit ne devrait pas arriver. Si cela se produit :

```powershell
git status
```

Ouvrir les fichiers signalés, garder le contenu attendu, puis :

```powershell
git add -- fichier/resolu
git commit
```

Pour annuler la fusion en cours :

```powershell
git merge --abort
```

### Le push est refusé

Vérifier l'adresse distante et l'authentification :

```powershell
git remote -v
git branch -vv
```

Ne jamais utiliser `git push --force` sur `main` ou sur une branche déjà
partagée.

## 13. Règles à retenir

- Ne pas versionner `.env`, `db.sqlite3`, `node_modules`, `.venv` ou `dist`.
- Ne pas modifier les messages, les auteurs ou les fichiers après le push.
- Ne pas fusionner avant que les trois branches soient poussées et vérifiées.
- Conserver les branches après la fusion.
- En cas de doute, s'arrêter avant le push et comparer avec le plan des commits.
