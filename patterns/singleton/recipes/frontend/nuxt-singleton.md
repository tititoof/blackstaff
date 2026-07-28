---
type: Recipe
title: Singleton Nuxt — générique
tags: [nuxt, frontend, singleton, design-pattern]
---

# Quand utiliser ce pattern

Un objet dont une seule instance doit exister dans toute l'application
cliente : client HTTP partagé, config globale lue depuis l'environnement,
service utilitaire sans état.

Exemples concrets :
- [Client API partagé](/patterns/singleton/recipes/frontend/examples/api-client.md)
- [Configuration globale](/patterns/singleton/recipes/frontend/examples/app-config.md)
- [Service formateur](/patterns/singleton/recipes/frontend/examples/formatter.md)

# Dépendances

- [Conventions Nuxt générales](/frameworks/nuxt.md)
- Chemins selon la version : [v3](/frameworks/nuxt/v3.md) / [v4](/frameworks/nuxt/v4.md)

# Deux approches selon le contexte Nuxt

## Approche A — Module ES (recommandée, la plus simple)

En TypeScript/JavaScript moderne, un module ES est **naturellement un
singleton** : il est chargé une seule fois par le bundler et son état
est partagé entre tous les imports.

```ts
// app/singletons/{singleton}.ts  (v4) ou singletons/{singleton}.ts (v3)

// État privé du singleton — non exporté, inaccessible de l'extérieur
let instance: {Singleton} | null = null

class {Singleton} {
  private constructor(
    private readonly config: Record<string, unknown>
  ) {
    // Initialisation — appelée une seule fois
  }

  // Point d'accès global
  static getInstance(): {Singleton} {
    if (!instance) {
      instance = new {Singleton}(loadConfig())
    }
    return instance
  }

  // Méthodes métier du singleton
  doSomething(): unknown {
    // logique utilisant this.config
  }
}

function loadConfig(): Record<string, unknown> {
  // Lecture de la config — runtimeConfig, env, etc.
  return {}
}

// Export de l'instance unique, pas de la classe
// → les consommateurs ne peuvent pas appeler new {Singleton}()
export const {singleton} = {Singleton}.getInstance()
```

## Approche B — Plugin Nuxt (pour les singletons SSR-aware)

Si le singleton doit être disponible via `useNuxtApp()` ou accéder à
`runtimeConfig` (qui n'est disponible qu'en contexte Nuxt) :

```ts
// app/plugins/{singleton}.client.ts  (suffix .client = côté client uniquement)
// ou plugins/{singleton}.ts pour un singleton isomorphe (SSR + client)

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const instance = new {Singleton}(config.public.{configKey})

  // Expose le singleton via useNuxtApp()
  return {
    provide: {
      {singleton}: instance,
    },
  }
})
```

```ts
// Utilisation dans un composant ou composable
const { ${singleton} } = useNuxtApp()
${singleton}.doSomething()
```

## Approche C — Composable avec `useState` (singleton réactif partagé)

Si le singleton doit être **réactif** (état partagé entre composants,
mis à jour en cours de vie de l'app) :

```ts
// app/composables/use{Singleton}.ts
let _instance: ReturnType<typeof createInstance> | null = null

function createInstance() {
  const state = reactive<{ resource: unknown }>({ resource: null })

  function doSomething() { /* ... */ }
  function reset() { state.resource = null }

  return { state: readonly(state), doSomething, reset }
}

export function use{Singleton}() {
  if (!_instance) {
    _instance = createInstance()
  }
  return _instance
}
```

# Choisir la bonne approche

| Situation | Approche recommandée |
|---|---|
| Service sans état, sans runtimeConfig | A — module ES |
| Besoin de runtimeConfig ou de plugins Nuxt | B — plugin Nuxt |
| État réactif partagé entre composants | C — composable singleton |
| État global persistant → | Pinia (pas un Singleton GoF) |

# Règles à respecter

- Toujours exporter l'**instance**, pas la **classe** (approche A) —
  évite que le consommateur appelle `new {Singleton}()` et casse l'unicité.
- En SSR, une variable module-level est partagée entre toutes les requêtes
  côté serveur — ne jamais stocker dans un singleton côté serveur des
  données liées à un utilisateur précis (session, token personnel).
- Pour un état vraiment global et réactif, Pinia est plus adapté qu'un
  composable singleton — il offre le dev tools, la persistance et les tests.
- `_instance` en variable de module (approche C) vit aussi côté serveur
  en SSR — ajouter `.client.ts` au composable si le singleton ne doit
  exister que côté client.