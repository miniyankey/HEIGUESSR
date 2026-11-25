<script setup>
import { onMounted, ref } from 'vue'
import { loadUser, logout, session } from '@/store/useSession.js'

const error = ref('')

// Reload the profile, in case it changed since the login
onMounted(async () => {
  try {
    await loadUser()
  } catch (err) {
    error.value = err.message
  }
})
</script>

<template>
  <h2>Mon profil</h2>
  <p v-if="error" class="error">{{ error }}</p>

  <dl v-if="session.user">
    <dt>Nom d'utilisateur</dt>
    <dd>{{ session.user.username }}</dd>
    <dt>E-mail</dt>
    <dd>{{ session.user.email }}</dd>
    <dt>Prénom et nom</dt>
    <dd>{{ [session.user.firstname, session.user.lastname].filter(Boolean).join(' ') || '–' }}</dd>
    <dt>Rôle</dt>
    <dd>{{ session.user.role === 'admin' ? 'Admin' : 'Joueur·euse' }}</dd>
  </dl>

  <nav class="actions">
    <a href="#history">Historique et statistiques</a>
    <button type="button" @click="logout">Se déconnecter</button>
  </nav>
</template>
