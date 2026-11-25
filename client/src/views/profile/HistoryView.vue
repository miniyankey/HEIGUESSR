<script setup>
import ComingSoon from '@/components/ComingSoon.vue'
</script>

<template>
  <h2>Historique</h2>
  <ComingSoon
    needs="les statistiques et les parties terminées (GET /users/:id/stats, GET /games)"
  />

  <section>
    <h3>Statistiques</h3>
    <p>Parties jouées, score total, score moyen, meilleure partie.</p>
  </section>

  <section>
    <h3>Parties terminées</h3>
    <p>Aucune partie pour l'instant.</p>
  </section>

  <nav class="actions">
    <a href="#profile">Retour au profil</a>
  </nav>
</template>
