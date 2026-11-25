<script setup>
// Game screen. The photo of the round will come from the game API; choosing a
// floor and clicking on its plan already work with GET /floors.
import { computed, onMounted, ref } from 'vue'
import { listFloors } from '@/api/resources.js'
import ComingSoon from '@/components/ComingSoon.vue'
import PlanPicker from '@/components/PlanPicker.vue'

const floors = ref([])
const floorId = ref('')
const position = ref(null)
const error = ref('')

const floor = computed(() => floors.value.find((f) => f._id === floorId.value))

function floorLabel(f) {
  return `${f.building} – ${f.letters.join(', ')}${f.name ? ` (${f.name})` : ''}`
}

function onFloorChange() {
  position.value = null
}

onMounted(async () => {
  try {
    floors.value = await listFloors()
  } catch (err) {
    error.value = err.message
  }
})
</script>

<template>
  <h2>Écran de jeu</h2>
  <ComingSoon needs="la photo de la manche et l'envoi du guess (POST /games/:id/guesses)" />

  <section>
    <h3>Où a été prise cette photo ?</h3>
    <div class="photo">Photo de la manche</div>
  </section>

  <section>
    <label>
      Étage
      <select v-model="floorId" @change="onFloorChange">
        <option value="" disabled>Choisir un étage</option>
        <option v-for="f in floors" :key="f._id" :value="f._id">{{ floorLabel(f) }}</option>
      </select>
    </label>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="!error && floors.length === 0">Aucun étage n'a encore été créé.</p>

    <template v-if="floor">
      <p>Cliquez sur le plan à l'endroit de la photo.</p>
      <PlanPicker v-model="position" :src="floor.plan.url" :alt="`Plan ${floorLabel(floor)}`" />
      <p v-if="position">Position : x = {{ position.x }} %, y = {{ position.y }} %</p>
    </template>
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
