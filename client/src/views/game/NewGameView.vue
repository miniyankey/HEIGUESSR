<script setup>
import { ref } from 'vue'
import ComingSoon from '@/components/ComingSoon.vue'

const roundCount = ref(5)
</script>

<template>
  <h2>Création de partie</h2>
  <ComingSoon needs="la création de partie (POST /games)" />

  <form @submit.prevent>
    <label>
      Nombre de manches
      <input v-model.number="roundCount" type="number" min="1" max="20" />
    </label>
    <button type="submit" disabled>Créer</button>
  </form>

  <nav class="actions">
    <a href="#lobby">Voir la salle d'attente (démo)</a>
    <a href="#games">Retour aux parties</a>
  </nav>
</template>
