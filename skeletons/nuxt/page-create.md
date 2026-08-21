```vue
<script setup lang="ts">
const { create, loading, error } = use__RESOURCE__s();
const valid = ref(false);
const form = ref({
  // un champ par entrée de contract.fields — ne jamais inventer un champ
  // absent du contrat, ni en omettre un présent
});

async function onSubmit() {
  if (!valid.value) return;
  await create(form.value);
  await navigateTo('/__RESOURCE_PLURAL__');
}
</script>

<template>
  <v-container>
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error.message ?? 'Une erreur est survenue.' }}
    </v-alert>

    <v-form v-model="valid" @submit.prevent="onSubmit">
      <!-- un v-text-field / v-select / etc. par champ du contrat -->

      <v-btn type="submit" color="primary" :disabled="!valid" :loading="loading">
        Créer
      </v-btn>
    </v-form>
  </v-container>
</template>
```

⚠️ Remplace `__RESOURCE__`/`__RESOURCE_PLURAL__`. Les champs du formulaire
viennent EXACTEMENT de `contract.fields` — pas un de plus, pas un de moins.
Le bouton de soumission reste désactivé tant que `valid` est faux, jamais
de soumission sans validation. La navigation après succès se fait dans la
page (`navigateTo`), jamais dans le composable.
