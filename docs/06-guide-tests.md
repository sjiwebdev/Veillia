# Guide de tests de VEILLIA

Ce guide décrit la procédure de vérification complète de la plateforme : tests
automatisés du backend, vérifications manuelles dans le shell Django, tests de
l'interface React et recette de chaque point d'entrée de l'API depuis Swagger.

## 1. Préparation de l'environnement

### 1.1 Installer les dépendances

```bash
uv sync
uv sync --group embeddings
```

Le premier groupe installe Django et l'API. Le second installe le moteur de
similarité. Il est facultatif : sans lui, le site fonctionne, mais la page
« Pour vous » ne charge pas les recommandations issues de l'embeding sémantique.

### 1.2 Configurer le fichier `.env`

Copier `.env.exemple` en `.env`, puis renseigner au minimum :

```bash
DJANGO_SECRET_KEY=une-cle-locale
DJANGO_DEBUG=1
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
SITE_URL=http://localhost:8000
```

Les clés Gemini, OpenRouter, GitHub et LinkedIn ne sont pas nécessaires pour
tester le fonctionnement général. Sans clé Gemini, l'agent de résumé utilise son
repli local.

### 1.3 Préparer la base

```bash
uv run python manage.py migrate
uv run python manage.py seed_sujets
uv run python manage.py seed_sources
uv run python manage.py createsuperuser
```

Pour une base de démo utiliser :

```bash
uv run python manage.py collecter_flux
uv run python manage.py classer_articles
uv run python manage.py enrichir_articles --nombre 50
uv run python manage.py calculer_embeddings
```

### 1.4 Lancer les deux serveurs

Dans un premier terminal, à la racine du projet :

```bash
uv run python manage.py runserver
```

Dans un second terminal, dans le dossier `frontend` (cd frontend): 

```bash
npm install
npm run dev
```

L'API répond sur `http://localhost:8000`. L'interface sur
`http://localhost:5173`.

## 2. Tests automatiques du backend

### 2.1 Vérification de la configuration Django

```bash
uv run python manage.py check
```

Résultat attendu : `System check identified no issues (0 silenced).`

Cette commande détecte les erreurs de modèle, d'import, de route et de réglage.
Elle doit être lancée après chaque modification de `settings.py` ou d'un fichier
`urls.py`.

### 2.2 Vérification des migrations

```bash
uv run python manage.py makemigrations --check --dry-run
```

Résultat attendu : `No changes detected.`

Si Django propose une migration, un modèle a été modifié sans que la migration
correspondante soit créée. Il faut générer la migration et la relire avant de la
versionner.

### 2.3 Lancer toute la suite

```bash
uv run python manage.py test
```

Les tests sont répartis dans trois fichiers :

| Fichier | Ce qu'il couvre |
| --- | --- |
| `accounts/tests.py` | inscription, connexion, profil, initiales, compte réseau |
| `aggregator/tests.py` | modèles, collecte, nettoyage, API articles, filtres, clics |
| `recommender/tests.py` | suivis, moteur, similarité, recommandations, résumés, tableau de bord |

Pour voir le nom de chaque test :

```bash
uv run python manage.py test -v 2
```

### 2.4 Lancer une seule application

```bash
uv run python manage.py test accounts
uv run python manage.py test aggregator
uv run python manage.py test recommender
```

Cette forme est utile pendant le développement : elle évite d'attendre les
autres suites.

### 2.5 Lancer une seule classe de tests

```bash
uv run python manage.py test recommender.tests.MoteurRecommendationTests -v 2
```

Le nom de la classe se lit dans le fichier de tests. La sortie détaille chaque
méthode et affiche un point par test réussi.

### 2.6 Vérifier le style du code Python

```bash
uv run ruff check .
```

Résultat attendu : `All checks passed!`

Ruff vérifie les imports, les variables inutilisées, les espaces et les erreurs
courantes. Les migrations sont exclues de la vérification dans `pyproject.toml`,
car elles sont générées par Django.

## 3. Vérifications manuelles dans le shell Django

Le shell permet de tester une fonction sans passer par l'interface. Les
commandes ci-dessous sont en lecture seule, sauf mention contraire.

### 3.1 Compter les objets principaux

```bash
uv run python manage.py shell -c "from aggregator.models import Article, Source, Sujet; print('articles', Article.objects.count()); print('visibles', Article.objects.visibles().count()); print('sources', Source.objects.count()); print('sujets', Sujet.objects.count())"
```

