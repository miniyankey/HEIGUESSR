<script setup>
import { ref } from 'vue'
import { goTo } from '@/utils/navigation.js'
import { login } from '@/store/useSession.js'

const username = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

async function onSubmit() {
  busy.value = true
  error.value = ''
  try {
    await login({ username: username.value, password: password.value })
    goTo('#home')
  } catch (err) {
    error.value = err.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <h2>Connexion</h2>
  <form @submit.prevent="onSubmit">
    <label>
      Nom d'utilisateur
      <input v-model="username" type="text" required autocomplete="username" />
    </label>
    <label>
      Mot de passe
      <input v-model="password" type="password" required autocomplete="current-password" />
    </label>
    <p v-if="error" class="error">{{ error }}</p>
    <button type="submit" :disabled="busy">Se connecter</button>
  </form>
  <p>
    Pas de compte ?
    <a href="#register">S'inscrire</a>
  </p>
</template>
