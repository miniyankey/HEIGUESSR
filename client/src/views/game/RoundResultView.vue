<script setup>
import ComingSoon from '@/components/ComingSoon.vue'
</script>

<template>
  <h2>Résultat de la manche</h2>
  <ComingSoon needs="les guesses de la manche (GET /games/:id/guesses?round=)" />

  <p>Bonne position, distance et score de chaque joueur·euse.</p>

  <nav class="actions">
    <a href="#play">Manche suivante (démo)</a>
    <a href="#final-result">Voir le résultat final (démo)</a>
  </nav>
</template>
