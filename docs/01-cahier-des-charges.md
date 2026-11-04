# VEILLIA, cahier des charges et architecture

## 1. Présentation du projet

VEILLIA est un agregateur d'articles de data science et d'intelligence artificielle.
Il fonctionne sur le principe de Google News applique a un seul theme : tout ce qui
touche a la donnee et a l'IA. La plateforme collecte les flux RSS de plus de cent
sources, classe les articles par grande famille, genere un resume en francais et
renvoie le visiteur vers le site d'origine. Aucun texte n'est recopie.

Trois principes guides toute la conception.

1. Rediriger et non republier. VEILLIA garde les metadonnees du flux, jamais le
   corps de l'article.
2. Simplifier. Trois applications Django, des vues DRF en viewsets, une base
   SQLite en developpement et PostgreSQL en production.

## 2. Besoins fonctionnels

| Identifiant | Besoin | Priorite |
| --- | --- | --- |
| BF01 | Collecter les articles des flux RSS d'une liste de sources | Haute |
| BF02 | Classer chaque article dans une ou plusieurs familles de sujets | Haute |
| BF03 | Generer un resume en francais pour chaque article | Haute |
| BF04 | Afficher le fil d'articles a la une et le fil du jour | Haute |
| BF05 | Filtrer par famille, source, auteur, mot cle et periode | Haute |
| BF06 | Rediriger vers la source en mesurant le clic | Haute |
| BF07 | Creer et gerer un profil utilisateur | Haute |
| BF08 | Se connecter avec GitHub et LinkedIn | Moyenne |
| BF09 | Suivre des familles, des sources et des mots cles | Moyenne |
| BF10 | Proposer des recommandations personnelles motivees | Moyenne |
| BF11 | Historique de lecture du membre | Moyenne |
| BF12 | Envoyer un resume quotidien sur Telegram et WhatsApp | Moyenne |
| BF13 | Etre reference par Google et Google News | Haute |
| BF14 | Piloter les sources et la collecte depuis l'administration | Haute |

## 3. Besoins non fonctionnels

| Identifiant | Exigence |
| --- | --- |
| BNF01 | Une page d'accueil doit s'afficher en moins de deux secondes |
| BNF02 | Les requetes de liste utilisent des index sur la date de publication |
| BNF03 | Une collecte qui echoue ne doit jamais interrompre les autres sources |
| BNF04 | Le code respecte les principes SOLID, chaque service a une seule raison de changer |
| BNF05 | Toute la documentation de conception est ecrite avec des diagrammes |
| BNF06 | Le code et les noms de tables sont en francais |
| BNF07 | Les secrets sont lus depuis le fichier .env et ne sont jamais code en dur |
| BNF08 | La plateforme reste utilisable meme si le service de resume par IA est indisponible |

## 4. Contraintes

- Pas de republication de contenu : chaque clic doit conduire a la source
- Maximum trois applications Django pour garder un projet lisible
- React et les composants JS modernes restent du cote du front
- L'agent de diffusion externe est realise avec n8n, pas dans Django

## 5. Architecture generale

L'application suit une architecture en trois couches a l'interieur de chaque
application Django : les vues DRF apparaissent au dessus, les services portent
la logique metier, et les modeles stockent les donnees. Le front React consomme
l'api et n'appelle jamais la base directement.

```mermaid
flowchart TB
    Visiteur[Visiteur ou membre connecte]
    Moteur[Google et Google News]
    Bot[Agent n8n]

    subgraph Front[Front React]
        Page[Page d'accueil a la une]
        Fil[Fil du jour]
        Sujet[Page famille]
        Profil[Page profil]
    end

    subgraph Api[API Django Rest Framework]
        A[app accounts]
        B[app aggregator]
        C[app recommender]
    end

    subgraph Jobs[Taches de fond]
        Collecte[collecter_flux]
        Agent[Agent de resume]
        MoteurRec[Moteur de recommandation]
        Resume[preparer_resumes]
    end

    subgraph Data[Donnees]
        DB[(PostgreSQL ou SQLite)]
        Flux[(Flux RSS des sources)]
        LLM[Service de resume par IA]
    end

    Visiteur --> Page
    Visiteur --> Fil
    Visiteur --> Sujet
    Visiteur --> Profil
    Page --> Api
    Fil --> Api
    Sujet --> Api
    Profil --> Api
    Collecte --> Flux
    Collecte --> B
    Agent --> LLM
    Agent --> B
    MoteurRec --> C
    Resume --> C
    Api --> DB
    Bot --> C
    Moteur --> Page
    Moteur --> Fil
```

