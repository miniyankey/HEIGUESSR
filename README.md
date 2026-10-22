# HEIGUESSR

Projet composé d'une **API** (Node.js + Mongoose / MongoDB) et d'un **client** web (Vue.js + Vite).

Les deux parties sont indépendantes : elles ont chacune leur `package.json`, leurs dépendances et leur configuration, et communiquent uniquement par HTTP.

## Structure du projet

```
HEIGUESSR/
├── api/        # Backend : API Node.js + Mongoose
├── client/     # Frontend : application Vue.js (Vite)
└── README.md
```

- 📂 [Documentation de l'API](./api/README.md)
- 📂 [Documentation du client](./client/README.md)

## Prérequis

- [Node.js](https://nodejs.org/) 22.9 ou supérieur
- npm (fourni avec Node.js)
- [Git](https://git-scm.com/)
- Une base de données [MongoDB](https://www.mongodb.com/) (locale ou MongoDB Atlas)

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/miniyankey/HEIGUESSR.git
cd HEIGUESSR
```

### 2. Installer et configurer l'API

```bash
cd api
npm install
cp .env.example .env   # puis renseigner les valeurs dans .env
```

### 3. Installer le client

```bash
cd ../client
npm install
```

## Lancer le projet en développement

Ouvrir **deux terminaux** :

```bash
# Terminal 1 : API
cd api
npm run dev
```

```bash
# Terminal 2 : client
cd client
npm run dev
```

Le client Vite affiche dans le terminal l'URL locale à ouvrir (par défaut `http://localhost:5173`).

## Workflow Git

La branche `main` est protégée : il n'est pas possible de pousser directement dessus.

1. Créer une branche pour chaque fonctionnalité (ex. `1-init-project-api-and-vuejs-client`)
2. Pousser la branche sur GitHub
3. Ouvrir une Pull Request vers `main`