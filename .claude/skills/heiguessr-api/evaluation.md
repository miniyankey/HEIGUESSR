# Critères d'évaluation ArchiOWeb et état d'avancement

Légende : ✅ fait · 🟡 partiel / sur une branche non mergée · ❌ à faire.
Mettre à jour ce fichier quand un critère avance.

## REST API (Express + MongoDB)

| Critère | État | Comment on y répond |
| --- | --- | --- |
| Inscription | ✅ | `POST /auth/register` (validation en 422) |
| Authentification | ✅ | `POST /auth/login` → JWT |
| ≥ 2 autres types de ressources, liés entre eux | ✅ | `Floor` → `Upload`, `Spot` → `Floor` / `Upload` ; à venir `Game` → `Spot`, `Guess` → `Game` |
| Au moins un type lié aux utilisateurs | ✅ | `Spot.createdBy`, `Upload.owner` ; à venir `Game.host` / `Game.players`, `Guess.player` |
| CRUD minimal utilisable par une app mobile | 🟡 | floors ✅, spots ✅ ; games, guesses |
| Liste paginée | ✅ | `GET /spots` ; à venir `GET /games`, `GET /leaderboard` |
| Liste avec filtres optionnels | ✅ | `GET /floors?building=&letter=`, `GET /spots?floor=&building=` ; à venir `GET /games?status=&code=` |
| Agrégation MongoDB | ❌ | `GET /users/:id/stats`, `GET /leaderboard` (`$group` sur `Guess`) |
| Authentification JWT sur opérations sensibles | 🟡 | `authenticate` / `authenticateAdmin` ; à appliquer à chaque nouvelle route |
| Autorisations cohérentes avec le domaine | 🟡 | rôle admin en place : `/uploads`, `/spots` et l'écriture de `/floors` réservés aux admins ; host seul pour démarrer/supprimer une partie ; joueurs seuls pour voir/guess |
| ≥ 1 opération limitant un utilisateur authentifié | ✅ | `/uploads` réservé aux admins (403 pour un joueur) ; aussi `PATCH /games/:id` réservé au host, `/spots` réservé aux admins |
| Composante temps réel intégrée | ❌ | wsmini, événements publiés par les routes REST (cours DevMobile) |
| Fonctionnalité mobile (bonus) | 🟡 | images (Cloudinary, upload direct) |

## Infrastructure

| Critère | État | Notes |
| --- | --- | --- |
| Code sur GitHub | ✅ | `miniyankey/HEIGUESSR` |
| Déployé sur Render | ❌ | web service `api/`, `npm start`, variables d'env dans Render, HTTP + WS sur `PORT` |

## Documentation

| Critère | État | Notes |
| --- | --- | --- |
| Doc complète (chemins, params, en-têtes, corps, validations, réponses + codes) | 🟡 | `api/openapi.yaml` + Swagger UI sur `/api-docs` : `/auth`, `/users/me`, `/uploads`, `/floors` et `/spots` faits. Documenter chaque nouvelle route (401/403/404/409/422, pas 500) |

## Tests automatisés

| Critère | État | Notes |
| --- | --- | --- |
| ≥ 75 % de couverture, tests de qualité | 🟡 | `npm test` avec seuil 75 % (≈ 95 % actuellement) ; à maintenir pour chaque ressource |
| Tous les types d'opérations (create, read, list, update, delete) | 🟡 | CRUD complet testé pour `/floors` et `/spots` ; un fichier de test par router |
| Cas d'erreur, pas seulement le happy path | 🟡 | 401, 403, 404, 409, 422 pour chaque route |
| Un test = une opération REST | 🟡 | fixtures créées via les modèles, pas via l'API |
| Reproductible (`npm test` plusieurs fois) | ✅ | `mongodb-memory-server`, collections vidées, Cloudinary/WS mockés |

## Qualité d'implémentation

| Critère | État | Notes |
| --- | --- | --- |
| Méthodes, en-têtes et codes HTTP appropriés | 🟡 | 422 uniformisé pour la validation ; 201 + `Location`, 204 (fait pour `/floors` et `/spots`) |
| Hiérarchie d'URL cohérente | ❌ | ressources au pluriel, sous-ressources imbriquées |
| Code asynchrone correct | 🟡 | Express 5 gère les rejets ; `await` partout |
| Erreurs async gérées dans les routes | ✅ | Express 5 + `middlewares/errors.js` (Mongoose → 404/409/422) |
| Pas de duplication excessive (middlewares) | 🟡 | erreurs, pagination et `middlewares/resources.js` (chargement, liste blanche, query) centralisés ; à garder pour les nouvelles routes |
| Validations des entrées (Mongoose) | 🟡 | `User`, `Floor`, `Spot` ok ; `Game`, `Guess` à faire |
| Existence des ressources liées validée | 🟡 | `referenceTo` : `Floor.plan`, `Spot.floor`, `Spot.image` ✅ ; à venir `spot`, joueurs… |

## Dettes connues

- `POST /uploads` : une erreur Cloudinary autre que 404 donne une 500 sans message utile.
