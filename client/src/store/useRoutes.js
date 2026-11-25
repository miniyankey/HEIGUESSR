// Pages of the client, used by useHashRoute. The first one is the default page.
// access: 'guest' (logged out only), 'user' (logged in) or 'admin'.
// The API stays the judge of permissions: hiding a page is only for the UI.
import AdminFloorsView from '@/views/admin/AdminFloorsView.vue'
import AdminSpotsView from '@/views/admin/AdminSpotsView.vue'
import AdminUsersView from '@/views/admin/AdminUsersView.vue'
import AdminView from '@/views/admin/AdminView.vue'
import FinalResultView from '@/views/game/FinalResultView.vue'
import GamesView from '@/views/game/GamesView.vue'
import GameView from '@/views/game/GameView.vue'
import HistoryView from '@/views/profile/HistoryView.vue'
import HomeView from '@/views/HomeView.vue'
import LobbyView from '@/views/game/LobbyView.vue'
import LoginView from '@/views/auth/LoginView.vue'
import NewGameView from '@/views/game/NewGameView.vue'
import ProfileView from '@/views/profile/ProfileView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import RoundResultView from '@/views/game/RoundResultView.vue'

export const routes = [
  { hash: '#home', label: 'Accueil', component: HomeView, access: 'user' },
  { hash: '#login', label: 'Connexion', component: LoginView, access: 'guest' },
  { hash: '#register', label: 'Inscription', component: RegisterView, access: 'guest' },
  { hash: '#games', label: 'Parties', component: GamesView, access: 'user' },
  { hash: '#new-game', label: 'Création de partie', component: NewGameView, access: 'user' },
  { hash: '#lobby', label: "Salle d'attente", component: LobbyView, access: 'user' },
  { hash: '#play', label: 'Écran de jeu', component: GameView, access: 'user' },
  {
    hash: '#round-result',
    label: 'Résultat de manche',
    component: RoundResultView,
    access: 'user',
  },
  { hash: '#final-result', label: 'Résultat final', component: FinalResultView, access: 'user' },
  { hash: '#profile', label: 'Profil', component: ProfileView, access: 'user' },
  { hash: '#history', label: 'Historique', component: HistoryView, access: 'user' },
  { hash: '#admin', label: 'Administration', component: AdminView, access: 'admin' },
  { hash: '#admin-floors', label: 'Étages', component: AdminFloorsView, access: 'admin' },
  { hash: '#admin-spots', label: 'Photos', component: AdminSpotsView, access: 'admin' },
  { hash: '#admin-users', label: 'Utilisateurs', component: AdminUsersView, access: 'admin' },
]
