<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useHashRoute } from '@/composable/useHashRoute.js'
import { goTo } from '@/utils/navigation.js'
import { isAdmin, isLoggedIn, loadUser, logout, session } from '@/store/useSession.js'
import { routes } from '@/store/useRoutes.js'

const { currentComponent, currentRoute } = useHashRoute(routes)

// Wait for the profile (and its role) before showing a page
const ready = ref(false)

/** Page to go to when the current one is not allowed, or null. */
const redirect = computed(() => {
  const { access } = currentRoute.value
  if (access === 'guest' && isLoggedIn.value) return '#home'
  if (access !== 'guest' && !isLoggedIn.value) return '#login'
  if (access === 'admin' && !isAdmin.value) return '#home'
  return null
})

watch([redirect, ready], () => {
  if (ready.value && redirect.value) {
    goTo(redirect.value)
  }
})

onMounted(async () => {
  if (session.token) {
    try {
      await loadUser()
    } catch {
      // 401: the session store already logged out; other errors: show the login page
      logout()
    }
  }
  ready.value = true
})
</script>

<template>
  <header>
    <h1><a href="#home">HEIGUESSR</a></h1>
    <nav v-if="isLoggedIn" class="actions">
      <a href="#home">Accueil</a>
      <a href="#games">Parties</a>
      <a href="#profile">Profil</a>
      <a v-if="isAdmin" href="#admin">Admin</a>
      <button type="button" @click="logout">Déconnexion ({{ session.user?.username }})</button>
    </nav>
  </header>
  <main v-if="ready && !redirect">
    <component :is="currentComponent" :key="currentRoute.hash" />
  </main>
</template>

<style>
body {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
  font-family: system-ui, sans-serif;
}
h1 a {
  color: inherit;
  text-decoration: none;
}
form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
}
label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
}
.error {
  color: crimson;
}
table {
  border-collapse: collapse;
}
th,
td {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ccc;
  text-align: left;
}
</style>
