```vue
<script setup lang="ts">
// Ne jamais appeler $fetch/useFetch directement dans cette page — tout
// passe par le composable use__RESOURCE__s(). __API_BASE_URL__ n'apparaît
// JAMAIS dans ce fichier, uniquement dans le composable.
const { items, loading, error, fetchAll } = use__RESOURCE__s();
await fetchAll();
</script>

<template>
  <v-container>
    <v-row v-if="loading">
      <v-col class="text-center">
        <v-progress-circular indeterminate color="primary" />
      </v-col>
    </v-row>

    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
      {{ error.message ?? 'Une erreur est survenue.' }}
    </v-alert>

    <template v-else>
      <v-row v-if="items.length === 0">
        <v-col class="text-center text-medium-emphasis">
          Aucun élément pour le moment.
          <!-- action de création à ajouter selon le contrat -->
        </v-col>
      </v-row>
      <v-row v-else>
        <!-- v-for="item in items" :key="item.id" -->
        <!-- une v-col par item, structure à adapter aux champs réels -->
      </v-row>
    </template>
  </v-container>
</template>
```

⚠️ Remplace `__RESOURCE__` par le nom réel de la ressource (ex: `Article` →
`useArticles`). Garde les 3 branches `loading`/`error`/données — ne jamais
en omettre une. Les props exactes des composants Vuetify utilisés
(`v-progress-circular`, `v-alert`...) sont à vérifier contre la fiche de
référence si le composant n'apparaît pas déjà correctement ci-dessus.