Résultat attendu : des nombres cohérents avec la base. Sur la base de
démonstration : 2 458 articles visibles, 12 familles de sujets.

### 3.2 Vérifier l'agent de résumé

```bash
uv run python manage.py shell -c "from aggregator.services.agent import AgentResume; print('configure', AgentResume().est_configure)"
```

Sans clé API, la valeur est `False`. L'agent doit alors utiliser le repli local,
ce qui est le comportement attendu.

Tester le repli sur un texte court :

```bash
uv run python manage.py shell -c "from aggregator.services.agent import resume_simple, noter_simple; t='Premiere phrase. Deuxieme phrase. Troisieme phrase. Quatrieme phrase.'; print(resume_simple('Titre', t)); print(noter_simple('Titre', t))"
```

Le résumé doit s'arrêter à la troisième phrase. Les notes doivent rester entre
0 et 100.

### 3.3 Vérifier l'état des embeddings

```bash
uv run python manage.py shell -c "from recommender.services.embeddings import etat_moteur; print(etat_moteur())"
```

La réponse contient le modèle, la dimension, le nombre d'articles vectorisés, le
nombre de familles vectorisées et la couverture. Une couverture de `1.0` signifie
que tous les articles visibles ont un vecteur.

### 3.4 Vérifier la similarité

```bash
uv run python manage.py shell -c "from recommender.services.embeddings import similarite_cosinus, normaliser_similarite; print('identiques', similarite_cosinus([1,0],[1,0])); print('opposes', similarite_cosinus([1,0],[0,1])); print('normalise 0.35', normaliser_similarite(0.35)); print('normalise 0.70', normaliser_similarite(0.70))"
```

Résultat attendu : `1.0`, `0.0`, `0.0`, `1.0`.

### 3.5 Vérifier le moteur de recommandation

```bash
uv run python manage.py shell -c "from django.contrib.auth import get_user_model; from recommender.services.moteur import MoteurRecommendation; U=get_user_model(); u=U.objects.first(); print(u.username if u else 'aucun membre'); print(len(MoteurRecommendation(u).calculer(5)) if u else 0)"
```

La commande affiche un membre et le nombre de recommandations calculées. Elle ne
modifie pas la base : `calculer` n'enregistre rien.

### 3.6 Vérifier les jetons JWT

```bash
uv run python manage.py shell -c "from django.contrib.auth import get_user_model; from rest_framework_simplejwt.tokens import RefreshToken; U=get_user_model(); u=U.objects.first(); r=RefreshToken.for_user(u); print('access', str(r.access_token)[:20]); print('refresh', str(r)[:20])"
```

Les deux jetons doivent être générés sans erreur.

### 3.7 Vérifier les filtres d'articles

```bash
uv run python manage.py shell -c "from aggregator.models import Article; print('a la une', Article.objects.filter(a_la_une=True).count()); print('du jour', Article.objects.du_jour().count()); print('sans resume', Article.objects.filter(resume='').count())"
```

Ces trois compteurs servent de repère avant et après une collecte.

### 3.8 Vérifier les résumés quotidiens

```bash
uv run python manage.py shell -c "from recommender.models import ResumeQuotidien; print('en attente', ResumeQuotidien.objects.filter(etat='en_attente').count()); print('envoyes', ResumeQuotidien.objects.filter(etat='envoye').count())"
```

### 3.9 Vérifier une date et un fuseau

```bash
uv run python manage.py shell -c "from django.utils import timezone; print(timezone.now()); print(timezone.localdate())"
```

La date doit correspondre au fuseau `Africa/Abidjan` configuré dans `.env`.

## 4. Tests automatiques du frontend

### 4.1 Installation

```bash
cd frontend
npm install
```

Sous Windows, si la stratégie d'exécution bloque `npm`, utiliser `npm.cmd` :

```powershell
npm.cmd install
```

### 4.2 Analyse statique

```bash
npm run lint
```

Résultat attendu : aucune erreur. Un avertissement isolé sur une variable
inutilisée doit être corrigé avant le rendu.

### 4.3 Build de production

```bash
npm run build
```

Le build doit se terminer sans erreur et créer le dossier `frontend/dist`. Ce
dossier n'est pas versionné. Il prouve que les imports, les routes et les
composants se compilent.

