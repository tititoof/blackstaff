# Pattern — Mémento (Memento)
# Catégorie : Patron comportemental
# Permet de sauvegarder et de rétablir l'état précédent d’un objet sans révéler les détails de son implémentation.
# Référence : [refactoring.guru/fr/design-patterns/memento](https://refactoring.guru/fr/design-patterns/memento)

---

## Quand l'utiliser dans ce projet

- Annulation/répétition d'actions dans un éditeur (ex: éditeur de texte, configurateur)
- Sauvegarde de l'état d'un formulaire pour restauration ultérieure
- Historique des états d'un composant (ex: filtres, paramètres de recherche)

---

## Template TypeScript — Nuxt 3

### utils/mementos/FilterMemento.ts

```typescript
// utils/mementos/FilterMemento.ts
// Memento — sauvegarde/restauration de l'état des filtres

export interface FilterState {
  search: string
  status: string[]
  dateRange: [Date | null, Date | null]
}

export class FilterMemento {
  private states: FilterState[] = []
  private currentIndex = -1

  save(state: FilterState): void {
    // On supprime les états futurs si on revient en arrière
    this.states = this.states.slice(0, this.currentIndex + 1)
    this.states.push({ ...state })
    this.currentIndex++
  }

  undo(): FilterState | null {
    if (this.currentIndex <= 0) {
      return null
    }
    this.currentIndex--
    return { ...this.states[this.currentIndex] }
  }

  redo(): FilterState | null {
    if (this.currentIndex >= this.states.length - 1) {
      return null
    }
    this.currentIndex++
    return { ...this.states[this.currentIndex] }
  }

  getCurrent(): FilterState | null {
    if (this.currentIndex === -1) {
      return null
    }
    return { ...this.states[this.currentIndex] }
  }
}
```

### Exemple d'utilisation dans un composable

```typescript
// composables/useFilterHistory.ts
import { FilterMemento } from '~/utils/mementos/FilterMemento'
import type { FilterState } from '~/utils/mementos/FilterMemento'

export const useFilterHistory = () => {
  const memento = new FilterMemento()
  const filters = reactive<FilterState>({
    search: '',
    status: [],
    dateRange: [null, null]
  })

  const saveState = () => {
    memento.save({ ...filters })
  }

  const undo = () => {
    const state = memento.undo()
    if (state) {
      Object.assign(filters, state)
    }
  }

  const redo = () => {
    const state = memento.redo()
    if (state) {
      Object.assign(filters, state)
    }
  }

  return { filters, saveState, undo, redo }
}
```

### Exemple d'utilisation dans une page

```typescript
// pages/articles/index.vue
<script setup lang="ts">
const { filters, saveState, undo, redo } = useFilterHistory()

// Sauvegarde à chaque changement
watch(filters, () => {
  saveState()
}, { deep: true })
</script>

<template>
  <div>
    <input v-model="filters.search" placeholder="Rechercher..." />
    <!-- Autres champs de filtre -->
    <button @click="undo">Annuler</button>
    <button @click="redo">Rétablir</button>
  </div>
</template>
```

---

## Règles d'utilisation

- Le memento ne modifie jamais l'objet original, il sauvegarde des copies
- Les méthodes `undo()`/`redo()` retournent `null` si impossible
- L'état est sauvegardé **avant** toute modification
- Le memento ne connaît pas la structure de l'objet, seulement son état