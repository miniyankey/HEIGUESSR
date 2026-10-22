# HEIGUESSR : API

API Node.js connectée à une base de données MongoDB via [Mongoose](https://mongoosejs.com/).

## Prérequis

- Node.js 22.9 ou supérieur (nécessaire pour l'option `--env-file-if-exists`)
- Une base de données MongoDB (locale ou [MongoDB Atlas](https://www.mongodb.com/atlas))

## Installation

Depuis la racine du dépôt :

```bash
cd api
npm install
```

## Configuration

Copier le fichier d'exemple puis renseigner les valeurs :

```bash
cp .env.example .env
```

| Variable           | Description                                     |
| ------------------ | ----------------------------------------------- |
| `MONGODB_USERNAME` | Nom d'utilisateur MongoDB                       |
| `MONGODB_PASSWORD` | Mot de passe MongoDB                            |
| `MONGODB_HOST`     | Domaine ou IP du serveur MongoDB                |
| `MONGODB_DATABASE` | Nom de la base de données (ex. `dev` ou `prod`) |
| `MONGODB_URI`      | URI de connexion complète                       |

Exemple d'URI :

```
mongodb+srv://[USERNAME]:[PASSWORD]@[DOMAIN/IP]/[DB_NAME]
```

> ⚠️ Le fichier `.env` contient des identifiants : ne jamais le commiter.

## Scripts

| Commande      | Description                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| `npm run dev` | Lance l'API en développement avec rechargement automatique (`--watch`) et chargement du fichier `.env` s'il existe |
| `npm start`   | Lance l'API en mode production (`node bin/start.js`)                                                               |

> En production, les variables d'environnement doivent être fournies par la plateforme d'hébergement (le script `start` ne charge pas de fichier `.env`).

## Point d'entrée

Le serveur démarre depuis `bin/start.js`.
