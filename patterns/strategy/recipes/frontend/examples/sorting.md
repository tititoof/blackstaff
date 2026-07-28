---
type: Example
title: Strategy Nuxt — exemple Tri de liste
tags: [nuxt, frontend, strategy, sorting]
---

# Application du pattern sur un tri de liste côté frontend

Critère de tri interchangeable sur une liste de produits, sans modifier
le composant qui affiche la liste.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Domain}` | `ProductSort` |
| `{Strategy}` | `SortStrategy` |
| Méthode | `execute(items)` → `items[]` triés |

# Implémentation — fonctions pures (sans classe, car sans état)

```ts
// app/strategies/productSorts/types.ts
export type SortCriteria = 'price_asc' | 'price_desc' | 'name' | 'newest'

export interface Product {
  id: number
  name: string
  price: number
  createdAt: string
  ordersCount: number
}

export type SortStrategyFn = (items: Product[]) => Product[]

// app/strategies/productSorts/productSortStrategies.ts
export const priceAscSort: SortStrategyFn = (items) =>
  [...items].sort((a, b) => a.price - b.price)

export const priceDescSort: SortStrategyFn = (items) =>
  [...items].sort((a, b) => b.price - a.price)

export const nameSort: SortStrategyFn = (items) =>
  [...items].sort((a, b) => a.name.localeCompare(b.name, 'fr'))

export const newestSort: SortStrategyFn = (items) =>
  [...items].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

const SORT_STRATEGIES: Record<SortCriteria, SortStrategyFn> = {
  price_asc:  priceAscSort,
  price_desc: priceDescSort,
  name:       nameSort,
  newest:     newestSort,
}

export function resolveSortStrategy(criteria: SortCriteria): SortStrategyFn {
  return SORT_STRATEGIES[criteria] ?? newestSort
}
```

# Composable contexte

```ts
// app/composables/useProductList.ts
import { resolveSortStrategy } from '~~/strategies/productSorts/productSortStrategies'
import type { Product, SortCriteria } from '~~/strategies/productSorts/types'

export function useProductList() {
  const rawItems  = ref<Product[]>([])
  const sortBy    = ref<SortCriteria>('newest')
  const loading   = ref(false)

  // Les items triés sont recalculés automatiquement quand sortBy change
  const sortedItems = computed(() => {
    const strategy = resolveSortStrategy(sortBy.value)
    return strategy(rawItems.value)
  })

  async function fetchProducts() {
    loading.value = true
    try {
      const data = await $fetch<Product[]>('/api/products')
      rawItems.value = data
    } finally {
      loading.value = false
    }
  }

  function setSortCriteria(criteria: SortCriteria) {
    sortBy.value = criteria  // déclenche la mise à jour de sortedItems
  }

  return { sortedItems, sortBy, loading, fetchProducts, setSortCriteria }
}
```

# Utilisation dans un composant

```vue
<!-- app/pages/products/index.vue -->
<script setup lang="ts">
const { sortedItems, sortBy, loading, fetchProducts, setSortCriteria } = useProductList()
onMounted(() => fetchProducts())
</script>

<template>
  <div>
    <v-select
      v-model="sortBy"
      :items="[
        { title: 'Plus récents',   value: 'newest' },
        { title: 'Prix croissant', value: 'price_asc' },
        { title: 'Prix décroissant', value: 'price_desc' },
        { title: 'Nom A-Z',        value: 'name' },
      ]"
      label="Trier par"
      @update:model-value="setSortCriteria"
    />

    <v-list :loading="loading">
      <v-list-item
        v-for="product in sortedItems"
        :key="product.id"
        :title="product.name"
        :subtitle="`${product.price} €`"
      />
    </v-list>
  </div>
</template>
```

# Avantage du tri côté client vs API

Ce tri se fait sur les items déjà chargés — pas de nouvel appel API à chaque
changement de critère. La stratégie de tri est interchangeable sans toucher
au composant ni au composable. Ajouter un nouveau critère (ex: `popularity`)
= une nouvelle fonction dans `productSortStrategies.ts` et une entrée dans
`SORT_STRATEGIES`, rien d'autre.