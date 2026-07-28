---
type: Recipe
title: Builder Nuxt — générique
tags: [nuxt, frontend, builder, design-pattern]
---

# Quand utiliser ce pattern

Un objet complexe côté frontend construit étape par étape : formulaire
multi-étapes, requête de filtre, configuration d'export, payload d'API
composé de nombreuses options.

Exemples concrets :
- [Formulaire multi-étapes (composite)](/patterns/builder/recipes/frontend/examples/form-builder.md)
- [Requête de filtre complexe](/patterns/builder/recipes/frontend/examples/query-builder.md)

# Dépendances

- [Conventions Nuxt générales](/frameworks/nuxt.md)
- Chemins selon la version : [v3](/frameworks/nuxt/v3.md) / [v4](/frameworks/nuxt/v4.md)

# Structure des fichiers

```
app/builders/{domain}s/           ← (v4) ou builders/{domain}s/ (v3)
├── types.ts                      ← interfaces Builder + types produits
├── {ConcreteA}{Builder}.ts       ← ConcreteBuilder A
├── {ConcreteB}{Builder}.ts       ← ConcreteBuilder B
└── {Director}.ts                 ← Director
app/composables/
└── use{Domain}Builder.ts         ← façade réactive pour les composants
```

# Interface Builder + types

```ts
// builders/{domain}s/types.ts
export interface {Product} {
  // Structure du produit fini — à définir selon la spec
  partA?: unknown
  partB?: unknown
  partC?: unknown
}

export interface {Builder}Interface {
  reset(): this
  stepA(opts?: Record<string, unknown>): this
  stepB(opts?: Record<string, unknown>): this
  stepC(opts?: Record<string, unknown>): this
  // getResult() délibérément absent de l'interface
}
```

# ConcreteBuilder (à dupliquer par représentation)

```ts
// builders/{domain}s/{ConcreteA}{Builder}.ts
import type { {Builder}Interface, {Product} } from './types'

export class {ConcreteA}{Builder} implements {Builder}Interface {
  private product: {Product} = {}

  constructor() {
    this.reset()
  }

  reset(): this {
    this.product = {}   // objet vide à reconstruire
    return this
  }

  stepA(opts: Record<string, unknown> = {}): this {
    this.product.partA = this.buildPartA(opts)
    return this
  }

  stepB(opts: Record<string, unknown> = {}): this {
    this.product.partB = this.buildPartB(opts)
    return this
  }

  stepC(opts: Record<string, unknown> = {}): this {
    this.product.partC = this.buildPartC(opts)
    return this
  }

  // Retourne le produit fini et remet le builder à zéro.
  getResult(): {Product} {
    const product = { ...this.product }
    this.reset()
    return product
  }

  private buildPartA(opts: Record<string, unknown>): unknown {
    // Logique de construction spécifique à {ConcreteA}
  }

  private buildPartB(opts: Record<string, unknown>): unknown { ... }
  private buildPartC(opts: Record<string, unknown>): unknown { ... }
}
```

# Director

```ts
// builders/{domain}s/{Director}.ts
import type { {Builder}Interface } from './types'

export class {Director} {
  private builder: {Builder}Interface

  constructor(builder: {Builder}Interface) {
    this.builder = builder
  }

  setBuilder(builder: {Builder}Interface): void {
    this.builder = builder
  }

  // Recette minimale.
  buildMinimal(opts: Record<string, unknown> = {}): void {
    this.builder.reset().stepA(opts)
  }

  // Recette complète.
  buildFull(opts: Record<string, unknown> = {}): void {
    this.builder
      .reset()
      .stepA(opts)
      .stepB(opts)
      .stepC(opts)
  }

  // Recette métier spécifique — ajouter les configurations réutilisables.
  buildCustom(opts: Record<string, unknown> = {}): void {
    this.builder
      .reset()
      .stepA(opts)
      .stepC(opts)
  }
}
```

# Composable façade (point d'entrée pour les composants)

```ts
// composables/use{Domain}Builder.ts
import { {ConcreteA}{Builder} } from '~~/builders/{domain}s/{ConcreteA}{Builder}'
import { {Director} } from '~~/builders/{domain}s/{Director}'
import type { {Product} } from '~~/builders/{domain}s/types'

export function use{Domain}Builder() {
  const builder = new {ConcreteA}{Builder}()
  const director = new {Director}(builder)

  const result = ref<{Product} | null>(null)
  const building = ref(false)

  function buildFull(opts: Record<string, unknown>) {
    building.value = true
    director.buildFull(opts)
    result.value = builder.getResult()
    building.value = false
  }

  function buildMinimal(opts: Record<string, unknown>) {
    director.buildMinimal(opts)
    result.value = builder.getResult()
  }

  // Construction manuelle étape par étape (sans Director)
  function buildManual() {
    return {
      stepA: (opts = {}) => { builder.stepA(opts); return manual },
      stepB: (opts = {}) => { builder.stepB(opts); return manual },
      stepC: (opts = {}) => { builder.stepC(opts); return manual },
      build: () => {
        result.value = builder.getResult()
        return result.value
      },
    }
    var manual = buildManual()
  }

  return { result, building, buildFull, buildMinimal, buildManual }
}
```

# Utilisation dans un composant

```vue
<script setup lang="ts">
const { result, building, buildFull, buildManual } = use{Domain}Builder()

// Construction via Director (recette réutilisable)
function handleFullBuild() {
  buildFull({ paramA: 'valeur', paramB: 42, paramC: true })
  // result.value contient le produit fini
}

// Construction manuelle étape par étape
function handleCustomBuild() {
  const builder = buildManual()
  builder
    .stepA({ paramA: 'valeur' })
    .stepC({ paramC: true })
    .build()
}
</script>

<template>
  <div>
    <button :disabled="building" @click="handleFullBuild">
      Construire (complet)
    </button>
    <pre v-if="result">{{ JSON.stringify(result, null, 2) }}</pre>
  </div>
</template>
```

# Pattern générique ({Domain})

Remplacer `{Domain}` par le domaine réel du projet :
- `Form` → construction d'un formulaire multi-étapes
- `Query` → construction d'une requête de filtre
- `Export` → construction d'un payload d'export paramétré
- `Report` → construction d'un rapport à afficher

# Règles à respecter

- `reset()` retourne `this` pour le chaînage — appelé dans `getResult()`
  pour éviter la réutilisation accidentelle du produit précédent.
- `getResult()` hors de l'interface — les produits peuvent avoir des
  types incompatibles entre ConcreteBuilders.
- Le Director ne connaît que `{Builder}Interface` — jamais les
  ConcreteBuilders ni les types de produits concrets.
- En Nuxt SSR, instancier les Builders dans le composable (côté client)
  plutôt que dans un plugin serveur — les Builders contiennent souvent
  un état mutable non sérialisable.