### 4.4 Prévisualiser le build

```bash
npm run preview
```

L'interface s'ouvre sur un port local, généralement `http://localhost:4173`.
Cette étape vérifie le comportement du code compilé, différent du mode
développement.

## 5. Recette manuelle de l'interface

### 5.1 Pages publiques

| Page | Adresse | Points à vérifier |
| --- | --- | --- |
| Accueil | `/` | logo, bloc à la une, fil d'articles, familles, pagination |
| Articles du jour | `/articles-du-jour` | date du jour, compteur, cartes, passage liste et grille |
| Recherche | `/recherche` | mot-clé, filtre par famille, filtre par source, filtre par date |
| Détail d'un article | `/articles/<identifiant>` | titre, image, résumé, source, bouton de lecture, articles proches |
| Familles | `/sujets` | douze familles, compteur d'articles, couleur |
| Détail d'une famille | `/sujets/<identifiant>` | articles filtrés, tri, pagination |
| Profil public | `/membre/<pseudo>` | nom, fonction, réseaux, articles lus publics |

### 5.2 Pages connectées

Se connecter avec un compte de test, puis vérifier :

| Page | Adresse | Points à vérifier |
| --- | --- | --- |
| Pour vous | `/pour-vous` | recommandations, badge d'affinité, raison affichée, carte d'état du moteur |
| Tableau de bord | `/tableau-de-bord` | nombre de lectures, temps passé, graphique des sept jours, familles actives |
| Suivis | `/suivis` | ajout et retrait d'une famille, d'une source, d'un mot-clé |
| Profil | `/profil` | modification du nom, de la fonction, de l'entreprise, du pays, du site |
| Paramètres | `/parametres` | onglets compte, sécurité, notifications, apparence |
| Notifications | `/notifications` | canaux Telegram, WhatsApp et email, activation et désactivation |

### 5.3 Authentification

| Scénario | Résultat attendu |
| --- | --- |
| inscription avec un pseudo libre | compte créé, redirection vers l'accueil, session active |
| inscription avec un pseudo existant | message d'erreur sous le champ |
| inscription avec deux mots de passe différents | message d'erreur, aucun compte créé |
| connexion valide | redirection, avatar visible dans la barre |
| connexion avec un mauvais mot de passe | message d'erreur, session inchangée |
| accès à une page privée sans session | redirection vers la connexion |
| déconnexion | jetons effacés, retour à l'accueil |

### 5.4 Responsive et affichage

Tester les largeurs 375 px, 768 px, 1 024 px et 1 440 px.

| Point | Vérification |
| --- | --- |
| Barre de navigation | menu mobile ouvert et fermé, aucun chevauchement |
| Cartes d'articles | texte tronqué proprement, image à l'échelle |
| Bascule liste et grille | le choix reste actif après rechargement |
| Logo | texte VEILLIA seul, sans icône d'article |
| Pied de page | colonnes empilées sur mobile |
| Formulaires | champs lisibles, boutons accessibles au clavier |
| Tableau de bord | graphique et chiffres lisibles sans débordement |

### 5.5 Vérifier la persistance de session

1. Se connecter.
2. Recharger la page : la session doit rester active.
3. Fermer l'onglet, rouvrir l'application : la session doit rester active tant
   que le jeton de rafraîchissement est valide.
4. Attendre soixante minutes : le jeton d'accès expire, le front doit le
   rafraîchir automatiquement.
5. Se déconnecter : les jetons doivent disparaître du stockage local.

## 6. Tests de l'API depuis Swagger

### 6.1 Ouvrir la documentation

Démarrer Django, puis ouvrir :

```text
http://localhost:8000/api/docs/
```

Le schéma brut est disponible sur :

```text
http://localhost:8000/api/schema/
```

Swagger liste tous les points d'entrée, les paramètres, les corps de requête et
les codes de réponse. Chaque route peut être testée avec le bouton « Try it
out ».

### 6.2 Obtenir un jeton

Dans Swagger, ouvrir `POST /api/connexion/`, cliquer sur « Try it out », puis
envoyer :

```json
{
  "username": "demo",
  "mot_de_passe": "Demo2024!"
}
```

La réponse contient `access`, `refresh` et le profil. Copier la valeur de
`access`.

