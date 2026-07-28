---
type: Recipe
title: CRUD client Nuxt ({Resource})
tags: [nuxt, frontend, crud]
---

# Quand utiliser ce pattern

Toute resource métier exposant un CRUD complet (liste, détail, création,
édition, suppression) depuis un frontend Nuxt, indépendamment du backend.

# Dépendances

- [Conventions Nuxt générales](/frameworks/nuxt.md)

# Fichiers à générer

Chemins selon la version Nuxt déclarée dans la config projet :
- [Nuxt 3](/frameworks/nuxt/v3.md)
- [Nuxt 4](/frameworks/nuxt/v4.md)

| Fichier | Rôle |
|---|---|
| `composables/use{Resource}s.ts` | Composable liste + opérations CRUD |
| `pages/{resource}s/index.vue` | Page liste |
| `pages/{resource}s/[id].vue` | Page détail |
| `pages/{resource}s/create.vue` | Page création |
| `pages/{resource}s/[id]/edit.vue` | Page édition |
| `types/{resource}.ts` | Interface TypeScript |

# Interface TypeScript

```ts
// types/{resource}.ts
export interface {Resource} {
  id: number
  // attributs métier à compléter selon la spec
  createdAt: string
  updatedAt: string
}

export interface {Resource}Payload {
  // attributs éditables uniquement (sans id, createdAt, updatedAt)
}
```

# Composable

```ts
// composables/use{Resource}s.ts
export function use{Resource}s() {
  const items = ref<{Resource}[]>([])
  const item = ref<{Resource} | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll(page = 1) {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<{ data: {Resource}[]; meta: object }>(
        `/api/{resource}s?page=${page}`
      )
      items.value = data.data
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: number) {
    loading.value = true
    error.value = null
    try {
      item.value = await $fetch<{Resource}>(`/api/{resource}s/${id}`)
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function create(payload: {Resource}Payload) {
    return $fetch<{Resource}>('/api/{resource}s', {
      method: 'POST',
      body: payload,
    })
  }

  async function update(id: number, payload: Partial<{Resource}Payload>) {
    return $fetch<{Resource}>(`/api/{resource}s/${id}`, {
      method: 'PATCH',
      body: payload,
    })
  }

  async function remove(id: number) {
    await $fetch(`/api/{resource}s/${id}`, { method: 'DELETE' })
  }

  return { items, item, loading, error, fetchAll, fetchOne, create, update, remove }
}
```

# Page liste

```vue
<!-- pages/{resource}s/index.vue -->
<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { items, loading, error, fetchAll } = use{Resource}s()
onMounted(() => fetchAll())
</script>

<template>
  <div>
    <NuxtLink to="/{resource}s/create">Créer</NuxtLink>
    <div v-if="loading">Chargement…</div>
    <div v-else-if="error">{{ error }}</div>
    <ul v-else>
      <li v-for="item in items" :key="item.id">
        <NuxtLink :to="`/{resource}s/${item.id}`">{{ item.id }}</NuxtLink>
      </li>
    </ul>
  </div>
</template>
```

# Page création

```vue
<!-- pages/{resource}s/create.vue -->
<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { create } = use{Resource}s()
const form = reactive<{Resource}Payload>({ /* champs selon spec */ })

async function submit() {
  await create(form)
  navigateTo('/{resource}s')
}
</script>
```

# Adaptation selon le backend

| Backend | Format de réponse JSON | Paramètre de pagination |
|---|---|---|
| Rails (jsonapi-serializer) | `{ data: [...] }` | `?page[number]=1` |
| Laravel (API Resources) | `{ data: [...], meta: {...} }` | `?page=1` |
| Symfony (API Platform) | `{ hydra:member: [...] }` ou `{ data: [...] }` | `?page=1` |

Ajuster les clés d'accès au tableau (`data.data` vs `data['hydra:member']`)
dans `fetchAll()` selon le backend réel du projet.

# Pièges à éviter

- Toujours passer par le composable, jamais de `$fetch` brut dans un
  composant — cohérence et testabilité.
- Toujours gérer les trois états `loading`, `error`, `data` dans les
  templates — une liste sans état de chargement donne une mauvaise UX et
  masque les erreurs réseau.
- Ne pas mettre la logique de redirection post-création/édition dans le
  composable — c'est la page qui décide vers où naviguer.