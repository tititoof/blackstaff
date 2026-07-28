---
type: Recipe
title: Prototype Nuxt — générique
tags: [nuxt, frontend, prototype, design-pattern]
---

# Quand utiliser ce pattern

Dupliquer un objet côté frontend (entité métier chargée depuis l'API,
objet de config UI complexe, état réactif) sans coupler le code au type
concret, et en garantissant l'indépendance entre l'original et le clone.

Exemples concrets :
- [Entité métier (duplication d'une commande)](/patterns/prototype/recipes/frontend/examples/entity-clone.md)
- [Composant UI paramétré (widget dupliqué)](/patterns/prototype/recipes/frontend/examples/component-clone.md)

# Dépendances

- [Conventions Nuxt générales](/frameworks/nuxt.md)
- Chemins selon la version : [v3](/frameworks/nuxt/v3.md) / [v4](/frameworks/nuxt/v4.md)

# Structure des fichiers

```
app/models/{prototype}.ts           ← classe modèle + clone()
app/composables/use{Prototype}.ts   ← façade réactive
```

# Interface Prototype

```ts
// app/models/types.ts
export interface Cloneable<T> {
  clone(): T
}
```

# Prototype concret

```ts
// app/models/{prototype}.ts
import type { Cloneable } from './types'

export class {Prototype} implements Cloneable<{Prototype}> {
  constructor(
    public id: number | null,
    public title: string,
    public items: {Child}[],        // relation imbriquée
    public metadata: Record<string, unknown>,  // objet mutable
    // autres attributs...
  ) {}

  // Crée une copie profonde indépendante de l'instance courante.
  clone(): {Prototype} {
    return new {Prototype}(
      null,                          // ← id null = nouvelle entité côté backend
      this.title,
      this.items.map(item => item.clone()),  // clonage récursif des enfants
      { ...this.metadata },          // spread = copie du niveau 1
                                     // (structuredClone si imbrication profonde)
    )
  }

  // Fabrique statique depuis un objet JSON brut (réponse API).
  static fromApi(data: Record<string, unknown>): {Prototype} {
    return new {Prototype}(
      data.id as number,
      data.title as string,
      (data.items as unknown[]).map({Child}.fromApi),
      data.metadata as Record<string, unknown>,
    )
  }

  // Sérialise vers l'API (exclut l'id si null = création).
  toApiPayload(): Record<string, unknown> {
    return {
      ...(this.id !== null && { id: this.id }),
      title: this.title,
      items: this.items.map(i => i.toApiPayload()),
      metadata: this.metadata,
    }
  }
}
```

# Enfant clonable (à dupliquer pour chaque relation imbriquée)

```ts
// app/models/{child}.ts
export class {Child} implements Cloneable<{Child}> {
  constructor(
    public id: number | null,
    public label: string,
    // autres attributs...
  ) {}

  clone(): {Child} {
    return new {Child}(null, this.label)
  }

  static fromApi(data: unknown): {Child} {
    const d = data as Record<string, unknown>
    return new {Child}(d.id as number, d.label as string)
  }

  toApiPayload(): Record<string, unknown> {
    return { ...(this.id !== null && { id: this.id }), label: this.label }
  }
}
```

# Composable façade

```ts
// composables/use{Prototype}.ts
import { {Prototype} } from '~~/models/{prototype}'

export function use{Prototype}() {
  const items    = ref<{Prototype}[]>([])
  const loading  = ref(false)
  const error    = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    try {
      const data = await $fetch<unknown[]>('/api/{prototype}s')
      items.value = data.map({Prototype}.fromApi)
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function duplicate(original: {Prototype}) {
    // 1. Cloner côté frontend (copie profonde, indépendante de l'original)
    const clone = original.clone()

    // 2. Envoyer le clone au backend pour persistance
    loading.value = true
    try {
      const saved = await $fetch<unknown>('/api/{prototype}s', {
        method: 'POST',
        body: clone.toApiPayload(),
      })
      const savedInstance = {Prototype}.fromApi(saved as Record<string, unknown>)
      items.value.push(savedInstance)
      return savedInstance
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return { items, loading, error, fetchAll, duplicate }
}
```

# Utilisation dans un composant

```vue
<script setup lang="ts">
const { items, loading, duplicate, fetchAll } = use{Prototype}()
onMounted(() => fetchAll())

async function handleDuplicate(item: {Prototype}) {
  await duplicate(item)
  // item original non modifié — clone sauvegardé et ajouté à la liste
}
</script>

<template>
  <div v-for="item in items" :key="item.id">
    {{ item.title }}
    <button :disabled="loading" @click="handleDuplicate(item)">
      Dupliquer
    </button>
  </div>
</template>
```

# Copie profonde : quand utiliser `structuredClone`

```ts
// Pour les objets imbriqués simples (sans méthodes) :
metadata: structuredClone(this.metadata)  // copie profonde native navigateur

// Pour les objets avec méthodes (classes TypeScript) :
// structuredClone ne peut pas cloner les méthodes → toujours utiliser clone()
items: this.items.map(item => item.clone())
```

# Règles à respecter

- L'`id` du clone est toujours `null` — le backend assignera un nouvel id
  lors de la persistance.
- Toujours utiliser `clone()` récursif sur les enfants — un simple
  `[...this.items]` copie les références, pas les objets (shallow copy).
- `structuredClone` pour les objets JSON purs (sans méthodes),
  `clone()` explicite pour les classes TypeScript.
- Ne jamais muter l'original après avoir appelé `clone()` — l'indépendance
  est la garantie centrale du pattern.