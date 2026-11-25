<script setup>
// File input that uploads the chosen image (admins only) and emits the Upload
// document created by the API.
import { ref } from 'vue'
import { ACCEPTED_IMAGE_TYPES, uploadImage } from '@/api/resources.js'

defineProps({
  label: { type: String, default: 'Image' },
})
const emit = defineEmits(['uploaded'])

const busy = ref(false)
const error = ref('')

async function onChange(event) {
  const file = event.target.files[0]
  if (!file) {
    return
  }
  busy.value = true
  error.value = ''
  try {
    emit('uploaded', await uploadImage(file))
  } catch (err) {
    error.value = err.message
  } finally {
    busy.value = false
    event.target.value = ''
  }
}
</script>

<template>
  <label>
    {{ label }} (jpg, png ou webp, 10 Mo max)
    <input type="file" :accept="ACCEPTED_IMAGE_TYPES" :disabled="busy" @change="onChange" />
  </label>
  <p v-if="busy">Envoi en cours…</p>
  <p v-if="error" class="error">{{ error }}</p>
</template>
