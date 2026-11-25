// Session of the current user: token (kept in localStorage) and profile.
import { computed, reactive } from 'vue'
import { configureHttp } from '@/api/http.js'
import { getMe, login as loginRequest, register as registerRequest } from '@/api/resources.js'

const TOKEN_KEY = 'heiguessr.token'

export const session = reactive({
  token: localStorage.getItem(TOKEN_KEY),
  user: null,
})

export const isLoggedIn = computed(() => Boolean(session.token))
export const isAdmin = computed(() => session.user?.role === 'admin')

function setToken(token) {
  session.token = token
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

/** Loads the profile (and role) of the logged-in user. */
export async function loadUser() {
  session.user = await getMe()
  return session.user
}

export async function login(credentials) {
  const { token } = await loginRequest(credentials)
  setToken(token)
  await loadUser()
}

export async function register(account) {
  const { token } = await registerRequest(account)
  setToken(token)
  await loadUser()
}

export function logout() {
  setToken(null)
  session.user = null
  window.location.hash = '#login'
}

// An expired token or a deleted account ends the session
configureHttp({ getToken: () => session.token, onUnauthorized: logout })
