<script setup>
// Notice for screens whose API does not exist yet.
defineProps({
  needs: { type: String, required: true },
})
</script>

<template>
  <p class="coming-soon">
    Écran de base, en attente de l'API :
    <strong>{{ needs }}</strong>
  </p>
</template>

<style scoped>
.coming-soon {
  padding: 0.75rem;
  border-left: 4px solid orange;
  background: #fff6e5;
}
</style>
