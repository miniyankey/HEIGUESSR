<script setup>
import { ref } from 'vue'
import ComingSoon from '@/components/ComingSoon.vue'

const code = ref('')
</script>

<template>
  <h2>Liste des parties</h2>
  <ComingSoon needs="les parties (GET /games?status=&code=&page=&pageSize=)" />

  <section>
    <h3>Filtres</h3>
    <label>
      Statut
      <select disabled>
        <option>Toutes</option>
        <option>En attente</option>
        <option>En cours</option>
        <option>Terminées</option>
      </select>
    </label>
  </section>

  <section>
    <h3>Mes parties</h3>
    <p>Aucune partie pour l'instant.</p>
  </section>

  <section>
    <h3>Rejoindre une partie</h3>
    <form @submit.prevent>
      <label>
        Code de la partie
        <input v-model="code" type="text" maxlength="6" placeholder="ABC123" disabled />
      </label>
      <button type="submit" disabled>Rejoindre</button>
    </form>
  </section>

  <nav class="actions">
    <a href="#new-game">Créer une partie</a>
    <a href="#home">Retour à l'accueil</a>
  </nav>
</template>
