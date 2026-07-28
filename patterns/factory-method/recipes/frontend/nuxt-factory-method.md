---
type: Recipe
title: Factory Method Nuxt — générique
tags: [nuxt, frontend, factory-method, design-pattern]
---

# Quand utiliser ce pattern

Un service frontend avec plusieurs implémentations concrètes, chacune
avec une logique de préparation spécifique autour d'un appel commun,
extensible sans modifier les composants appelants.

Exemples concrets :
- [Paiement](/patterns/factory-method/recipes/frontend/examples/payment.md)
- [Export](/patterns/factory-method/recipes/frontend/examples/export.md)
- [Notification](/patterns/factory-method/recipes/frontend/examples/notification.md)

# Dépendances

- [Conventions Nuxt générales](/frameworks/nuxt.md)
- Chemins selon la version : [v3](/frameworks/nuxt/v3.md) / [v4](/frameworks/nuxt/v4.md)

# Structure des fichiers

```
app/services/{domain}s/          ← (v4) ou services/{domain}s/ (v3)
├── types.ts                     ← interfaces Produit + types union
├── products/
│   ├── Abstract{Product}.ts     ← Produit abstrait (classe abstraite TS)
│   ├── {ConcreteA}{Product}.ts
│   └── {ConcreteB}{Product}.ts
├── creators/
│   ├── Abstract{Creator}.ts     ← Créateur abstrait
│   ├── {ConcreteA}{Creator}.ts
│   └── {ConcreteB}{Creator}.ts
└── {Creator}Resolver.ts         ← Résolveur
app/composables/
└── use{Domain}.ts               ← Façade pour les composants
```

# Types

```ts
// services/{domain}s/types.ts
export type {Domain}Type = '{concrete_a}' | '{concrete_b}'

export interface {Product}Result {
  // Résultat commun retourné par tous les produits
  success: boolean
  data: unknown
}
```

# Produit abstrait

```ts
// services/{domain}s/products/Abstract{Product}.ts
export abstract class Abstract{Product} {
  // Méthode commune à tous les produits — à implémenter dans chaque
  // sous-classe. Le type de retour est l'interface commune.
  abstract perform(args: Record<string, unknown>): Promise<{Product}Result>
}
```

# Produit concret (à dupliquer par implémentation)

```ts
// services/{domain}s/products/{ConcreteA}{Product}.ts
import type { {Product}Result } from '../types'
import { Abstract{Product} } from './Abstract{Product}'

export class {ConcreteA}{Product} extends Abstract{Product} {
  async perform(args: Record<string, unknown>): Promise<{Product}Result> {
    // Appel à l'endpoint backend spécifique à {ConcreteA}
    const data = await $fetch<{Product}Result>('/api/{domain}s/{concrete_a}', {
      method: 'POST',
      body: args,
    })
    return data
  }
}
```

# Créateur abstrait

```ts
// services/{domain}s/creators/Abstract{Creator}.ts
import type { {Product}Result } from '../types'
import type { Abstract{Product} } from '../products/Abstract{Product}'

export abstract class Abstract{Creator} {
  // Méthode fabrique — abstraite, redéfinie dans chaque sous-classe.
  protected abstract create{Product}(): Abstract{Product}

  // Logique métier commune — utilise le Produit via l'interface abstraite.
  async execute(args: Record<string, unknown>): Promise<{Product}Result> {
    const product = this.create{Product}()   // ← méthode fabrique

    this.validate(args)
    const result = await product.perform(args)
    this.afterExecute(result, args)

    return result
  }

  // Validation commune — surcharger dans le Créateur concret
  // pour des règles spécifiques.
  protected validate(args: Record<string, unknown>): void {
    // ex: if (!args.requiredKey) throw new Error('Champ requis manquant')
  }

  // Hook post-exécution — surcharger si nécessaire.
  protected afterExecute(result: {Product}Result, args: Record<string, unknown>): void {
    console.info('[{Domain}] executed', { result, args })
  }
}
```

# Créateur concret (à dupliquer par implémentation)

