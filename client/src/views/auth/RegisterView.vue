<script setup>
import { ref } from 'vue'
import { goTo } from '@/utils/navigation.js'
import { register } from '@/store/useSession.js'

const form = ref({
  username: '',
  email: '',
  firstname: '',
  lastname: '',
  password: '',
})
const error = ref('')
const errors = ref({})
const busy = ref(false)

async function onSubmit() {
  busy.value = true
  error.value = ''
  errors.value = {}
  try {
    await register(form.value)
    goTo('#home')
  } catch (err) {
    error.value = err.message
    errors.value = err.errors ?? {}
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <h2>Inscription</h2>
  <form @submit.prevent="onSubmit">
    <label>
      Nom d'utilisateur
      <input v-model="form.username" type="text" required minlength="3" maxlength="30" />
    </label>
    <p v-if="errors.username" class="error">{{ errors.username }}</p>
    <label>
      E-mail
      <input v-model="form.email" type="email" required />
    </label>
    <p v-if="errors.email" class="error">{{ errors.email }}</p>
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
    <p v-if="errors.password" class="error">{{ errors.password }}</p>
    <p v-if="error" class="error">{{ error }}</p>
    <button type="submit" :disabled="busy">Créer mon compte</button>
  </form>
  <p>
    Déjà inscrit·e ?
    <a href="#login">Se connecter</a>
  </p>
</template>