Cliquer sur le bouton « Authorize » en haut de la page, coller uniquement le
jeton, puis valider. Swagger ajoute lui-même le préfixe `Bearer`.

Pour vérifier que le jeton fonctionne, appeler `GET /api/profil/`. La réponse
doit être `200` avec le profil du membre. Sans jeton, la réponse doit être `401`.

### 6.3 Tester les points d'entrée des comptes

| Méthode | Route | Corps ou paramètre | Code attendu |
| --- | --- | --- | --- |
| POST | `/api/inscription/` | pseudo, email, prénom, nom, deux mots de passe | 201 |
| POST | `/api/connexion/` | `username`, `mot_de_passe` | 200 |
| GET | `/api/profil/` | jeton | 200 |
| PATCH | `/api/profil/` | `{"fonction": "Data analyst"}` | 200 |
| POST | `/api/profil/mot-de-passe/` | ancien et nouveau mot de passe | 200 |
| GET | `/api/profil/demo/` | aucun | 200 |
| POST | `/api/profil/photo/` | fichier image en multipart | 200 |
| POST | `/api/jeton/rafraichir/` | `{"refresh": "<jeton>"}` | 200 |
| GET | `/api/comptes-reseaux/` | jeton | 200 |
| POST | `/api/comptes-reseaux/` | `{"reseau": "github", "pseudo_reseau": "demo"}` | 201 |
| PATCH | `/api/comptes-reseaux/<id>/` | `{"pseudo_reseau": "demo2"}` | 200 |
| DELETE | `/api/comptes-reseaux/<id>/` | jeton | 204 |

Exemple de corps d'inscription :

```json
{
  "username": "ariane",
  "email": "arianesonita@gmail.com",
  "first_name": "Ariane Sonita",
  "last_name": "KANGUEM",
  "mot_de_passe": "Motdepasse2026!",
  "confirmer_mot_de_passe": "Motdepasse2026!"
}
```

Cas d'erreur à vérifier :

- inscription avec un email déjà utilisé : `400` ;
- inscription avec deux mots de passe différents : `400` ;
- connexion avec un mauvais mot de passe : `400` ;
- appel à `/api/profil/` sans jeton : `401` ;
- changement de mot de passe avec un ancien mot de passe faux : `400`.

Les routes OAuth ne se testent pas entièrement dans Swagger : elles redirigent
vers GitHub ou LinkedIn. Vérifier au minimum que
`GET /api/oauth/github/` renvoie une redirection `302` lorsque les clés sont
configurées, et un message clair lorsqu'elles ne le sont pas.

### 6.4 Tester les points d'entrée du contenu

| Méthode | Route | Paramètre | Code attendu |
| --- | --- | --- | --- |
| GET | `/api/articles/` | aucun | 200 |
| GET | `/api/articles/?page=2&taille=10` | pagination | 200 |
| GET | `/api/articles/?sujet=deep-learning` | filtre famille | 200 |
| GET | `/api/articles/?source=...` | filtre source | 200 |
| GET | `/api/articles/?mot=rag` | recherche texte | 200 |
| GET | `/api/articles/?depuis=24` | dernières 24 heures | 200 |
| GET | `/api/articles/?ordering=-note_qualite` | tri | 200 |
| GET | `/api/articles/une/` | aucun | 200 |
| GET | `/api/articles/du_jour/` | aucun | 200 |
| GET | `/api/articles/<identifiant>/` | identifiant | 200 |
| GET | `/api/articles/<identifiant>/similaires/` | identifiant | 200 |
| POST | `/api/articles/<identifiant>/clic/` | aucun corps | 200 |
| GET | `/api/sources/` | aucun | 200 |
| GET | `/api/sources/<identifiant>/` | identifiant | 200 |
| GET | `/api/sujets/` | aucun | 200 |
| GET | `/api/sujets/avec_articles/` | aucun | 200 |
| GET | `/api/sujets/<identifiant>/` | identifiant | 200 |
| GET | `/api/auteurs/` | aucun | 200 |
| GET | `/api/etiquettes/` | aucun | 200 |
| GET | `/api/journaux/` | jeton admin | 200 |

Vérifier que la pagination contient bien `count`, `next`, `previous` et
`results`. Vérifier qu'un article inconnu renvoie `404`.

### 6.5 Tester les points d'entrée de la personnalisation

Toutes les routes de cette section demandent un jeton.

