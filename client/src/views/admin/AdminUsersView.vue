<script setup>
import ComingSoon from '@/components/ComingSoon.vue'
</script>

<template>
  <h2>Utilisateurs</h2>
  <ComingSoon
    needs="la gestion des utilisateurs (GET /users, PATCH /users/:id { role }, DELETE /users/:id)"
  />
  <p>
    En attendant, le rôle se change avec
    <code>npm run set-role -- &lt;username&gt; &lt;role&gt;</code> dans <code>api/</code>.
  </p>
  <nav class="actions">
    <a href="#admin">Retour à l'administration</a>
  </nav>
</template>
