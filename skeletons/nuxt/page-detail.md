```vue
<script setup lang="ts">
// Récupère l'identifiant via useRoute() — ne recompose jamais l'URL
// d'API manuellement, c'est le rôle du composable.
const route = useRoute();
const { item, loading, error, fetchOne } = use__RESOURCE__s();
await fetchOne(route.params.id);
</script>

<template>
  <v-container>
    <v-progress-circular v-if="loading" indeterminate color="primary" />

    <v-alert v-else-if="error" type="error" variant="tonal">
      {{ error.message ?? 'Une erreur est survenue.' }}
    </v-alert>

    <v-card v-else-if="item">
      <!-- affichage des champs réels de item, à adapter au contrat -->
    </v-card>

    <v-alert v-else type="warning" variant="tonal">Élément introuvable.</v-alert>
  </v-container>
</template>
```

⚠️ Remplace `__RESOURCE__` par le nom réel de la ressource. Garde les 4
branches (chargement/erreur/trouvé/introuvable) — un item absent après
chargement n'est pas la même chose qu'une erreur réseau, ne pas les fondre
dans la même branche `v-else`.
