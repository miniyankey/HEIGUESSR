<script setup>
import { ref } from 'vue'

const form = ref({
  username: '',
  email: '',
  firstname: '',
  lastname: '',
  password: '',
})

function onSubmit() {
  // TODO (issue #7) : appeler POST /auth/register et stocker le token
}
</script>

<template>
  <h2>Inscription</h2>
  <form @submit.prevent="onSubmit">
    <label>
      Nom d'utilisateur
      <input v-model="form.username" type="text" required minlength="3" maxlength="30" />
    </label>
    <label>
      E-mail
      <input v-model="form.email" type="email" required />
    </label>
    <label>
      Prénom
      <input v-model="form.firstname" type="text" maxlength="50" />
    </label>
    <label>
      Nom
      <input v-model="form.lastname" type="text" maxlength="50" />
    </label>
    <label>
      Mot de passe (8 caractères minimum)
      <input
        v-model="form.password"
        type="password"
        required
        minlength="8"
        autocomplete="new-password"
      />
    </label>
    <button type="submit">Créer mon compte</button>
  </form>
  <p>Déjà inscrit·e ? <RouterLink to="/login">Se connecter</RouterLink></p>
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
