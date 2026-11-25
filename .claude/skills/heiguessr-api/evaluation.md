# Critères d'évaluation ArchiOWeb et état d'avancement

Légende : ✅ fait · 🟡 partiel / sur une branche non mergée · ❌ à faire.
Mettre à jour ce fichier quand un critère avance.

## REST API (Express + MongoDB)

| Critère | État | Comment on y répond |
| --- | --- | --- |
| Inscription | ✅ | `POST /auth/register` (validation en 422) |
| Authentification | ✅ | `POST /auth/login` → JWT |
| ≥ 2 autres types de ressources, liés entre eux | ❌ | `Floor` ← `Spot` → `Upload` ; `Game` → `Spot`, `Guess` → `Game` |
| Au moins un type lié aux utilisateurs | ❌ | `Game.host` / `Game.players`, `Guess.player`, `Spot.createdBy`, `Upload.owner` (🟡) |
| CRUD minimal utilisable par une app mobile | ❌ | floors, spots, games, guesses |
| Liste paginée | ❌ | helper `paginate` prêt ; `GET /games`, `GET /spots`, `GET /leaderboard` |
| Liste avec filtres optionnels | ❌ | `GET /spots?floor=&building=`, `GET /games?status=&code=` |
| Agrégation MongoDB | ❌ | `GET /users/:id/stats`, `GET /leaderboard` (`$group` sur `Guess`) |
| Authentification JWT sur opérations sensibles | 🟡 | `authenticate` / `authenticateAdmin` ; à appliquer à chaque nouvelle route |
| Autorisations cohérentes avec le domaine | 🟡 | rôle admin en place, `/uploads` réservé aux admins ; admin seul pour floors/spots/uploads ; host seul pour démarrer/supprimer une partie ; joueurs seuls pour voir/guess |
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
| Doc complète (chemins, params, en-têtes, corps, validations, réponses + codes) | 🟡 | `api/openapi.yaml` + Swagger UI sur `/api-docs` : `/auth` et `/uploads` faits. Documenter chaque nouvelle route (401/403/404/409/422, pas 500) |

## Tests automatisés

| Critère | État | Notes |
| --- | --- | --- |
| ≥ 75 % de couverture, tests de qualité | 🟡 | `npm test` avec seuil 75 % (≈ 94 % actuellement) ; à maintenir pour chaque ressource |
| Tous les types d'opérations (create, read, list, update, delete) | 🟡 | seulement des create pour l'instant ; un fichier de test par router |
| Cas d'erreur, pas seulement le happy path | 🟡 | 401, 403, 404, 409, 422 pour chaque route |
| Un test = une opération REST | 🟡 | fixtures créées via les modèles, pas via l'API |
| Reproductible (`npm test` plusieurs fois) | ✅ | `mongodb-memory-server`, collections vidées, Cloudinary/WS mockés |

## Qualité d'implémentation

| Critère | État | Notes |
| --- | --- | --- |
| Méthodes, en-têtes et codes HTTP appropriés | 🟡 | 422 uniformisé pour la validation ; 201 + `Location`, 204 pour les nouvelles ressources |
| Hiérarchie d'URL cohérente | ❌ | ressources au pluriel, sous-ressources imbriquées |
| Code asynchrone correct | 🟡 | Express 5 gère les rejets ; `await` partout |
| Erreurs async gérées dans les routes | ✅ | Express 5 + `middlewares/errors.js` (Mongoose → 404/409/422) |
| Pas de duplication excessive (middlewares) | 🟡 | erreurs et pagination centralisées ; à garder pour les nouvelles routes |
| Validations des entrées (Mongoose) | 🟡 | `User` ok, autres modèles à faire |
| Existence des ressources liées validée | ❌ | `floor`, `image`, `spot`, joueurs… |

## Dettes connues

- `POST /uploads` : une erreur Cloudinary autre que 404 donne une 500 sans message utile.