| Méthode | Route | Corps | Code attendu |
| --- | --- | --- | --- |
| GET | `/api/suivis-sujets/` | aucun | 200 |
| POST | `/api/suivis-sujets/` | `{"sujet": 1, "poids": 0.9}` | 201 |
| PATCH | `/api/suivis-sujets/<id>/` | `{"poids": 0.5}` | 200 |
| DELETE | `/api/suivis-sujets/<id>/` | aucun | 204 |
| POST | `/api/suivis-sources/` | `{"source": 1, "poids": 0.8}` | 201 |
| POST | `/api/mots-cles/` | `{"mot": "RAG"}` | 201 |
| POST | `/api/historique/` | `{"article": 1, "action": "vue", "duree_secondes": 45}` | 201 |
| GET | `/api/recommandations/` | aucun | 200 |
| GET | `/api/recommandations/generer/` | `?nombre=10` | 200 |
| GET | `/api/recommandations/moteur/` | aucun | 200 |
| GET | `/api/recommandations/instantanees/` | `?destinataire=...&nombre=3` | 200 ou 404 |
| POST | `/api/recommandations/<id>/clic/` | aucun | 200 |
| GET | `/api/canaux/` | aucun | 200 |
| POST | `/api/canaux/` | `{"canal": "telegram", "destinataire": "123456"}` | 201 |
| POST | `/api/resumes/<id>/statut/` | `{"etat": "envoye"}` | 200 |
| GET | `/api/tableau-de-bord/` | aucun | 200 |
| GET | `/api/panorama/` | aucun | 200 |

Vérifier les règles suivantes :

- ajouter deux fois la même famille pour un membre renvoie `400` ;
- ajouter un mot-clé vide renvoie `400` ;
- appeler `/api/tableau-de-bord/` sans jeton renvoie `401` ;
- appeler `/api/recommandations/instantanees/` avec un destinataire inconnu
  renvoie `404` ;
- appeler `/api/resumes/<id>/statut/` avec un état inconnu laisse le résumé
  inchangé.

### 6.6 Tester les points d'entrée de référencement

Ces routes ne sont pas sous `/api/`. Elles se testent dans le navigateur ou
avec `curl`.

| Route | Vérification |
| --- | --- |
| `/robots.txt` | contenu texte, sitemap déclaré, pages privées exclues |
| `/sitemap.xml` | XML valide, articles et familles présents |
| `/sitemap-news.xml` | XML valide, articles des deux derniers jours |
| `/html-simple` | page lisible sans JavaScript |
| `/flux/` | XML Atom valide |
| `/membre/<pseudo>/` | page publique du membre, aucune donnée privée |

Exemple avec `curl` :

```bash
curl -i http://localhost:8000/robots.txt
curl -i http://localhost:8000/sitemap.xml
curl -i http://localhost:8000/flux/
```

### 6.7 Tester les erreurs transverses

| Cas | Requête | Résultat attendu |
| --- | --- | --- |
| jeton absent | `GET /api/profil/` | 401 |
| jeton expiré | `GET /api/profil/` | 401 avec message de session |
| méthode interdite | `DELETE /api/articles/` | 405 |
| identifiant inconnu | `GET /api/articles/inconnu/` | 404 |
| corps JSON invalide | `POST /api/inscription/` | 400 |
| pagination hors limite | `GET /api/articles/?page=9999` | 404 |
| taille trop grande | `GET /api/articles/?taille=1000` | 200, taille plafonnée |

## 7. Tests des deux agents

### 7.1 Agent de résumé

| Test | Commande | Résultat attendu |
| --- | --- | --- |
| configuration | `manage.py shell -c "from aggregator.services.agent import AgentResume; print(AgentResume().est_configure)"` | `True` ou `False` |
| essai sans écriture | `manage.py resume --id 128 --dry-run` | résumé affiché, base inchangée |
| traitement réel | `manage.py resume --id 128` | résumé enregistré, origine `agent` |
| repli local | retirer la clé puis `manage.py enrichir_articles --nombre 2` | origine `flux`, site toujours fonctionnel |
| texte court | `manage.py resume --id <article court>` | avertissement, aucun appel réseau |
| quota atteint | relancer plusieurs fois | arrêt propre, message clair |

Vérifier ensuite en base :

```bash
uv run python manage.py shell -c "from aggregator.models import Article; a=Article.objects.get(pk=128); print(a.resume[:120]); print(a.origine_resume); print(list(a.sujets.values_list('nom', flat=True)))"
```

