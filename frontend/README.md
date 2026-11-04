# Interface VEILLIA

Application React construite avec Vite. Elle communique avec l'API Django du
projet.

## Installation

```bash
npm install
```

## Lancer en développement

```bash
npm run dev
```

Le serveur Vite démarre sur http://localhost:5173. L'API Django doit tourner sur
http://localhost:8000. L'adresse de l'API se règle dans le fichier `.env` du
frontend avec la variable `VITE_API_URL`.

## Vérifications

```bash
npm run lint
npm run build
```

Le build est écrit dans `dist/`. Ce dossier n'est pas versionné.

## Organisation

| Dossier | Contenu |
| --- | --- |
| `src/pages` | une page par écran : accueil, articles du jour, recherche, sujets, pour vous, profil, paramètres |
| `src/components` | composants réutilisables : barre de navigation, carte article, avatar, logo, widget profil |
| `src/components/ui` | petits composants d'interface : bascule liste et grille, filtre avancé, icônes |
| `src/context` | contexte d'authentification et gestion des jetons |
| `src/services` | appels à l'API et traduction des messages d'erreur |
| `src/hooks` | hooks partagés, notamment le choix d'affichage liste ou grille |
