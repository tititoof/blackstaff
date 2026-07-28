---
type: Recipe
title: Decorator Nuxt — générique
tags: [nuxt, frontend, decorator, design-pattern]
---

# Quand utiliser ce pattern

Enrichir un composable ou un composant avec des comportements transversaux
(logging, cache, retry, métriques, rate-limiting) sans modifier leur code
original.

Exemples concrets :
- [Décorer un composable](/patterns/decorator/recipes/frontend/examples/composable-decorator.md)
- [Wrapper de composant Vue](/patterns/decorator/recipes/frontend/examples/component-decorator.md)

# Dépendances

- [Conventions Nuxt générales](/frameworks/nuxt.md)
- Chemins selon la version : [v3](/frameworks/nuxt/v3.md) / [v4](/frameworks/nuxt/v4.md)

# Deux formes de Decorator en Nuxt/TypeScript

## Forme A — Classe TypeScript (fidèle au GoF)

```ts
// app/services/{domain}s/{component}.ts
export interface {Component}Interface {
  {operation}(args: {InputType}): Promise<{OutputType}>
}

// Composant concret
export class {ConcreteComponent} implements {Component}Interface {
  async {operation}(args: {InputType}): Promise<{OutputType}> {
    // Implémentation réelle
  }
}

// Base Decorator
export abstract class Base{Decorator} implements {Component}Interface {
  constructor(protected readonly wrapped: {Component}Interface) {}

  async {operation}(args: {InputType}): Promise<{OutputType}> {
    return this.wrapped.{operation}(args)  // délégation par défaut
  }
}

// Decorator concret A
export class {DecoratorA} extends Base{Decorator} {
  async {operation}(args: {InputType}): Promise<{OutputType}> {
    this.before(args)
    const result = await super.{operation}(args)  // délégation
    this.after(result, args)
    return result
  }

  private before(args: {InputType}): void { /* pré-traitement */ }
  private after(result: {OutputType}, args: {InputType}): void { /* post-traitement */ }
}

// Assemblage
export function build{Component}(): {Component}Interface {
  let service: {Component}Interface = new {ConcreteComponent}()
  service = new {DecoratorA}(service)
  service = new {DecoratorB}(service)
  return service
}
```

## Forme B — Fonction wrapper TypeScript (plus idiomatique en Vue/Nuxt)

Pour des composables ou des fonctions plutôt que des classes :

```ts
// app/services/{domain}s/{component}.ts
export type {Operation}Fn = (args: {InputType}) => Promise<{OutputType}>

// Fonction originale
export const {operation}: {Operation}Fn = async (args) => {
  // Implémentation réelle
}

// Decorator comme Higher-Order Function
export function with{DecoratorA}(fn: {Operation}Fn): {Operation}Fn {
  return async (args) => {
    // Pré-traitement
    const result = await fn(args)  // délégation
    // Post-traitement
    return result
  }
}

export function with{DecoratorB}(fn: {Operation}Fn): {Operation}Fn {
  return async (args) => {
    const result = await fn(args)
    return result
  }
}

// Assemblage par composition de fonctions
export const decorated{Operation} = with{DecoratorB}(with{DecoratorA}({operation}))
```

# Composable façade (point d'entrée pour les composants)

```ts
// app/composables/use{Domain}.ts
import { build{Component} } from '~~/services/{domain}s/{component}'

export function use{Domain}() {
  // Le service entièrement décoré — les composants ne voient que l'interface
  const service = build{Component}()

  const loading = ref(false)
  const error   = ref<string | null>(null)

  async function execute(args: {InputType}) {
    loading.value = true
    error.value   = null
    try {
      return await service.{operation}(args)
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return { loading, error, execute }
}
```

# Choisir entre Forme A (classe) et Forme B (fonction)

| | Classe (Forme A) | Fonction HOF (Forme B) |
|---|---|---|
| Services avec état interne | ✅ | ❌ |
| Services sans état | ✅ | ✅ (plus léger) |
| Injection de dépendances | Via constructeur | Via closure |
| Empilement multiple | Via `new DecoratorA(new DecoratorB(base))` | Via `withA(withB(fn))` |
| Lisibilité | Explicite (nommage des classes) | Concise (pipe de fonctions) |

# Règles à respecter

- La signature de `{operation}` doit être identique dans le composant
  original et dans chaque Decorator — c'est ce qui garantit l'interchangeabilité.
- Toujours appeler `super.{operation}(args)` / `fn(args)` dans le Decorator
  sauf pour un court-circuit intentionnel (cache hit = ne pas appeler le
  service réel).
- Ne pas instancier le service décoré dans chaque composant — centraliser
  dans la factory ou le composable.