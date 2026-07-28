---
type: Recipe
title: Strategy Nuxt — générique
tags: [nuxt, frontend, strategy, design-pattern]
---

# Quand utiliser ce pattern

Un algorithme côté frontend qui varie selon le contexte : validation de
formulaire selon le rôle, tri de liste selon la préférence utilisateur,
calcul d'affichage selon le type de données.

Exemples concrets :
- [Validation de formulaire](/patterns/strategy/recipes/frontend/examples/validation.md)
- [Tri de liste](/patterns/strategy/recipes/frontend/examples/sorting.md)

# Dépendances

- [Conventions Nuxt générales](/frameworks/nuxt.md)
- Chemins selon la version : [v3](/frameworks/nuxt/v3.md) / [v4](/frameworks/nuxt/v4.md)

# Structure des fichiers

```
app/strategies/{domain}s/        ← (v4) ou strategies/{domain}s/ (v3)
├── types.ts                     ← interface + type union
├── {ConcreteA}{Strategy}.ts
├── {ConcreteB}{Strategy}.ts
└── {Strategy}Resolver.ts        ← résolveur
app/composables/
└── use{Domain}.ts               ← contexte réactif (façade)
```

# Interface et types

```ts
// strategies/{domain}s/types.ts
export type {Domain}Type = '{concrete_a}' | '{concrete_b}' | '{concrete_c}'

export interface {Strategy}Interface<TInput = unknown, TOutput = unknown> {
  execute(args: TInput): TOutput
}
```

# Stratégies concrètes

```ts
// strategies/{domain}s/{ConcreteA}{Strategy}.ts
import type { {Strategy}Interface } from './types'

export class {ConcreteA}{Strategy} implements {Strategy}Interface<{InputType}, {OutputType}> {
  execute(args: {InputType}): {OutputType} {
    // Implémentation de l'algorithme A
  }
}

// strategies/{domain}s/{ConcreteB}{Strategy}.ts
export class {ConcreteB}{Strategy} implements {Strategy}Interface<{InputType}, {OutputType}> {
  execute(args: {InputType}): {OutputType} {
    // Implémentation de l'algorithme B
  }
}
```

# Résolveur

```ts
// strategies/{domain}s/{Strategy}Resolver.ts
import type { {Domain}Type, {Strategy}Interface } from './types'
import { {ConcreteA}{Strategy} } from './{ConcreteA}{Strategy}'
import { {ConcreteB}{Strategy} } from './{ConcreteB}{Strategy}'

const strategies: Record<{Domain}Type, () => {Strategy}Interface> = {
  '{concrete_a}': () => new {ConcreteA}{Strategy}(),
  '{concrete_b}': () => new {ConcreteB}{Strategy}(),
}

export function resolve{Strategy}(type: {Domain}Type): {Strategy}Interface {
  const factory = strategies[type]
  if (!factory) throw new Error(`Stratégie inconnue : ${type}`)
  return factory()
}
```

# Composable contexte (façade réactive)

```ts
// composables/use{Domain}.ts
import { resolve{Strategy} } from '~~/strategies/{domain}s/{Strategy}Resolver'
import type { {Domain}Type } from '~~/strategies/{domain}s/types'

export function use{Domain}(initialType: {Domain}Type = '{concrete_a}') {
  const currentType = ref<{Domain}Type>(initialType)
  const strategy = computed(() => resolve{Strategy}(currentType.value))

  function setStrategy(type: {Domain}Type) {
    currentType.value = type
  }

  function execute(args: unknown): unknown {
    return strategy.value.execute(args)
  }

  return { currentType, setStrategy, execute }
}
```

# Utilisation dans un composant

```vue
<script setup lang="ts">
// Stratégie fixée à l'initialisation
const { execute, setStrategy } = use{Domain}('{concrete_a}')

// Changer la stratégie au runtime (ex: sélecteur utilisateur)
function handleTypeChange(type: string) {
  setStrategy(type as {Domain}Type)
}

const result = computed(() => execute(inputData.value))
</script>

<template>
  <select @change="handleTypeChange($event.target.value)">
    <option value="{concrete_a}">Option A</option>
    <option value="{concrete_b}">Option B</option>
  </select>
  <div>{{ result }}</div>
</template>
```

# Alternative légère — stratégie comme fonction pure (sans classe)

Pour des algorithmes simples sans état ni dépendances, une fonction pure
est plus légère qu'une classe :

```ts
// types.ts
export type {Strategy}Fn<TInput, TOutput> = (args: TInput) => TOutput

// {domain}Strategies.ts
export const {concrete_a}{Strategy}: {Strategy}Fn<...> = (args) => { ... }
export const {concrete_b}{Strategy}: {Strategy}Fn<...> = (args) => { ... }

const STRATEGIES = {
  '{concrete_a}': {concrete_a}{Strategy},
  '{concrete_b}': {concrete_b}{Strategy},
}

export function resolve{Strategy}(type: {Domain}Type) {
  const fn = STRATEGIES[type]
  if (!fn) throw new Error(`Stratégie inconnue : ${type}`)
  return fn
}
```

Choisir **classe** si la stratégie a un état interne ou des dépendances
injectées, **fonction pure** si elle est sans état et sans dépendance.

# Règles à respecter

- `resolve{Strategy}` crée une nouvelle instance à chaque appel — si la
  stratégie est sans état, c'est sans conséquence ; si elle a un état,
  stocker l'instance dans `computed()` ou `ref()`, pas l'appeler à chaque render.
- Le composable context ne doit jamais faire de `if (type === '{concrete_a}')`
  pour adapter son comportement — déléguer entièrement à la stratégie.
- En SSR Nuxt, les classes instanciées dans un `computed` sont recréées
  côté serveur à chaque requête — aucun état partagé entre utilisateurs.