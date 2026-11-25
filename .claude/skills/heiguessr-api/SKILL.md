---
name: heiguessr-api
description: Conventions, domain model, status and evaluation rules for the HEIGUESSR REST API (Express 5 + Mongoose + MongoDB, JWT, Cloudinary, wsmini real-time, node:test). Use for any work in api/ - routes, models, middlewares, auth, uploads, real-time, OpenAPI docs, tests, Render deployment.
---

# HEIGUESSR - API

Jeu type « guess the location » sur le thème de la HEIG-VD, projet du cours ArchiOWeb.
Les joueurs voient une photo d'un endroit de l'école, choisissent l'étage puis cliquent sur le plan
de cet étage. Pas de déplacement dans l'image (une seule photo ou un 360° par spot).
Des comptes **admin** créent les plans d'étage et les spots (photo + point sur le plan).
Les parties sont multijoueurs : un joueur crée une partie, ses amis la rejoignent avec un **code**,
et l'état est synchronisé en temps réel via WebSocket.

Cette API est **notée** : avant de terminer une tâche, relis [evaluation.md](evaluation.md)
(critères du cours + état d'avancement). Garde ce fichier à jour quand une case change.
Pour livrer le travail (issues, branches, commits, PR), suis le skill `heiguessr-git-workflow` :
ne committe jamais toi-même, donne les commits par message.

## Stack

- Node.js >= 22.9, ESM (`"type": "module"`), **Express 5** : une erreur levée ou une promesse
  rejetée dans une route async est transmise automatiquement au gestionnaire d'erreurs. Pas de
  `try/catch` qui ne fait que `next(err)`.
- MongoDB via **Mongoose 9**, mots de passe **bcrypt**, auth **JWT** (`jsonwebtoken`, `sub` = id user, 7 j).
- Images : **Cloudinary**, upload signé direct depuis le client (le fichier ne passe jamais par l'API).
- Temps réel : **wsmini** (lib du cours DevMobile, basée sur `ws`).
- Tests : **`node:test`** + `supertest` + `mongodb-memory-server`, couverture native de Node.
- Docs : **OpenAPI 3** (`api/openapi.yaml`) servi par `swagger-ui-express` sur `/api-docs`.
- Déploiement : **Render** (un seul web service : HTTP et WebSocket sur le même port `PORT`).

## Commandes

```bash
cd api
npm run dev     # node --env-file-if-exists=.env --watch bin/start.js
npm start       # production, variables fournies par Render
npm test        # tests + couverture (seuil 75 %), voir « Tests »
```

Variables (`api/.env`, modèle dans `.env.example`, ne jamais commiter `.env`) :
`MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
`CLOUDINARY_API_SECRET`, `CORS_ORIGIN` (liste séparée par des virgules), `PORT`.
`config.js` lit et valide toutes les variables. N'utilise pas `process.env` ailleurs.

## Structure

```
api/
├── app.js              # app Express : middlewares, routers, 404, gestionnaire d'erreurs
├── bin/start.js        # connexion MongoDB + serveur HTTP + serveur WebSocket
├── config.js           # lecture/validation des variables d'environnement
├── middlewares/        # authenticate, requireAdmin, loaders de ressources, validation
├── models/             # schémas Mongoose (un fichier par modèle)
├── routes/             # un router par ressource
├── realtime/           # serveur wsmini + fonctions de publication
├── openapi.yaml        # documentation
└── test/               # tests node:test (un fichier par router)
```

`app.js` ne doit **pas** appeler `mongoose.connect` : la connexion se fait dans `bin/start.js`,
pour que les tests branchent leur base en mémoire.

## Ce qui existe déjà

- `POST /auth/register` : crée l'utilisateur, renvoie `201 { token }`. Mot de passe d'au moins
  8 caractères, signalé avec les autres champs invalides en 422 `{ message, errors }`. Doublon en 409.
- `POST /auth/login` : `{ username, password }` donne `200 { token }`. 422 si champs manquants,
  401 si identifiants invalides.
- `middlewares/auth.js` → `authenticate` : exige `Authorization: Bearer <jwt>` et pose
  `req.currentUserId`. Sinon 401 avec l'en-tête `WWW-Authenticate: Bearer`.
- `middlewares/errors.js` → `notFound` et `errorHandler` : `ValidationError` → 422,
  `CastError` → 404, `11000` → 409 `{ message: "<champ> already in use" }`, http-errors gardent
  leur statut, 500 sans détail en production. Les routes **lèvent** des erreurs (`createError(403)`…),
  elles ne construisent pas elles-mêmes ces réponses.
- `middlewares/pagination.js` → `paginate` (pose `req.pagination = { page, pageSize, skip }`,
  400 si invalide) et `setPaginationHeaders(res, req.pagination, total)`. À utiliser pour toute liste.
- `models/user.js` : `username` (3-30, `[a-zA-Z0-9_]`, unique), `email` (unique, validé),
  `firstname`, `lastname`, `hash` (`select: false`, retiré du JSON), timestamps.
- `models/upload.js` + `routes/uploads.js` : `POST /uploads/signature` signe un `public_id`
  `heiguessr/<userId>/<uuid>` choisi par le serveur, `allowed_formats=jpg,png,webp`,
  `overwrite=false`. `POST /uploads { publicId }` vérifie que l'id appartient à l'utilisateur, lit
  les métadonnées **depuis Cloudinary**, refuse au-delà de 10 Mo puis enregistre.
- `openapi.yaml` servi sur `/api-docs` (`GET /` y redirige). CORS via `CORS_ORIGIN`, en-têtes
  `Location` et `Pagination-*` exposés au navigateur.
- `bin/start.js` connecte MongoDB puis démarre le serveur ; `app.js` ne se connecte pas.
- Tests : `test/helpers.js` (`useTestDatabase`, `createUser`, `tokenFor`, `authHeader`),
  un fichier `*.test.js` par router / middleware.
- `models/spot.js` : brouillon sans routes, à refaire dans l'issue Spots.

## Modèle de domaine (cible)

Coordonnées sur un plan : **pourcentages 0-100** de la largeur (`x`) et de la hauteur (`y`) de
l'image du plan, indépendants de la résolution. Le client et l'API utilisent la même convention.

| Modèle | Champs principaux | Liens |
| --- | --- | --- |
| `User` | + `role: "player" \| "admin"` (défaut `player`) | |
| `Upload` | voir ci-dessus | `owner` → User |
| `Floor` (plan d'étage) | `building` (ex. « Cheseaux »), `level` (Number), `name`, `plan` | `plan` → Upload. Unique (`building`, `level`) |
| `Spot` (zone de spawn) | `name`, `position { x, y }`, `createdBy` | `floor` → Floor, `image` → Upload, `createdBy` → User |
| `Game` | `code` (6 car. A-Z0-9, unique), `status: waiting \| playing \| finished`, `roundCount`, `currentRound`, `rounds: [{ spot, startedAt }]` | `host` → User, `players` → [User], `rounds.spot` → Spot |
| `Guess` | `round` (index), `floor`, `position { x, y }`, `distance`, `score` | `game` → Game, `player` → User, `floor` → Floor. Unique (`game`, `round`, `player`) |

Les rôles admin ne s'obtiennent **jamais** via l'API : seed ou modification manuelle en base.

## Routes (cible) et autorisations

Toutes les routes sauf `/auth/*` et `/api-docs` exigent `authenticate`.

| Méthode et chemin | Qui | Notes |
| --- | --- | --- |
| `GET /users/me`, `PATCH /users/me`, `DELETE /users/me` | soi-même | jamais `hash` ni `role` modifiable |
| `GET /users/:id` | connecté | profil public |
| `GET /users/:id/stats` | connecté | **agrégation** sur `Guess` : parties jouées, score total/moyen, meilleure partie |
| `GET /leaderboard?page&pageSize` | connecté | **agrégation + pagination** |
| `POST /uploads/signature`, `POST /uploads` | admin | images de plans et de spots |
| `GET /floors`, `GET /floors/:id` | connecté | les joueurs ont besoin des plans |
| `POST/PATCH/DELETE /floors[/:id]` | admin | refuser `DELETE` si des spots y sont liés (409) |
| `GET /spots?floor=&building=&page&pageSize` | admin | **filtres** + pagination. Contient la réponse (`position`) |
| `GET /spots/:id`, `POST`, `PATCH`, `DELETE` | admin | vérifier que `floor` et `image` existent (422) |
| `POST /games` | connecté | l'appelant devient `host` et premier joueur, génère le `code` |
| `GET /games?status=&code=&page&pageSize` | connecté | **filtres + pagination**, ne liste que les parties dont on est joueur, sauf recherche par `code` |
| `GET /games/:id` | joueurs de la partie | ne renvoie jamais la `position` du spot du round en cours |
| `POST /games/:id/players` `{ code }` | connecté | rejoindre. 409 si pas `waiting` ou déjà joueur |
| `DELETE /games/:id/players/:userId` | host, ou soi-même | quitter ou exclure |
| `PATCH /games/:id` `{ status }` | **host uniquement** | démarrer (`waiting` → `playing`) |
| `DELETE /games/:id` | **host uniquement** | seulement si `waiting` |
| `POST /games/:id/guesses` | joueur de la partie | round en cours, une fois par round. Calcule `distance` et `score` côté serveur |
| `GET /games/:id/guesses?round=` | joueurs de la partie | seulement pour les rounds terminés |

Score proposé (à valider par l'équipe) : mauvais étage = 0, sinon
`round(5000 * exp(-distance / 10))` où `distance` = distance euclidienne en % du plan.

## Conventions REST et code

- Noms de ressources au pluriel, imbrication pour l'appartenance (`/games/:id/guesses`). Pas de
  verbe dans les URL.
- Codes : 200 lecture/mise à jour, **201 + en-tête `Location`** à la création, 204 suppression,
  400 corps mal formé, 401 non authentifié, 403 authentifié mais non autorisé,
  404 ressource ou id invalide, 409 conflit (doublon, état incompatible), 422 validation.
  Uniformise : les erreurs de validation Mongoose donnent **422** `{ message, errors }`.
  `/auth/register` renvoie aujourd'hui 400 : à corriger.
- Pagination : `?page=1&pageSize=20` (max 100). Corps : tableau. En-têtes `Pagination-Page`,
  `Pagination-Page-Size`, `Pagination-Total` (+ `Link` optionnel). Un helper commun pour tous.
- `PATCH` pour les mises à jour partielles. Ne copie que les champs autorisés (liste blanche), jamais
  `req.body` en entier dans un modèle.
- Factoriser avec des middlewares : `authenticate`, `requireAdmin` (403), `loadGame` (charge
  `req.game` et renvoie 404 si l'id est invalide ou absent), `requireGamePlayer`, `requireGameHost`,
  validation d'`ObjectId`. Le mapping des erreurs Mongoose (`ValidationError` → 422,
  `CastError` → 404, `11000` → 409) va dans le **gestionnaire d'erreurs global** de `app.js`,
  pas dans chaque route.
- Les ressources liées doivent exister (`floor`, `image`, `spot`…) avant création ou mise à jour,
  sinon 422.
- Le gestionnaire d'erreurs ne renvoie pas `err.message` d'une 500 en production.
- Code et commentaires en anglais, doc README en français.
- Toute route ajoutée ou modifiée → mettre à jour `openapi.yaml` **et** les tests dans le même
  changement.

## Temps réel (wsmini)

- `realtime/index.js` crée un `WSServerPubSub` (ou `WSServerRoomManager` si besoin) démarré dans
  `bin/start.js` sur le **même serveur HTTP** : `wsServer.start({ server: httpServer, path: '/ws' })`,
  `origins` = `CORS_ORIGIN`.
- `authCallback(token)` vérifie le JWT (le client envoie le token avec `ws.connect(token)`) et
  renvoie `{ userId }` ou `false`.
- L'API REST reste la source de vérité. Les routes publient les événements **après** l'écriture en
  base (`player.joined`, `player.left`, `game.started`, `round.started`, `guess.submitted` sans
  position, `round.ended` avec résultats, `game.finished`). Clients en lecture seule :
  `usersCanPub: false`. `hookSub` refuse un client qui n'est pas joueur de la partie.
- Les routes appellent une fonction `publishGameEvent(gameId, type, data)`, qui est mockée dans les
  tests.

## Tests (node:test)

- `npm test` : `node --import ./test/setup-env.js --test --experimental-test-coverage
  --test-coverage-lines=75` sur `test/**/*.test.js`. Sous 75 % de lignes couvertes, `npm test` échoue.
- `test/setup-env.js` fixe les variables d'environnement de test. Chaque fichier de test appelle
  `useTestDatabase()` (`test/helpers.js`) : MongoDB en mémoire démarrée pour le fichier, collections
  vidées avant chaque test, arrêt à la fin. Aucune dépendance au `.env` local, au réseau ou à Cloudinary.
- Un middleware partagé se teste via une petite app Express de test (voir `test/middlewares.test.js`).
- Cloudinary : `mock.method(cloudinary.api, 'resource', ...)` et
  `mock.method(cloudinary.uploader, 'destroy', ...)`. Temps réel : mock de `publishGameEvent`.
- **Un test = une seule requête REST** testée. Les données nécessaires sont créées directement
  avec les modèles Mongoose (helpers `createUser`, `createAdmin`, `tokenFor(user)`, `createGame`…),
  pas via d'autres routes.
- Pour chaque route : cas de succès **et** erreurs (401, 403, 404, 409, 422). Vérifier le statut,
  les en-têtes utiles (`Location`, pagination) et le corps, et l'état en base si nécessaire.
- Reproductible : pas d'ordre entre fichiers, pas de dates ni d'aléatoire non contrôlés (mock du
  générateur de `code` si nécessaire).
