<script setup>
import { onMounted, ref } from 'vue'
import { BUILDINGS, createFloor, deleteFloor, listFloors, updateFloor } from '@/api/resources.js'
import ImageUpload from '@/components/ImageUpload.vue'

const floors = ref([])
const building = ref('')
const listError = ref('')

// Form shared by creation (editingId null) and edition
const editingId = ref(null)
const form = ref(emptyForm())
const planUrl = ref('')
const error = ref('')
const errors = ref({})

function emptyForm() {
  return { building: BUILDINGS[0], level: 0, letters: '', name: '', plan: '' }
}

async function load() {
  listError.value = ''
  try {
    floors.value = await listFloors({ building: building.value })
  } catch (err) {
    listError.value = err.message
  }
}

function resetForm() {
  editingId.value = null
  form.value = emptyForm()
  planUrl.value = ''
  error.value = ''
  errors.value = {}
}

function edit(floor) {
  resetForm()
  editingId.value = floor._id
  form.value = {
    building: floor.building,
    level: floor.level,
    letters: floor.letters.join(', '),
    name: floor.name ?? '',
    plan: floor.plan._id,
  }
  planUrl.value = floor.plan.url
}

function onPlanUploaded(upload) {
  form.value.plan = upload._id
  planUrl.value = upload.url
}

async function save() {
  error.value = ''
  errors.value = {}
  const floor = {
    ...form.value,
    // "C, D" -> ["C", "D"]
    letters: form.value.letters.split(/[\s,]+/).filter(Boolean),
  }
  try {
    if (editingId.value) {
      await updateFloor(editingId.value, floor)
    } else {
      await createFloor(floor)
    }
    resetForm()
    await load()
  } catch (err) {
    error.value = err.message
    errors.value = err.errors ?? {}
  }
}

async function remove(floor) {
  if (!window.confirm(`Supprimer l'étage ${floor.building} ${floor.letters.join(', ')} ?`)) {
    return
  }
  try {
    await deleteFloor(floor._id)
    await load()
  } catch (err) {
    // 409 when spots are still on the floor
    listError.value = err.message
  }
}

onMounted(load)
</script>

<template>
  <h2>Étages</h2>
  <nav class="actions">
    <a href="#admin">Retour à l'administration</a>
  </nav>

  <section>
    <h3>Liste</h3>
    <label>
      Bâtiment
      <select v-model="building" @change="load">
        <option value="">Tous</option>
        <option v-for="b in BUILDINGS" :key="b" :value="b">{{ b }}</option>
      </select>
    </label>
    <p v-if="listError" class="error">{{ listError }}</p>
    <table v-if="floors.length">
      <thead>
        <tr>
          <th>Bâtiment</th>
          <th>Niveau</th>
          <th>Lettres</th>
          <th>Nom</th>
          <th>Plan</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="floor in floors" :key="floor._id">
          <td>{{ floor.building }}</td>
          <td>{{ floor.level }}</td>
          <td>{{ floor.letters.join(', ') }}</td>
          <td>{{ floor.name }}</td>
          <td>
            <img :src="floor.plan.url" :alt="`Plan ${floor.letters.join(', ')}`" class="thumb" />
          </td>
          <td>
            <button type="button" @click="edit(floor)">Modifier</button>
            <button type="button" @click="remove(floor)">Supprimer</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else>Aucun étage.</p>
  </section>

  <section>
    <h3>{{ editingId ? "Modifier l'étage" : 'Nouvel étage' }}</h3>
    <form @submit.prevent="save">
      <label>
        Bâtiment
        <select v-model="form.building" required>
          <option v-for="b in BUILDINGS" :key="b" :value="b">{{ b }}</option>
        </select>
      </label>
      <p v-if="errors.building" class="error">{{ errors.building }}</p>
      <label>
        Niveau (0 = rez, négatif = sous-sol ; sert à l'ordre)
        <input v-model.number="form.level" type="number" step="1" required />
      </label>
      <p v-if="errors.level" class="error">{{ errors.level }}</p>
      <label>
        Lettres (plusieurs si l'étage a des zones non reliées, ex. « C, D »)
        <input v-model="form.letters" type="text" required />
      </label>
      <p v-if="errors.letters" class="error">{{ errors.letters }}</p>
      <label>
        Nom (facultatif)
        <input v-model="form.name" type="text" maxlength="100" />
      </label>
      <ImageUpload label="Plan" @uploaded="onPlanUploaded" />
      <img v-if="planUrl" :src="planUrl" alt="Plan choisi" class="preview" />
      <p v-if="errors.plan" class="error">{{ errors.plan }}</p>
      <p v-if="error" class="error">{{ error }}</p>
      <div class="actions">
        <button type="submit" :disabled="!form.plan">
          {{ editingId ? 'Enregistrer' : "Créer l'étage" }}
        </button>
        <button v-if="editingId" type="button" @click="resetForm">Annuler</button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.thumb {
  width: 80px;
}
.preview {
  max-width: 400px;
}
</style>
