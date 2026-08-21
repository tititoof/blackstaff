```vue
<script setup lang="ts">
const route = useRoute();
const { item, update, loading, error, fetchOne } = use__RESOURCE__s();
const valid = ref(false);
const form = ref({});

await fetchOne(route.params.id);
// Pré-remplit le formulaire une fois l'item chargé — ne pas dupliquer
// la logique de champs avec page-create.vue, garder les mêmes noms.
watchEffect(() => {
  if (item.value) form.value = { ...item.value };
});

async function onSubmit() {
  if (!valid.value) return;
  await update(route.params.id, form.value);
  await navigateTo('/__RESOURCE_PLURAL__');
}
</script>

<template>
  <v-container>
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error.message ?? 'Une erreur est survenue.' }}
    </v-alert>

    <v-form v-model="valid" @submit.prevent="onSubmit">
      <!-- mêmes champs que page-create.vue, pré-remplis depuis form -->

      <v-btn type="submit" color="primary" :disabled="!valid" :loading="loading">
        Enregistrer
      </v-btn>
    </v-form>
  </v-container>
</template>
```

⚠️ Remplace `__RESOURCE_PLURAL__`. Utilise `update(id, payload)`, jamais
`create()`. Les champs du formulaire doivent rester identiques à
page-create.vue pour la même ressource — ne pas en ajouter/retirer ici
sans le faire aussi côté création.