## 6. Diagramme de cas d'utilisation

```mermaid
flowchart LR
    Visiteur((Visiteur))
    Membre((Membre connecte))
    Admin((Administrateur))
    AgentN8n((Agent n8n))
    Source((Site source))

    subgraph Systeme[Systeme VEILLIA]
        UC1[Consulter le fil d'articles]
        UC2[Consulter le bloc a la une]
        UC3[Rechercher un article]
        UC4[Filtrer par famille ou source]
        UC5[Suivre le lien vers la source]
        UC6[Creer un compte]
        UC7[Se connecter]
        UC8[Se connecter avec GitHub ou LinkedIn]
        UC9[Gerer son profil]
        UC10[Suivre une famille ou une source]
        UC11[Voir ses recommandations]
        UC12[Voir son historique de lecture]
        UC13[Gerer ses canaux de notification]
        UC14[Recevoir son resume quotidien]
        UC15[Ajouter une source]
        UC16[Declencher une collecte]
        UC17[Consulter le journal de collecte]
        UC18[Moderer les articles]
    end

    Visiteur --> UC1
    Visiteur --> UC2
    Visiteur --> UC3
    Visiteur --> UC4
    Visiteur --> UC5
    Visiteur --> UC6
    Visiteur --> UC7
    Visiteur --> UC8

    Membre --> UC9
    Membre --> UC10
    Membre --> UC11
    Membre --> UC12
    Membre --> UC13
    Membre --> UC14
    Membre --> UC3

    AgentN8n --> UC14

    Admin --> UC15
    Admin --> UC16
    Admin --> UC17
    Admin --> UC18

    Source -.-> UC16
```

## 7. Diagramme de classes

```mermaid
classDiagram
    class User {
        +username
        +email
        +photo_profil
        +presentation
        +fonction
        +entreprise
        +pays
        +langue
        +nom_affiche
        +initiales
        +infos_profil()
    }

    class CompteReseau {
        +reseau
        +identifiant_reseau
        +pseudo_reseau
        +lien_profil
        +est_github
        +est_linkedin
    }

    class Source {
        +nom
        +identifiant
        +site_officiel
        +url_flux
        +logo
        +fiabilite
        +est_active
        +derniere_collecte
        +dernier_succes
        +est_perdue()
        +marquer_succes()
        +marquer_erreur(msg)
    }

    class Sujet {
        +nom
        +identifiant
        +couleur
        +mots_cles
        +ordre
        +liste_mots_cles()
    }

    class Article {
        +titre
        +identifiant
        +lien
        +identifiant_flux
        +resume
        +origine_resume
        +image_couverture
        +publie_le
        +note_qualite
        +note_pertinence
        +est_visible
        +incrementer_clics()
        +lien_source()
        +resume_court()
    }

    class Auteur {
        +nom
        +page_profil
        +photo
        +lien_public()
    }

    class Etiquette {
        +nom
    }

    class JournalCollecte {
        +etat
        +articles_trouves
        +articles_crees
        +duree_secondes
    }

    class SuiviSujet {
        +poids
    }

    class SuiviSource {
        +poids
    }

    class EvenementLecture {
        +action
        +duree_secondes
        +poids_interaction
    }

    class Recommandation {
        +score
        +raisons
        +est_cliquee
        +raison_principale
    }

    class AbonnementCanal {
        +canal
        +destinataire
        +est_actif
    }

    class ResumeQuotidien {
        +jour
        +canal
        +etat
        +nombre_articles
        +marquer_envoye()
        +marquer_echec(msg)
    }

    class MotCle {
        +mot
    }

    User "1" --> "*" CompteReseau
    User "1" --> "*" SuiviSujet
    User "1" --> "*" SuiviSource
    User "1" --> "*" EvenementLecture
    User "1" --> "*" Recommandation
    User "1" --> "*" AbonnementCanal
    User "1" --> "*" ResumeQuotidien
    User "1" --> "*" MotCle

    Source "1" --> "*" Article
    Source "1" --> "*" Auteur
    Source "1" --> "*" JournalCollecte
    Source "*" --> "1" SuiviSource

    Sujet "1" --> "*" SuiviSujet
    Sujet "*" <-- "*" Article
    Article "*" --> "*" Auteur
    Article "*" --> "*" Etiquette
    Article "1" --> "*" EvenementLecture
    Article "1" --> "*" Recommandation
    Article "*" --> "*" ResumeQuotidien
```

