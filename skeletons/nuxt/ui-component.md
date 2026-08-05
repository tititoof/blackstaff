# Squelette : composant UI générique (Nuxt)

```vue
<script setup lang="ts">
interface Props {
  // props purement de présentation (variant, size, disabled, loading...)
}
const props = withDefaults(defineProps<Props>(), {
  // valeurs par défaut
})

const emit = defineEmits<{
  // événements génériques : 'click', 'update:modelValue'...
}>()
</script>

<template>
  <div>
    <!-- markup générique -->
    <slot />
  </div>
</template>
```

Règles ABSOLUES pour un composant `components/ui/` :
- AUCUN appel API, AUCUN import de composable métier (`useAuthApi`, `useXxxStore`, etc.)
- AUCUNE connaissance du domaine métier (pas de référence à "login", "user", "task"...)
- Ne communique qu'via `props` (entrée) et `emit` (sortie) — jamais d'état global
- Doit être réutilisable tel quel dans n'importe quel projet Nuxt, peu importe le domaine
- Utilise `<slot />` quand un contenu variable doit être injecté par le parent
