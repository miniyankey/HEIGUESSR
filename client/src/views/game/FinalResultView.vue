<script setup>
import ComingSoon from '@/components/ComingSoon.vue'
</script>

<template>
  <h2>Résultat final</h2>
  <ComingSoon needs="le classement de la partie (GET /games/:id)" />

  <ol>
    <li>Classement des joueur·euses</li>
  </ol>

  <nav class="actions">
    <a href="#new-game">Rejouer</a>
    <a href="#home">Retour à l'accueil</a>
  </nav>
</template>