```ts
// services/{domain}s/creators/{ConcreteA}{Creator}.ts
import { Abstract{Creator} } from './Abstract{Creator}'
import { {ConcreteA}{Product} } from '../products/{ConcreteA}{Product}'
import type { Abstract{Product} } from '../products/Abstract{Product}'

export class {ConcreteA}{Creator} extends Abstract{Creator} {
  // Redéfinit UNIQUEMENT la méthode fabrique.
  protected create{Product}(): Abstract{Product} {
    return new {ConcreteA}{Product}()
  }

  // Surcharger execute() uniquement si cette implémentation
  // a un pré/post-traitement vraiment spécifique.
  // async execute(args) {
  //   return super.execute({ ...args, extra: this.computeExtra() })
  // }
}
```

# Résolveur

```ts
// services/{domain}s/{Creator}Resolver.ts
import type { {Domain}Type } from './types'
import { Abstract{Creator} } from './creators/Abstract{Creator}'
import { {ConcreteA}{Creator} } from './creators/{ConcreteA}{Creator}'
import { {ConcreteB}{Creator} } from './creators/{ConcreteB}{Creator}'

const creators: Record<{Domain}Type, () => Abstract{Creator}> = {
  '{concrete_a}': () => new {ConcreteA}{Creator}(),
  '{concrete_b}': () => new {ConcreteB}{Creator}(),
}

export function resolve{Creator}(type?: {Domain}Type): Abstract{Creator} {
  const config = useRuntimeConfig()
  const resolved = type
    ?? (config.public.{domain}Provider as {Domain}Type)
    ?? '{concrete_a}'

  const factory = creators[resolved]
  if (!factory) throw new Error(`Implémentation inconnue : ${resolved}`)
  return factory()
}
```

# Composable façade (point d'entrée pour les composants)

```ts
// composables/use{Domain}.ts
import { resolve{Creator} } from '~~/services/{domain}s/{Creator}Resolver'
import type { {Domain}Type } from '~~/services/{domain}s/types'

export function use{Domain}(type?: {Domain}Type) {
  const loading = ref(false)
  const error   = ref<string | null>(null)

  const creator = resolve{Creator}(type)

  async function run(args: Record<string, unknown>) {
    loading.value = true
    error.value = null
    try {
      return await creator.execute(args)
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return { loading, error, run }
}
```

# Utilisation dans un composant

```vue
<script setup lang="ts">
// Provider depuis runtimeConfig (défaut) ou explicite
const { loading, error, run } = use{Domain}('{concrete_a}')

async function handleSubmit(formData: Record<string, unknown>) {
  const result = await run(formData)
  navigateTo('/{domain}s/success')
}
</script>

<template>
  <div>
    <p v-if="loading">Traitement en cours...</p>
    <p v-if="error" class="error">{{ error }}</p>
    <button :disabled="loading" @click="handleSubmit(form)">
      Valider
    </button>
  </div>
</template>
```

# Ajouter une nouvelle implémentation (OCP)

```ts
// 1. Nouveau Produit
class {ConcreteC}{Product} extends Abstract{Product} {
  async perform(args) { ... }
}

// 2. Nouveau Créateur
class {ConcreteC}{Creator} extends Abstract{Creator} {
  protected create{Product}() { return new {ConcreteC}{Product}() }
}

// 3. Enregistrer dans le résolveur (seul fichier à modifier)
const creators: Record<{Domain}Type, ...> = {
  ...,
  '{concrete_c}': () => new {ConcreteC}{Creator}(),
}
// Et ajouter '{concrete_c}' au type union {Domain}Type dans types.ts
```

# Règles à respecter

- `create{Product}()` est `protected` — TypeScript le vérifie à la
  compilation. Elle ne doit jamais être appelée depuis l'extérieur.
- Le composable `use{Domain}()` ne connaît que `Abstract{Creator}` —
  il ne dépend d'aucune classe concrète.
- `useRuntimeConfig()` ne fonctionne que dans des composables/composants
  Vue — c'est pourquoi la résolution se fait dans le résolveur (appelé
  depuis le composable), pas dans les classes Creator TypeScript pures.
- Toujours gérer `loading` et `error` dans le composable façade, jamais
  dans les Créateurs ou Produits — leur rôle est la logique métier, pas
  l'état UI.