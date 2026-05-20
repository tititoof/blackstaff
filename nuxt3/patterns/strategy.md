# Pattern — Stratégie (Strategy)
# Catégorie : Patron comportemental
# Définit une famille d’algorithmes, les met dans des classes séparées et rend leurs objets interchangeables.
# Référence : [refactoring.guru/fr/design-patterns/strategy](https://refactoring.guru/fr/design-patterns/strategy)

---

## Quand l'utiliser dans ce projet

- Changement d'algorithme à l'exécution (ex: tri, filtrage, validation)
- Support de plusieurs stratégies pour une même tâche (ex: authentification)
- Éviter les conditions complexes avec des `if/else` ou `switch`

---

## Template TypeScript — Nuxt 3

### utils/strategies/SortStrategy.ts

```typescript
// utils/strategies/SortStrategy.ts
// Strategy — stratégies de tri

export interface SortStrategy<T> {
  sort(items: T[]): T[]
}

export class SortByDateStrategy<T extends { created_at: string }> implements SortStrategy<T> {
  sort(items: T[]): T[] {
    return [...items].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }
}

export class SortByTitleStrategy<T extends { title: string }> implements SortStrategy<T> {
  sort(items: T[]): T[] {
    return [...items].sort((a, b) => a.title.localeCompare(b.title))
  }
}

export class Sorter<T> {
  private strategy: SortStrategy<T>

  constructor(strategy: SortStrategy<T>) {
    this.strategy = strategy
  }

  setStrategy(strategy: SortStrategy<T>): void {
    this.strategy = strategy
  }

  sort(items: T[]): T[] {
    return this.strategy.sort(items)
  }
}
```

### Exemple d'utilisation dans un composable

```typescript
// composables/useArticleSorter.ts
import { Sorter, SortByDateStrategy, SortByTitleStrategy } from '~/utils/strategies/SortStrategy'
import type { Article } from '~/types/Article'

export const useArticleSorter = () => {
  const sorter = new Sorter<Article>(new SortByDateStrategy())

  const sortByDate = () => {
    sorter.setStrategy(new SortByDateStrategy())
  }

  const sortByTitle = () => {
    sorter.setStrategy(new SortByTitleStrategy())
  }

  const sort = (articles: Article[]) => {
    return sorter.sort(articles)
  }

  return { sort, sortByDate, sortByTitle }
}
```

### Exemple d'utilisation dans une page

```typescript
// pages/articles/index.vue
<script setup lang="ts">
const { sort, sortByDate, sortByTitle } = useArticleSorter()
const articles = ref<Article[]>([])

const sortedArticles = computed(() => sort(articles.value))
</script>

<template>
  <div>
    <button @click="sortByDate">Trier par date</button>
    <button @click="sortByTitle">Trier par titre</button>
    <div v-for="article in sortedArticles" :key="article.id">
      {{ article.title }}
    </div>
  </div>
</template>
```

---

## Règles d'utilisation

- Chaque stratégie implémente la même interface (`SortStrategy`)
- Le contexte (`Sorter`) ne connaît pas les détails des stratégies
- Les stratégies sont interchangeables à l'exécution
- Toujours clôner les données avant modification (ex: `[...items]`)