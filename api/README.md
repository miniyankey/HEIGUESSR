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
| `JWT_SECRET`       | Secret de signature des tokens JWT              |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Identifiants Cloudinary (stockage des images) |
| `CORS_ORIGIN`      | Origines autorisées à appeler l'API depuis un navigateur, séparées par des virgules |
| `PORT`             | Port HTTP (défaut `3000`)                       |

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
| `npm test`    | Lance les tests automatisés avec la couverture de code (échoue sous 75 % de lignes couvertes)                      |

> En production, les variables d'environnement doivent être fournies par la plateforme d'hébergement (le script `start` ne charge pas de fichier `.env`).

## Documentation

La documentation de toutes les routes est dans [`openapi.yaml`](./openapi.yaml). Une fois l'API lancée,
elle est consultable et testable sur [http://localhost:3000/api-docs](http://localhost:3000/api-docs).

Toute route ajoutée ou modifiée doit y être documentée dans la même PR.

## Tests

```bash
npm test
```

Les tests utilisent [`node:test`](https://nodejs.org/api/test.html), [supertest](https://github.com/ladjs/supertest)
et une base MongoDB en mémoire ([mongodb-memory-server](https://github.com/typegoose/mongodb-memory-server)) :
ils n'ont besoin ni du fichier `.env`, ni d'une vraie base, ni de Cloudinary (simulé).
Le premier lancement télécharge un binaire MongoDB, ce qui peut prendre un moment.

## Point d'entrée

Le serveur démarre depuis `bin/start.js`, qui se connecte à MongoDB puis écoute sur `PORT`.
L'application Express elle-même est définie dans `app.js`.
