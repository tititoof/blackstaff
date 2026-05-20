# Pattern — Fabrique Abstraite (Abstract Factory)
# Catégorie : Patron de création
# Permet de créer des familles d'objets apparentés sans préciser leur classe concrète.
# Référence : https://refactoring.guru/fr/design-patterns/abstract-factory

---

## Quand l'utiliser dans ce projet

- Créer des familles de composants UI selon le thème (light/dark)
- Créer des familles de validators selon le contexte (création/édition)
- Créer des familles de formatters selon la locale (fr/en)
- Créer des familles de services selon l'environnement (dev/prod)

---

## Template TypeScript — Nuxt 3

### utils/factories/uiFactory.ts

```typescript
// utils/factories/uiFactory.ts
// Abstract Factory — familles de configuration UI selon le thème

export interface ButtonConfig {
  color: string
  variant: 'flat' | 'outlined' | 'text'
  size: 'small' | 'default' | 'large'
}

export interface CardConfig {
  elevation: number
  rounded: string
  color: string
}

export interface InputConfig {
  variant: 'outlined' | 'filled' | 'underlined'
  color: string
  bgColor: string
}

// Interface de la fabrique abstraite
export interface UIFactory {
  createButtonConfig(intent: 'primary' | 'danger' | 'neutral'): ButtonConfig
  createCardConfig(): CardConfig
  createInputConfig(): InputConfig
}

// Fabrique concrète — thème clair
class LightUIFactory implements UIFactory {
  createButtonConfig(intent: 'primary' | 'danger' | 'neutral'): ButtonConfig {
    const colors = { primary: 'primary', danger: 'error', neutral: 'grey' }
    return { color: colors[intent], variant: 'flat', size: 'default' }
  }

  createCardConfig(): CardConfig {
    return { elevation: 2, rounded: 'lg', color: 'white' }
  }

  createInputConfig(): InputConfig {
    return { variant: 'outlined', color: 'primary', bgColor: 'white' }
  }
}

// Fabrique concrète — thème sombre
class DarkUIFactory implements UIFactory {
  createButtonConfig(intent: 'primary' | 'danger' | 'neutral'): ButtonConfig {
    const colors = { primary: 'primary-lighten-1', danger: 'error-lighten-1', neutral: 'grey-darken-1' }
    return { color: colors[intent], variant: 'outlined', size: 'default' }
  }

  createCardConfig(): CardConfig {
    return { elevation: 4, rounded: 'lg', color: 'grey-darken-3' }
  }

  createInputConfig(): InputConfig {
    return { variant: 'filled', color: 'primary-lighten-1', bgColor: 'grey-darken-4' }
  }
}

// Sélection de la fabrique selon le thème
export const createUIFactory = (theme: 'light' | 'dark'): UIFactory => {
  return theme === 'dark' ? new DarkUIFactory() : new LightUIFactory()
}
```

### composables/useUIFactory.ts

```typescript
// composables/useUIFactory.ts
// Expose la fabrique UI selon le thème actuel de l'application
import { createUIFactory, type UIFactory } from '~/utils/factories/uiFactory'

export const useUIFactory = (): UIFactory => {
  const { global } = useTheme()
  const theme = computed(() => global.current.value.dark ? 'dark' : 'light')
  return createUIFactory(theme.value)
}
```

### Exemple d'utilisation dans un composant

```vue
<!-- components/common/ActionButton.vue -->
<script setup lang="ts">
interface Props {
  intent: 'primary' | 'danger' | 'neutral'
  label: string
  loading?: boolean
}

interface Emits {
  (e: 'click'): void
}

const props = withDefaults(defineProps<Props>(), { loading: false })
const emit  = defineEmits<Emits>()

// La fabrique choisit la bonne config selon le thème actif
const factory = useUIFactory()
const config  = computed(() => factory.createButtonConfig(props.intent))
</script>

<template>
  <v-btn
    :color="config.color"
    :variant="config.variant"
    :size="config.size"
    :loading="props.loading"
    @click="emit('click')"
  >
    {{ props.label }}
  </v-btn>
</template>
```

---

## Règles d'utilisation

- Une fabrique abstraite par famille de produits apparentés
- Les fabriques concrètes implémentent TOUTES les méthodes de l'interface abstraite
- Le code client ne connaît que l'interface — jamais les classes concrètes
- La sélection de la fabrique se fait une seule fois dans le composable
- Jamais de `if (theme === 'dark')` éparpillés dans les composants