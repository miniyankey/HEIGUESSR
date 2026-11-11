<script setup>
import { ref, computed } from 'vue'
import LoginView from './views/LoginView.vue'
import RegisterView from './views/RegisterView.vue'
import PlanView from './views/PlanView.vue'

const pages = { login: LoginView, register: RegisterView, plan: PlanView }
const current = ref('login')
const currentComponent = computed(() => pages[current.value])
</script>

<template>
  <header>
    <h1>HEIGUESSR</h1>
    <nav>
      <button type="button" @click="current = 'login'">Connexion</button>
      <button type="button" @click="current = 'register'">Inscription</button>
      <button type="button" @click="current = 'plan'">Plan</button>
    </nav>
  </header>
  <main>
    <component :is="currentComponent" @navigate="current = $event" />
  </main>
</template>

<style scoped>
nav {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
</style>