## 8. Diagramme entites associations

```mermaid
erDiagram
    USER ||--o{ COMPTE_RESEAU : "se rattache a"
    USER ||--o{ SUIVI_SUJET : "suit"
    USER ||--o{ SUIVI_SOURCE : "suit"
    USER ||--o{ EVENEMENT_LECTURE : "produit"
    USER ||--o{ RECOMMANDATION : "recoit"
    USER ||--o{ ABONNEMENT_CANAL : "active"
    USER ||--o{ RESUME_QUOTIDIEN : "genere"
    USER ||--o{ MOT_CLE : "suit"

    SOURCE ||--o{ ARTICLE : "publie"
    SOURCE ||--o{ JOURNAL_COLLECTE : "trace"
    SOURCE ||--o{ AUTEUR : "emploie"
    SOURCE ||--o{ SUIVI_SOURCE : "suivie par"

    SUJET ||--o{ SUIVI_SUJET : "suivie par"
    ARTICLE }o--o{ SUJET : "classe dans"
    ARTICLE }o--o{ AUTEUR : "ecrit par"
    ARTICLE }o--o{ ETIQUETTE : "taggue"
    ARTICLE ||--o{ EVENEMENT_LECTURE : "declenche"
    ARTICLE ||--o{ RECOMMANDATION : "proposee"
    ARTICLE }o--o{ RESUME_QUOTIDIEN : "contenu du"

    USER {
        int id PK
        string username UK
        string email UK
        string presentation
        string langue
        datetime cree_le
    }

    COMPTE_RESEAU {
        int id PK
        int utilisateur_id FK
        string reseau
        string identifiant_reseau UK
        string pseudo_reseau
    }

    SOURCE {
        int id PK
        string nom
        string identifiant UK
        string site_officiel
        string url_flux
        string logo
        float fiabilite
        boolean est_active
        datetime derniere_collecte
        datetime dernier_succes
        string derniere_erreur
    }

    SUJET {
        int id PK
        string nom
        string identifiant UK
        string couleur
        int ordre
        string mots_cles
    }

    ARTICLE {
        int id PK
        string titre
        string identifiant UK
        string lien
        string identifiant_flux
        string resume
        string origine_resume
        string image_couverture
        int source_id FK
        datetime publie_le
        float note_qualite
        float note_pertinence
        int nombre_clics
    }

    AUTEUR {
        int id PK
        string nom
        int source_id FK
        string page_profil
    }

    EVENEMENT_LECTURE {
        int id PK
        int utilisateur_id FK
        int article_id FK
        string action
        int duree_secondes
        datetime cree_le
    }

    RECOMMANDATION {
        int id PK
        int utilisateur_id FK
        int article_id FK
        float score
        json raisons
        boolean est_cliquee
    }

    RESUME_QUOTIDIEN {
        int id PK
        int utilisateur_id FK
        date jour
        string canal
        string etat
        datetime envoye_le
    }

    ABONNEMENT_CANAL {
        int id PK
        int utilisateur_id FK
        string canal
        string destinataire
        boolean est_actif
    }
```

## 9. Diagramme d'activite de la collecte

```mermaid
flowchart TD
    Debut([Debut de la commande collecter_flux]) --> Sources[Selectionner les sources actives]
    Sources --> Source{Sources restantes ?}
    Source -- Non --> Fin([Fin de la commande])
    Source -- Oui --> Lire[Telecharger le flux avec un identifiant VEILLIA]
    Lire --> Erreur{Erreur reseau ou XML ?}
    Erreur -- Oui --> MarquerErreur[Marquer l'erreur sur la source et le journal]
    Erreur -- Non --> Entrees[Parcourir les entrees du flux]
    Entrees --> Entree{Entree restante ?}
    Entree -- Non --> Succes[Marquer la source en succes et recompter les articles]
    Entree -- Oui --> Nettoyer[Nettoyer le titre, le resume et la date]
    Nettoyer --> Image[Chercher l'image dans enclosures, media et balise img]
    Image --> DejaVu{Article deja connu pour cette source ?}
    DejaVu -- Oui --> Suivant[Passer a l'entree suivante]
    DejaVu -- Non --> Creer[Creer l'article et son identifiant]
    Creer --> Auteur[Rattacher l'auteur et les etiquettes]
    Auteur --> Suivant
    Suivant --> Entree
    Succes --> Source
    MarquerErreur --> Source
```

