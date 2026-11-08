<script setup>
import { ref } from 'vue'

const username = ref('')
const password = ref('')

function onSubmit() {
  // TODO (issue #7) : appeler POST /auth/login et stocker le token
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
    <button type="submit">Se connecter</button>
  </form>
  <p>Pas de compte ? <RouterLink to="/register">S'inscrire</RouterLink></p>
</template>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 320px;
}
label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
</style>
