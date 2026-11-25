<script setup>
import ComingSoon from '@/components/ComingSoon.vue'
import { session } from '@/store/useSession.js'
</script>

<template>
  <h2>Salle d'attente</h2>
  <ComingSoon needs="les parties et le temps réel (GET /games/:id, wsmini)" />

  <p>Code à partager : <strong>------</strong></p>

  <section>
    <h3>Joueur·euses</h3>
    <ul>
      <li>{{ session.user?.username }} (vous)</li>
    </ul>
  </section>

  <nav class="actions">
    <a href="#play">Démarrer (démo)</a>
    <a href="#games">Quitter</a>
  </nav>
</template>