## 10. Machine a etats d'une source

```mermaid
stateDiagram-v2
    [*] --> Active
    Active --> CollecteEnCours: commande de collecte
    CollecteEnCours --> Saine: flux lu et nouveaux articles
    CollecteEnCours --> EnErreur: echec reseau ou XML
    EnErreur --> CollecteEnCours: nouvel essai
    EnErreur --> Desactivee: administrateur
    Saine --> Perimee: derniere collecte trop ancienne
    Perimee --> CollecteEnCours: nouvelle collecte
    Saine --> Desactivee: administrateur
    Active --> Desactivee: administrateur
    Desactivee --> Active: administrateur
```

## 11. Diagrammes de sequence

### 11.1 Collecte d'un flux et enrichissement

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Planificateur
    participant Vue as Commande collecter_flux
    participant Fetch as Service fetcher
    participant Source as Source
    participant RSS as Flux distant
    participant Agent as Service agent
    participant LLM as Service de resume
    participant BD as Base de donnees

    Cron->>Vue: lancement planifie
    Vue->>Fetch: collecter(source)
    Fetch->>BD: creer le journal de collecte
    Fetch->>RSS: GET url_flux
    RSS-->>Fetch: XML du flux
    Fetch->>Fetch: nettoyer titre, resume, date et image
    Fetch->>BD: verifier l'identifiant du flux
    alt article nouveau
        Fetch->>BD: creer l'article, l'auteur et les etiquettes
        Fetch->>Source: marquer_succes()
    else article deja connu
        Fetch->>Fetch: ignorer l'entree
    end
    Fetch->>BD: mettre a jour le journal et le compteur
    Vue->>Agent: enrichir_articles()
    Agent->>LLM: demande de resume et de notes
    alt reponse du modele
        LLM-->>Agent: JSON resume, sujets et notes
        Agent->>BD: enregistrer le resume et les familles
    else service indisponible
        LLM-->>Agent: erreur ou delai depasse
        Agent->>Agent: resume de secours par phrases
        Agent->>BD: classer avec les mots cles du sujet
    end
```

### 11.2 Inscription et connexion avec un reseau social

```mermaid
sequenceDiagram
    autonumber
    participant U as Utilisateur
    participant Front as Front React
    participant Api as API accounts
    participant OAuth as Service oauth
    participant Reseau as GitHub ou LinkedIn
    participant BD as Base de donnees

    U->>Front: clique sur Se connecter avec GitHub
    Front->>Api: GET /api/oauth/github/
    Api->>Api: verifier la configuration du .env
    Api-->>Front: url d'autorisation du reseau
    Front-->>U: redirection vers le reseau
    U->>Reseau: autorise l'acces
    Reseau-->>Api: callback avec le code
    Api->>OAuth: profil(reseau, code)
    OAuth->>Reseau: POST echange du code contre un jeton
    Reseau-->>OAuth: jeton d'acces
    OAuth->>Reseau: GET profil du compte
    Reseau-->>OAuth: identifiant, pseudo, nom, email, photo, lien
    OAuth->>BD: chercher un CompteReseau existant
    alt compte deja lie
        OAuth->>BD: renvoyer l'utilisateur
    else email identique a un compte VEILLIA
        OAuth->>BD: rattacher le compte reseau
    else nouveau compte
        OAuth->>BD: creer l'utilisateur avec un mot de passe inutilisable
        OAuth->>BD: creer le CompteReseau
    end
    OAuth-->>Api: utilisateur
    Api-->>Front: access token et refresh token
    Front-->>U: session ouverte
