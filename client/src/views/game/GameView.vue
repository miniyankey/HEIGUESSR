<script setup>
import ComingSoon from '@/components/ComingSoon.vue'
</script>

<template>
  <h2>Écran de jeu</h2>
  <ComingSoon needs="la photo de la manche et l'envoi du guess (POST /games/:id/guesses)" />

  <section>
    <h3>Où a été prise cette photo ?</h3>
    <div class="photo">Photo de la manche</div>
  </section>

  <section>
    <p>Choix de l'étage, puis clic sur son plan.</p>
  </section>

  <nav class="actions">
    <a href="#round-result">Valider (démo)</a>
  </nav>
</template>

<style scoped>
.photo {
  display: grid;
  place-items: center;
  max-width: 800px;
  aspect-ratio: 16 / 9;
  background: #ddd;
}
</style>
