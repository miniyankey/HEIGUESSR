# HEIGUESSR : Client

Application web développée avec [Vue.js](https://vuejs.org/) et [Vite](https://vite.dev/).

## Prérequis

- Node.js 22.9 ou supérieur
- L'API du projet lancée (voir [`../api/README.md`](../api/README.md))

## Installation

Depuis la racine du dépôt :

```bash
cd client
npm install
```

## Scripts

| Commande              | Description                                                                   |
| --------------------- | ----------------------------------------------------------------------------- |
| `npm run dev`         | Lance le serveur de développement Vite (rechargement à chaud)                 |
| `npm run build`       | Génère la version de production dans le dossier `dist/`                       |
| `npm run preview`     | Prévisualise localement le build de production                                |
| `npm run lint`        | Exécute tous les linters (`oxlint` puis `eslint`) avec correction automatique |
| `npm run lint:oxlint` | Exécute uniquement Oxlint (avec correction automatique)                       |
| `npm run lint:eslint` | Exécute uniquement ESLint (avec correction automatique et cache)              |
| `npm run format`      | Formate le code de `src/` avec Prettier                                       |

## Développement

```bash
npm run dev
```

L'URL locale s'affiche dans le terminal (par défaut `http://localhost:5173`).

## Qualité du code

Avant chaque commit, il est recommandé de lancer :

```bash
npm run lint
npm run format
```
