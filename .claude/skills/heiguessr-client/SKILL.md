---
name: heiguessr-client
description: Conventions, screens, API usage and real-time integration for the HEIGUESSR web client (Vue 3 + Vite, hash routing with useHashRoute, reactive session store, wsmini, Cloudinary direct upload). Use for any work in client/ - views, components, stores, API calls, game screen, admin screens, WebSocket.
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
- **Pas de vue-router ni de Pinia** : routage par hash avec `composable/useHashRoute.js` (code du
  cours DevMobUI, à ne pas reformater) et état partagé avec `reactive` dans `store/`.
  `fetch` natif (pas d'axios).
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

## Organisation des dossiers

| Dossier | Contenu | Exemple |
| --- | --- | --- |
| `composable/` | fonctions `useXxx()` qui utilisent l'API de composition (refs, `computed`, hooks `onMounted`…) et renvoient un objet lié au composant qui les appelle | `useHashRoute` |
| `store/` | état **réactif partagé** par toutes les pages, créé une fois au niveau du module | `useSession.js` |
| `utils/` | fonctions simples, **sans état réactif** | `navigation.js` |
| `api/` | appels HTTP vers l'API | `http.js`, `resources.js` |
| `components/` | composants réutilisables | `ComingSoon.vue` |
| `views/` | un écran par page, rangé par partie de l'application : `auth/`, `game/` (parcours d'une partie), `profile/`, `admin/` ; `HomeView.vue` à la racine | `views/admin/AdminSpotsView.vue` |

`store/useRoutes.js` (convention du cours) est une liste fixe de pages, pas un état partagé.

## Ce qui existe déjà (branche `10-add-client-base-screens`)

- `store/useRoutes.js` : liste des pages `{ hash, label, component, access }`, la première est la
  page par défaut. `access` : `guest` (déconnecté), `user` (connecté), `admin`.
- `App.vue` : `useHashRoute(routes)`, charge le profil au démarrage si un token existe, puis
  redirige selon `access` (sans token → `#login`, page admin sans rôle admin → `#home`).
- `utils/navigation.js` : `goTo('#hash')` et `hashParam()` (un paramètre après `/`, ex.
  `#lobby/<gameId>` : `useHashRoute` ne regarde que la partie avant le `/`). Les liens simples sont
  des `<a href="#...">`.
- `api/http.js` : `request(path, { method, body, query })` → `{ data, headers }`, préfixe
  `VITE_API_URL` (défaut `http://localhost:3000`, voir `.env.example`), token, `ApiError` avec
  `status`, `message`, `errors` (422). Sur 401 avec token : déconnexion. `readPagination(headers)`.
- `api/resources.js` : une fonction par route (`login`, `register`, `getMe`).
- `store/useSession.js` : `session` (`token` dans `localStorage`, `user`), `isLoggedIn`, `isAdmin`,
  `login`, `register`, `loadUser`, `logout`.
- `components/` : `ComingSoon` (écran en attente d'une API).
- Écrans **fonctionnels** : connexion, inscription, accueil, profil, menu admin.
- Étages, photos et choix de l'étage dans l'écran de jeu : `ComingSoon`, faits dans l'issue #23.
- Écrans **de base** (`ComingSoon`, en attente de l'API des parties, stats et utilisateurs) : liste
  des parties, création, salle d'attente, résultat de manche, résultat final, historique,
  utilisateurs. Leurs liens « (démo) » suivent le parcours prévu.
- `views/UploadTest.vue` : page de test non suivie par Git, **à supprimer**.

## Écrans

| Hash | Vue | Accès | API |
| --- | --- | --- | --- |
| `#login`, `#register` | LoginView, RegisterView | invité | ✅ |
| `#home` | HomeView : jouer, résumé personnel, admin | connecté | stats à venir |
| `#games` | GamesView : mes parties (filtres, pagination), rejoindre par code | connecté | à venir |
| `#new-game` | NewGameView : configuration | connecté | à venir |
| `#lobby/<id>` | LobbyView : joueur·euses en direct | joueur | à venir (+ wsmini) |
| `#play/<id>` | GameView : photo, étage, clic sur le plan | joueur | étages ✅, partie à venir |
| `#round-result/<id>`, `#final-result/<id>` | résultats et classement | joueur | à venir |
| `#profile`, `#history` | ProfileView, HistoryView (stats, parties) | connecté | profil ✅, stats à venir |
| `#admin`, `#admin-floors`, `#admin-spots` | menu, étages, photos | admin | ✅ (écrans dans #23) |
| `#admin-users` | AdminUsersView : rôles, suppression | admin | à venir (rôle via `set-role` pour l'instant) |

L'API reste juge des droits : le client ne fait que masquer l'UI.

## Appels API

- `api/http.js` centralise tout : préfixe `VITE_API_URL`, `Content-Type: application/json`,
  `Authorization: Bearer <token>` depuis `store/useSession.js`, parse JSON, lève une erreur portant
  `status`, `message` et `errors` (par champ, en 422).
  Sur **401** : vider la session et rediriger vers `#login` (fait dans `api/http.js`).
- Afficher les erreurs de validation `errors.<champ>` à côté du champ concerné.
- Listes paginées : lire les en-têtes `Pagination-*` et passer `?page=&pageSize=`.
- Le token (JWT, 7 jours) est stocké dans `localStorage` par `store/useSession.js` et relu au démarrage.

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
  (`onUnmounted`). Les messages ne font que **mettre à jour un store `store/game.js`** (à créer, `reactive`). Les composants
  réagissent au store.
- Les actions passent toujours par l'API REST (rejoindre, démarrer, guess). Le WebSocket est en
  lecture seule pour les clients. Après une reconnexion, recharger l'état avec `GET /games/:id`.

## Conventions

- Textes de l'UI en français, identifiants et commentaires en anglais.
- Composants petits et réutilisables, logique d'appel API hors des composants (`api/` + stores).
- Accessibilité de base : `label` sur chaque champ, `alt` sur les images, boutons et non `div`
  cliquables.
