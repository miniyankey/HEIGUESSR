<script setup>
import ComingSoon from '@/components/ComingSoon.vue'
import { isAdmin, session } from '@/store/useSession.js'
</script>

<template>
  <h2>Accueil</h2>
  <p>
    Bonjour <strong>{{ session.user?.username }}</strong>
    <span v-if="isAdmin">(admin)</span>
  </p>

  <section>
    <h3>Résumé personnel</h3>
    <ComingSoon needs="les statistiques du joueur (GET /users/:id/stats)" />
  </section>

  <nav class="actions">
    <a href="#games">Jouer</a>
    <a href="#profile">Mon profil</a>
    <a v-if="isAdmin" href="#admin">Administration</a>
  </nav>
</template>
