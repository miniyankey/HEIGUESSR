<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  BUILDINGS,
  createSpot,
  deleteSpot,
  listFloors,
  listSpots,
  updateSpot,
} from '@/api/resources.js'
import ImageUpload from '@/components/ImageUpload.vue'
import PlanPicker from '@/components/PlanPicker.vue'

const PAGE_SIZE = 10

const floors = ref([])
const spots = ref([])
const pagination = ref({ page: 1, pageSize: PAGE_SIZE, total: 0 })
const filters = ref({ building: '', floor: '' })
const listError = ref('')

// Form shared by creation (editingId null) and edition
const editingId = ref(null)
const form = ref(emptyForm())
const imageUrl = ref('')
const error = ref('')
const errors = ref({})

const pageCount = computed(() => Math.max(1, Math.ceil(pagination.value.total / PAGE_SIZE)))
const formFloor = computed(() => floors.value.find((f) => f._id === form.value.floor))
// Floors offered in the filter: those of the chosen building
const filterFloors = computed(() =>
  floors.value.filter((f) => !filters.value.building || f.building === filters.value.building),
)

function emptyForm() {
  return { name: '', floor: '', image: '', position: null }
}

function floorLabel(floor) {
  return `${floor.building} – ${floor.letters.join(', ')}${floor.name ? ` (${floor.name})` : ''}`
}

async function loadSpots(page = 1) {
  listError.value = ''
  try {
    const result = await listSpots({ ...filters.value, page, pageSize: PAGE_SIZE })
    spots.value = result.spots
    pagination.value = result.pagination
  } catch (err) {
    listError.value = err.message
  }
}

function onBuildingFilterChange() {
  filters.value.floor = ''
  loadSpots()
}

function resetForm() {
  editingId.value = null
  form.value = emptyForm()
  imageUrl.value = ''
  error.value = ''
  errors.value = {}
}

function edit(spot) {
  resetForm()
  editingId.value = spot._id
  form.value = {
    name: spot.name,
    floor: spot.floor._id,
    image: spot.image._id,
    position: { ...spot.position },
  }
  imageUrl.value = spot.image.url
}

function onImageUploaded(upload) {
  form.value.image = upload._id
  imageUrl.value = upload.url
}

// The position belongs to the plan of a floor: choose it again on another floor
function onFormFloorChange() {
  form.value.position = null
}

async function save() {
  error.value = ''
  errors.value = {}
  try {
    if (editingId.value) {
      await updateSpot(editingId.value, form.value)
    } else {
      await createSpot(form.value)
    }
    resetForm()
    await loadSpots(pagination.value.page)
  } catch (err) {
    error.value = err.message
    errors.value = err.errors ?? {}
  }
}

async function remove(spot) {
  if (!window.confirm(`Supprimer la photo « ${spot.name} » ?`)) {
    return
  }
  try {
    await deleteSpot(spot._id)
    await loadSpots(pagination.value.page)
  } catch (err) {
    listError.value = err.message
  }
}

onMounted(async () => {
  try {
    floors.value = await listFloors()
  } catch (err) {
    listError.value = err.message
  }
  await loadSpots()
})
</script>

<template>
  <h2>Photos</h2>
  <nav class="actions">
    <a href="#admin">Retour à l'administration</a>
  </nav>

  <section>
    <h3>Liste</h3>
    <div class="actions">
      <label>
        Bâtiment
        <select v-model="filters.building" @change="onBuildingFilterChange">
          <option value="">Tous</option>
          <option v-for="b in BUILDINGS" :key="b" :value="b">{{ b }}</option>
        </select>
      </label>
      <label>
        Étage
        <select v-model="filters.floor" @change="loadSpots()">
          <option value="">Tous</option>
          <option v-for="f in filterFloors" :key="f._id" :value="f._id">{{ floorLabel(f) }}</option>
        </select>
      </label>
    </div>
    <p v-if="listError" class="error">{{ listError }}</p>

    <table v-if="spots.length">
      <thead>
        <tr>
          <th>Photo</th>
          <th>Nom</th>
          <th>Étage</th>
          <th>Position</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="spot in spots" :key="spot._id">
          <td><img :src="spot.image.url" :alt="spot.name" class="thumb" /></td>
          <td>{{ spot.name }}</td>
          <td>{{ floorLabel(spot.floor) }}</td>
          <td>{{ spot.position.x }} %, {{ spot.position.y }} %</td>
          <td>
            <button type="button" @click="edit(spot)">Modifier</button>
            <button type="button" @click="remove(spot)">Supprimer</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else>Aucune photo.</p>

    <div class="actions">
      <button
        type="button"
        :disabled="pagination.page <= 1"
        @click="loadSpots(pagination.page - 1)"
      >
        Précédent
      </button>
      <span>Page {{ pagination.page }} / {{ pageCount }} ({{ pagination.total }} photos)</span>
      <button
        type="button"
        :disabled="pagination.page >= pageCount"
        @click="loadSpots(pagination.page + 1)"
      >
        Suivant
      </button>
    </div>
  </section>

  <section>
    <h3>{{ editingId ? 'Modifier la photo' : 'Nouvelle photo' }}</h3>
    <p v-if="floors.length === 0">Créez d'abord un <a href="#admin-floors">étage</a>.</p>
    <form v-else @submit.prevent="save">
      <label>
        Nom
        <input v-model="form.name" type="text" required maxlength="100" />
      </label>
      <p v-if="errors.name" class="error">{{ errors.name }}</p>

      <ImageUpload label="Photo" @uploaded="onImageUploaded" />
      <img v-if="imageUrl" :src="imageUrl" alt="Photo choisie" class="preview" />
      <p v-if="errors.image" class="error">{{ errors.image }}</p>

      <label>
        Étage
        <select v-model="form.floor" required @change="onFormFloorChange">
          <option value="" disabled>Choisir un étage</option>
          <option v-for="f in floors" :key="f._id" :value="f._id">{{ floorLabel(f) }}</option>
        </select>
      </label>
      <p v-if="errors.floor" class="error">{{ errors.floor }}</p>

      <template v-if="formFloor">
        <p>Cliquez sur le plan à l'endroit où la photo a été prise.</p>
        <PlanPicker v-model="form.position" :src="formFloor.plan.url" />
        <p v-if="form.position">x = {{ form.position.x }} %, y = {{ form.position.y }} %</p>
      </template>
      <p v-if="errors['position.x'] || errors['position.y'] || errors.position" class="error">
        {{ errors.position ?? errors['position.x'] ?? errors['position.y'] }}
      </p>

      <p v-if="error" class="error">{{ error }}</p>
      <div class="actions">
        <button type="submit" :disabled="!form.image || !form.position">
          {{ editingId ? 'Enregistrer' : 'Créer la photo' }}
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