```

### 11.3 Calcul des recommandations

```mermaid
sequenceDiagram
    autonumber
    participant U as Membre connecte
    participant Front as Front React
    participant Api as API recommender
    participant Moteur as MoteurRecommendation
    participant BD as Base de donnees
    participant Agent as Agent de resume

    U->>Front: ouvre la colonne Recommandations
    Front->>Api: GET /api/recommandations/generer
    Api->>Moteur: creer le moteur pour l'utilisateur
    Moteur->>BD: lire les familles suivies et leur poids
    Moteur->>BD: lire les sources suivies et leur poids
    Moteur->>BD: lire les articles vus les sept derniers jours
    Moteur->>BD: lire les vecteurs des familles suivies
    Moteur->>BD: prendre les articles visibles des trente derniers jours
    loop pour chaque article candidat
        Moteur->>BD: lire le vecteur du resume
        Moteur->>Moteur: similarite cosinus avec les familles suivies
        Moteur->>Moteur: affinite sujets puis affinite source
        Moteur->>Moteur: recence puis note qualite
        Moteur->>Moteur: garder les raisons en texte court
    end
    Moteur->>Moteur: trier et limiter a deux articles par source
    Moteur->>BD: enregistrer les recommandations
    Api-->>Front: articles, score, affinite et raison
    Front-->>U: cartes avec le badge de raison et l'affinite semantique
    U->>Front: clique sur Lire sur le site
    Front->>Api: POST /api/articles/identifiant/clic
    Api->>BD: incrementer le compteur et creer l'evenement
    Api-->>Front: lien de la source
    Front-->>U: ouverture de l'article chez la source
```

### 11.4 Diffusion quotidienne par l'agent n8n

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Planificateur
    participant Prep as Commande preparer_resumes
    participant BD as Base de donnees
    participant N8n as Agent n8n
    participant Api as API recommender
    participant Canal as Telegram ou WhatsApp

    Cron->>Prep: lancement chaque matin
    Prep->>BD: lire les abonnements actifs
    loop pour chaque abonnement
        Prep->>BD: calculer les recommandations du membre
        Prep->>BD: creer le ResumeQuotidien en attente
    end
    Cron->>N8n: declenchement planifie
    N8n->>Api: GET /api/resumes/?etat=en_attente avec jeton
    Api-->>N8n: liste des resumes et de leurs articles
    loop pour chaque resume
        N8n->>Canal: envoyer le message formate
        alt envoi accepte
            N8n->>Api: POST /api/resumes/identifiant/statut avec envoye
            Api->>BD: marquer_envoye()
        else envoi refuse
            N8n->>Api: POST /api/resumes/identifiant/statut avec echec
            Api->>BD: marquer_echec(message)
        end
    end
```

### 11.5 Redirection vers la source

```mermaid
sequenceDiagram
    autonumber
    participant V as Visiteur
    participant Front as Front React
    participant Api as API aggregator
    participant BD as Base de donnees
    participant Site as Site de la source

    V->>Front: clique sur le titre ou le logo
    Front->>Api: POST /api/articles/identifiant/clic
    alt membre connecte
        Api->>BD: creer un EvenementLecture de type clic_source
    else visiteur
        Api->>BD: incrementer seulement le compteur de clics
    end
    Api-->>Front: lien de l'article et nom de la source
    Front-->>V: ouverture dans un nouvel onglet
    V->>Site: lit l'article sur le site d'origine
```

## 12. Diagramme de composants

```mermaid
flowchart TB
    subgraph Interface[Interface]
        React[React avec composants JS modernes]
    end

    subgraph Exposition[Couche exposition]
        VuesA[Vues accounts]
        VuesB[Vues aggregator]
        VuesC[Vues recommender]
        Filtres[Filtres django-filter]
        Serializers[Serializers DRF]
        Sitemaps[Sitemaps et pages SEO]
    end

    subgraph Metier[Couche metier]
        Fetcher[fetcher collecte RSS]
        Agent[agent resume et classification]
        MoteurRec[moteur recommandation]
        OAuthS[oauth GitHub et LinkedIn]
        Varier[variation des recommandations]
    end

    subgraph Persistance[Couche persistance]
        Modeles[Modeles Django]
        AdminSite[Administration Django]
        Commandes[Commandes de gestion]
    end

    React --> VuesA
    React --> VuesB
    React --> VuesC
    VuesA --> Serializers
    VuesB --> Serializers
    VuesC --> Serializers
    VuesB --> Filtres
    VuesA --> OAuthS
    VuesC --> MoteurRec
    Sitemaps --> Modeles
    MoteurRec --> Agent
    Commandes --> Fetcher
    Commandes --> Agent
    Commandes --> MoteurRec
    Serializers --> Modeles
    AdminSite --> Modeles
    Fetcher --> Modeles
```

