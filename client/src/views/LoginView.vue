<script setup>
import { ref } from 'vue'

const emit = defineEmits(['navigate'])

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
  <p>
    Pas de compte ?
    <button type="button" class="link" @click="emit('navigate', 'register')">S'inscrire</button>
  </p>
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
.link {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
}
</style>
