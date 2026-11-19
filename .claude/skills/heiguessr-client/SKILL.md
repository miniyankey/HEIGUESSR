---
name: heiguessr-client
description: Conventions, screens, API usage and real-time integration for the HEIGUESSR web client (Vue 3 + Vite, vue-router, Pinia, wsmini, Cloudinary direct upload). Use for any work in client/ - views, components, stores, API calls, game screen, admin screens, WebSocket.
---

# HEIGUESSR - Client

Client web du jeu HEIGUESSR (« guess the location » à la HEIG-VD). Le joueur voit la photo d'un
endroit, choisit l'étage puis clique sur le plan de cet étage. Les parties sont multijoueurs
(code d'invitation) et synchronisées en temps réel. Les admins gèrent plans et spots.

Le client consomme l'API décrite dans le skill `heiguessr-api` : modèle de domaine, routes,
autorisations et convention de coordonnées. Lis-le avant de toucher aux appels API.
La doc de référence des routes est `api/openapi.yaml` (Swagger UI sur `<API>/api-docs`).
Le client n'est pas noté en ArchiOWeb : la composante temps réel l'est en Développement Mobile.
Pour livrer le travail (issues, branches, commits, PR), suis le skill `heiguessr-git-workflow` :
ne committe jamais toi-même, donne les commits par message.

## Stack et commandes

- **Vue 3** (`<script setup>`, Composition API), **Vite**, alias `@` → `src/`.
- **vue-router** (routes), **Pinia** (état session + partie), `fetch` natif (pas d'axios).
- Temps réel : **wsmini** côté navigateur (`import { WSClient } from 'wsmini'`).
- **Pas de tests automatisés côté client** : la couverture de 75 % ne concerne que l'API.
  Vérification par `npm run lint`, `npm run build` et un test manuel.
- Qualité : `npm run lint` (oxlint + eslint), `npm run format` (Prettier).
  Style : **sans point-virgule, guillemets simples, 100 colonnes, 2 espaces, LF**.

```bash
cd client
npm run dev      # http://localhost:5173 (l'API doit tourner, voir api/README.md)
npm run build
```

Variables Vite (`client/.env.local`, non commité) :
`VITE_API_URL` (ex. `http://localhost:3000`) et `VITE_WS_URL` (ex. `ws://localhost:3000/ws`).
Ne jamais coder d'URL en dur dans les composants.

## Ce qui existe déjà

- `main` : squelette Vite (`App.vue`, `main.js`), aucun écran.
- Branche `10-add-client-base-screens` (pas encore mergée) : `router/index.js`, `LoginView`,
  `RegisterView` (formulaires sans appel API, `TODO (issue #7)`), `PlanView` (affiche
  `public/plan.webp`).
  ⚠️ `vue-router` y a été installé dans le `package.json` **à la racine du dépôt** au lieu de
  `client/package.json` : à réinstaller dans `client/` (et supprimer `package.json`,
  `package-lock.json` et `node_modules` à la racine).
- Branche 9 : `views/UploadTest.vue`, page de test de l'upload Cloudinary **à supprimer**. Elle sert
  de référence pour le flux d'upload ci-dessous.

## Structure cible

```
client/src/
├── api/            # client HTTP : http.js (fetch + token + erreurs) puis un module par ressource
├── realtime/       # connexion wsmini (une instance partagée)
├── stores/         # Pinia : auth.js (token, user), game.js (partie en cours)
├── router/         # routes + garde d'authentification / rôle admin
├── components/     # PlanPicker, FloorSelector, SpotImage, PlayerList, Scoreboard…
└── views/          # un écran par route
```

## Écrans

| Route | Vue | Accès |
| --- | --- | --- |
| `/login`, `/register` | LoginView, RegisterView | invité |
| `/` | HomeView : créer une partie, rejoindre avec un code, mes parties | connecté |
| `/games/:id` | LobbyView puis GameView selon `status` | joueur de la partie |
| `/games/:id/results` | ResultsView : scores par round et classement | joueur |
| `/profile`, `/users/:id` | stats (agrégation) | connecté |
| `/leaderboard` | classement paginé | connecté |
| `/admin/floors`, `/admin/spots` | CRUD plans et spots avec upload d'images | admin |

Garde de route : sans token → `/login`. Route admin et `user.role !== 'admin'` → `/`.
L'API reste juge des droits : le client ne fait que masquer l'UI.

## Appels API

- `api/http.js` centralise tout : préfixe `VITE_API_URL`, `Content-Type: application/json`,
  `Authorization: Bearer <token>` depuis le store `auth`, parse JSON, lève une erreur portant
  `status`, `message` et `errors` (par champ, en 422).
  Sur **401** : vider la session et rediriger vers `/login`.
- Afficher les erreurs de validation `errors.<champ>` à côté du champ concerné.
- Listes paginées : lire les en-têtes `Pagination-*` et passer `?page=&pageSize=`.
- Le token (JWT, 7 jours) est stocké dans `localStorage` par le store `auth` et relu au démarrage.

## Plan et coordonnées

- Positions en **pourcentages 0-100** du plan : `x = (offsetX / img.clientWidth) * 100`,
  `y = (offsetY / img.clientHeight) * 100`. Afficher un marqueur en `left: x%; top: y%` dans un
  conteneur `position: relative`. Le résultat est indépendant de la taille d'écran et tient sur mobile.
- Ordre d'un guess : choisir le `Floor` (sélecteur d'étages du bâtiment) → afficher son plan →
  cliquer → confirmer → `POST /games/:id/guesses { floor, position: { x, y } }`.
- Pendant un round, le client n'a **jamais** la position du spot : il la reçoit à la fin du round.

## Upload d'images (admin)

Upload **direct vers Cloudinary**, sans passer le fichier à l'API :
1. `POST /uploads/signature` → `{ uploadUrl, apiKey, signature, params }`.
2. `FormData` : `file`, `api_key`, `signature` et **chaque entrée de `params` telle quelle**
   (ne rien ajouter ni modifier, sinon la signature est invalide), puis `POST uploadUrl`.
3. `POST /uploads { publicId: <public_id renvoyé par Cloudinary> }` → document `Upload` (avec `_id`
   à utiliser comme `plan` d'un Floor ou `image` d'un Spot).
Formats acceptés : jpg, png, webp, 10 Mo max (`accept="image/jpeg,image/png,image/webp"`).

## Temps réel (wsmini)

- Une connexion `WSClient(VITE_WS_URL)` partagée (`realtime/`), ouverte après le login avec
  `await ws.connect(token)`, fermée au logout.
- S'abonner au canal de la partie en entrant dans le lobby, se désabonner en le quittant
  (`onUnmounted`). Les messages ne font que **mettre à jour le store `game`**. Les composants
  réagissent au store.
- Les actions passent toujours par l'API REST (rejoindre, démarrer, guess). Le WebSocket est en
  lecture seule pour les clients. Après une reconnexion, recharger l'état avec `GET /games/:id`.

## Conventions

- Textes de l'UI en français, identifiants et commentaires en anglais.
- Composants petits et réutilisables, logique d'appel API hors des composants (`api/` + stores).
- Accessibilité de base : `label` sur chaque champ, `alt` sur les images, boutons et non `div`
  cliquables.
