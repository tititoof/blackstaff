# Squelette : composant Vue (Nuxt)

```vue
<script setup lang="ts">
// props (interface dédiée si plus de 2-3 props)
interface Props {
  // ...
}
const props = defineProps<Props>()

// emits
const emit = defineEmits<{
  // 'nomEvent': [payload: Type]
}>()

// state / computed / méthodes
</script>

<template>
  <div>
    <!-- contenu -->
  </div>
</template>
```

Règles :
- `defineProps<Props>()` typé, jamais `defineProps(['prop1', 'prop2'])` sans types
- `defineEmits` typé si le composant émet des événements
- Un composant UI générique (`components/ui/`) ne connaît RIEN du métier — pas d'appel API, pas de logique auth/CRUD spécifique
- Un composant spécifique à une feature (`components/{feature}/`) peut utiliser les composables de cette feature