### 7.2 Moteur de similarité

| Test | Commande | Résultat attendu |
| --- | --- | --- |
| simulation | `manage.py calculer_embeddings --simulation` | nombre d'objets à traiter, aucun chargement |
| petit lot | `manage.py calculer_embeddings --articles --limite 10` | dix vecteurs écrits |
| couverture | `manage.py shell -c "from recommender.services.embeddings import etat_moteur; print(etat_moteur())"` | couverture proche de 1,0 |
| similarité | voir section 3.4 | `1.0` et `0.0` |
| moteur | `GET /api/recommandations/moteur/` | modèle, dimension, couverture |
| recommandation | `GET /api/recommandations/generer/?nombre=5` | cinq propositions avec raisons |

Vérifier qu'un vecteur d'un autre modèle est ignoré :

```bash
uv run python manage.py shell -c "from recommender.models import VecteurArticle; v=VecteurArticle.objects.first(); v.modele='autre-modele'; v.save(update_fields=['modele']); print('vecteur modifie')"
```

Relancer ensuite une recommandation : le moteur ne doit pas utiliser ce
vecteur. Remettre le bon modèle après le test.

## 8. Recette finale, scénario complet

1. Démarrer Django et Vite.
2. Ouvrir `http://localhost:8000/api/docs/` et vérifier que le schéma se charge.
3. Créer un compte depuis l'interface d'inscription.
4. Se connecter, vérifier l'avatar et le menu.
5. Suivre deux familles et une source depuis la page des suivis.
6. Ouvrir la page « Pour vous » et vérifier la présence de recommandations et
   du badge d'affinité.
7. Ouvrir un article, vérifier le résumé, la source et le bouton de lecture.
8. Revenir au tableau de bord et vérifier que la lecture est comptée.
9. Ajouter un canal Telegram dans les notifications.
10. Modifier le profil et vérifier la mise à jour immédiate dans la barre.
11. Passer en mode grille puis en mode liste, recharger la page et vérifier que
    le choix est conservé.
12. Réduire la fenêtre à 375 px et vérifier l'absence de chevauchement.
13. Lancer `manage.py test`, `ruff check .`, `npm run lint` et `npm run build`.
14. Vérifier `GET /api/recommandations/moteur/` : couverture à 1,0.
15. Vérifier `GET /robots.txt`, `/sitemap.xml` et `/flux/`.

La recette est validée si les quinze étapes passent sans erreur bloquante.

## 9. Problèmes fréquents

| Symptôme | Cause probable | Correction |
| --- | --- | --- |
| `no such table` | migrations non appliquées | `uv run python manage.py migrate` |
| `ModuleNotFoundError: sentence_transformers` | groupe embeddings absent | `uv sync --group embeddings` |
| page « Pour vous » vide | aucun suivi ou aucun vecteur | suivre une famille, puis `calculer_embeddings` |
| couverture inférieure à 1 | nouveaux articles non vectorisés | relancer `calculer_embeddings` |
| erreur CORS dans le navigateur | origine absente de `CORS_ALLOWED_ORIGINS` | ajouter l'adresse de Vite dans `.env` |
| connexion impossible | compte inactif ou mot de passe faux | vérifier dans l'admin Django |
| résumé vide | clé absente et texte vide | vérifier le texte de l'article |
| quota Gemini atteint | limite quotidienne | attendre ou utiliser OpenRouter |
| `npm` bloqué sous Windows | stratégie PowerShell | utiliser `npm.cmd` |
| build frontend en échec | import ou composant manquant | lire le message, corriger, relancer |

## 10. Ce qui doit rester vert avant le rendu

| Vérification | Commande | Attendu |
| --- | --- | --- |
| configuration Django | `uv run python manage.py check` | aucun problème |
| migrations | `uv run python manage.py makemigrations --check --dry-run` | aucune modification |
| tests backend | `uv run python manage.py test` | tous les tests passent |
| style Python | `uv run ruff check .` | aucune erreur |
| lint frontend | `npm.cmd run lint` | aucune erreur |
| build frontend | `npm.cmd run build` | build réussi |
| couverture embedding | `GET /api/recommandations/moteur/` | `couverture: 1.0` |
| documentation API | `GET /api/docs/` | page accessible |
