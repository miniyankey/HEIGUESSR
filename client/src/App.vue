<script setup></script>

<template>
  <header>
    <h1>HEIGUESSR</h1>
    <nav>
      <RouterLink to="/login">Connexion</RouterLink>
      <RouterLink to="/register">Inscription</RouterLink>
      <RouterLink to="/plan">Plan</RouterLink>
    </nav>
  </header>
  <main>
    <RouterView />
  </main>
</template>

<style scoped>
nav {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
</style>