## 13. Diagramme de deploiement

```mermaid
flowchart TB
    Visiteur[Visiteur ou robot Google]
    N8n[Agent n8n]
    Admin[Administrateur]

    subgraph ServeurApplication[Serveur applicatif]
        subgraph Nginx[Nginx]
            Proxy[Proxy inverse et HTTPS]
            Statique[Fichiers statiques du front]
        end
        subgraph Gunicorn[Gunicorn]
            Django[Django et Django Rest Framework]
        end
        subgraph Taches[Processus de fond]
            CronCollecte[collecter_flux toutes les 30 minutes]
            CronReco[generer_recommandations chaque nuit]
            CronResume[preparer_resumes chaque matin]
        end
    end

    subgraph Stockage[Stockage]
        BD[(PostgreSQL)]
        Fichiers[Fichiers sauvegardes]
    end

    subgraph Externe[Services externes]
        Flux[Flux RSS des sources]
        ResumeIA[Service de resume par IA]
        Telegram[API Telegram]
        WhatsApp[API WhatsApp]
        OAuth[API GitHub et LinkedIn]
    end

    Visiteur --> Proxy
    Proxy --> Statique
    Proxy --> Django
    Admin --> Proxy
    Django --> BD
    Django --> OAuth
    Django --> ResumeIA
    Taches --> BD
    Taches --> Flux
    Taches --> ResumeIA
    CronCollecte --> Django
    CronReco --> Django
    CronResume --> Django
    N8n --> Proxy
    Django --> Telegram
    Django --> WhatsApp
    BD --> Fichiers
```

## 14. Repartition des responsabilites par application

| Application | Regle de responsabilite |
| --- | --- |
| `accounts` | Elle sait qui est la personne et comment elle se connecte. Elle ne connait pas les articles. |
| `aggregator` | Elle sait ce qui est publie, ou et quand. Elle ne connait pas les preferences des membres. |
| `recommender` | Elle sait ce que veut la personne. Elle ne cree aucun contenu et ne collecte aucun flux. |

Cette separation evite les imports croises inutiles et respecte le principe de
responsabilite unique.

## 15. Principes de conception appliques

| Principe | Application dans le projet |
| --- | --- |
| Responsabilite unique | Un service par metier : `fetcher`, `agent`, `moteur`, `oauth` |
| Ouvert ferme | Ajouter une source se fait depuis l'administration, sans toucher au code |
| Substitution | Le moteur accepte n'importe quelle liste d'articles candidats |
| Interface segregation | Un serializer leger pour le fil et un serializer complet pour le detail |
| Dependance faible | Les vues importent les services, jamais l'inverse |
| DRY | Les filtres, la pagination et la pagination de page sont definis une fois |

## 16. Referencement

Le referencement est treats comme une fonctionnalite, pas comme une option.

| Element | Mise en oeuvre |
| --- | --- |
| Donnees structurees | Un bloc JSON-LD `NewsArticle` dans chaque reponse d'article |
| Sitemap general | `sitemap.xml` avec les familles, les sources et mille articles |
| Sitemap news | `sitemap-news.xml` limite aux articles des deux derniers jours |
| Robots | `robots.txt` autorise le contenu public et bloque l'administration |
| Page sans JavaScript | `/html-simple` liste les derniers titres en HTML brut |
| Pages de profil | `/membre/pseudo/` renvoie une page HTML lisible |
| Flux Atom | `/flux/` pour les lecteurs RSS tiers |
| Titres stables | Chaque article et chaque sujet a un identifiant lisible dans son URL |
| Redirection unique | Le clic passe par l'api, la source est toujours le site d'origine |

## 17. Securite

| Risque | Reponse |
| --- | --- |
| Fuite de la cle secrete | Tout est lu dans le fichier `.env`, rien n'est ecrit en dur |
| Vol de jeton | Les jetons JWT expirent en soixante minutes et se renouvellent |
| Mot de passe faible | Validateurs Django, longueur minimale, hachage automatique |
| Fuite de donnees personnelles | Les vues du profil public ne renvoient pas l'email |
| Abus de l'api de clic | Le compteur est mis a jour en une requete, sans lecture du corps |
| Injection SQL | Tout passe par l'ORM, aucune requete concatenee |
| Depassement de flux | Chaque appel reseau a un delai maximal et un message d'erreur journalise |