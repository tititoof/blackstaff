---
type: Example
title: Builder Nuxt — exemple Requête de filtre complexe
tags: [nuxt, frontend, builder, query, filter]
---

# Application du pattern sur une requête de filtre

Construit le payload d'une requête de recherche/filtre complexe envoyée
à l'API backend — avec filtres, tri, pagination et champs à inclure.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Domain}` | `Search` |
| `{Product}` | `SearchPayload` |
| `{Builder}Interface` | `SearchPayloadBuilderInterface` |
| `{ConcreteA}{Builder}` | `RestSearchPayloadBuilder` |
| `{ConcreteB}{Builder}` | `GraphqlSearchPayloadBuilder` |
| `{Director}` | `SearchPayloadDirector` |
| `stepA` | `addFilters(filters)` |
| `stepB` | `addSort(field, direction)` |
| `stepC` | `addPagination(page, perPage)` |
| `stepD` | `addFields(fields)` |

# Structure concrète des fichiers

```
app/builders/searches/
├── types.ts
│     SearchFilter = { field: string; operator: '=' | '>' | '<' | 'like'; value: unknown }
│     SearchPayload = { filters, sort?, pagination, fields? }
├── RestSearchPayloadBuilder.ts
│     # Construit un objet query params pour une API REST
│     addFilters(filters) → this.payload.filters = filters.map(...)
│     addSort(field, dir) → this.payload.sort = `${field}:${dir}`
│     addPagination(page, perPage) → this.payload.page = page; ...
│     addFields(fields)  → this.payload.fields = fields.join(',')
│     getResult(): Record<string, string>  ← query params sérialisables
├── GraphqlSearchPayloadBuilder.ts
│     # Construit des variables GraphQL
│     addFilters → this.payload.where = buildWhereClause(filters)
│     addSort    → this.payload.orderBy = [{ field, direction }]
│     addPagination → this.payload.skip / take
│     addFields  → this.payload.select = fields
│     getResult(): Record<string, unknown>  ← variables GraphQL
└── SearchPayloadDirector.ts
      buildStandardSearch(builder, { filters, sortField = 'created_at' }):
        builder.reset()
               .addFilters(filters)
               .addSort(sortField, 'desc')
               .addPagination(1, 25)

      buildAdvancedSearch(builder, { filters, page, fields, perPage = 50 }):
        builder.reset()
               .addFilters(filters)
               .addSort('relevance', 'desc')
               .addPagination(page, perPage)
               .addFields(fields)
```

# Composable

```ts
// composables/useSearchPayload.ts
import { RestSearchPayloadBuilder } from '~~/builders/searches/RestSearchPayloadBuilder'
import { SearchPayloadDirector } from '~~/builders/searches/SearchPayloadDirector'
import type { SearchFilter } from '~~/builders/searches/types'

export function useSearchPayload() {
  const loading = ref(false)
  const results = ref<unknown[]>([])
  const total   = ref(0)

  const builder  = new RestSearchPayloadBuilder()
  const director = new SearchPayloadDirector()

  async function search(filters: SearchFilter[], page = 1) {
    loading.value = true
    director.buildStandardSearch(builder, { filters })
    const payload = builder.getResult()

    try {
      const data = await $fetch<{ items: unknown[]; total: number }>(
        '/api/search',
        { params: payload }
      )
      results.value = data.items
      total.value   = data.total
    } finally {
      loading.value = false
    }
  }

  async function advancedSearch(
    filters: SearchFilter[],
    page: number,
    fields: string[]
  ) {
    loading.value = true
    director.buildAdvancedSearch(builder, { filters, page, fields })
    const payload = builder.getResult()

    try {
      const data = await $fetch<{ items: unknown[]; total: number }>(
        '/api/search/advanced',
        { params: payload }
      )
      results.value = data.items
      total.value   = data.total
    } finally {
      loading.value = false
    }
  }

  return { loading, results, total, search, advancedSearch }
}
```

# Utilisation dans une page de recherche

```vue
<!-- pages/products/index.vue -->
<script setup lang="ts">
const { loading, results, total, search } = useSearchPayload()

const filters = reactive({
  category: '',
  priceMin: 0,
  priceMax: 0,
  inStock: true,
})

async function handleSearch() {
  await search([
    { field: 'category', operator: '=',  value: filters.category },
    { field: 'price',    operator: '>',  value: filters.priceMin },
    { field: 'price',    operator: '<',  value: filters.priceMax },
    { field: 'in_stock', operator: '=',  value: filters.inStock },
  ])
}
</script>

<template>
  <v-container>
    <!-- Filtres -->
    <v-btn :loading="loading" @click="handleSearch">Rechercher</v-btn>
    <!-- Résultats -->
    <p>{{ total }} résultats</p>
    <v-list>
      <v-list-item v-for="item in results" :key="item.id">
        {{ item.name }}
      </v-list-item>
    </v-list>
  </v-container>
</template>
```

# Pourquoi Builder ici (cas objet configurable)

Sans Builder, chaque composant de recherche recomposerait son propre
objet `params` — avec des champs manquants, des conventions de nommage
incohérentes entre pages, et aucune réutilisation des recettes communes.
Le Director centralise les recettes (`standard`, `advanced`) et le Builder
isole la traduction vers le format de l'API (REST ou GraphQL).