---
type: Framework
title: Nuxt — conventions générales
tags: [nuxt, frontend]
---

# Rôle

Conventions de base pour tout projet Nuxt, indépendamment du pattern
métier (auth, crud...) et de la version (3 ou 4). Les patterns lient ici
pour les idiomes du framework ; pour les chemins de fichiers exacts, voir
[Nuxt 3](/frameworks/nuxt/v3.md) ou [Nuxt 4](/frameworks/nuxt/v4.md).

# Identité du framework

Nuxt est un framework full-stack Vue 3, avec rendu serveur (SSR), routage
basé sur les fichiers, et un système de modules pour étendre les
fonctionnalités sans réécrire de configuration bas niveau.

# Gestionnaire de paquets

`npm` par défaut dans tous les exemples de ce bundle. Si un projet utilise
`pnpm` ou `bun`, adapter uniquement la commande d'installation — la
structure de fichiers générée ne change pas.

# Conventions de structure (communes à v3 et v4)

| Concept | Convention |
|---|---|
| Routage | Basé sur les fichiers dans `pages/` (v3) ou `app/pages/` (v4) — un fichier = une route |
| Composants | Auto-importés depuis `components/`, pas d'import manuel nécessaire |
| Composables | Auto-importés depuis `composables/`, préfixe `use` obligatoire (`useAuth`, pas `authHelper`) |
| State global | Toujours via Pinia, jamais de state global ad-hoc dans un composable seul |
| Appels API | Toujours via `$fetch` (wrapper Nuxt natif), jamais `axios` ou `fetch` natif sauf besoin très spécifique |
| Variables d'environnement | Exposées via `runtimeConfig` dans `nuxt.config.ts`, jamais lues directement via `process.env` dans un composant |

# Composition API uniquement

Tout nouveau code utilise la Composition API (`<script setup>`), jamais
l'Options API — cohérence avec l'écosystème Nuxt 3/4 moderne et avec les
composables auto-importés qui ne fonctionnent qu'en Composition API.

# TypeScript par défaut

Tout fichier `.vue` utilise `<script setup lang="ts">`. Les types
partagés (interfaces de modèles, réponses API) vivent dans
`types/` (v3) ou `shared/types/` (v4, accessible aussi côté `server/`).

# Style (ESLint `@nuxt/eslint`, `stylistic: true`) et qualité

Le lint du projet est bloquant : écris directement dans son style plutôt que
de compter sur `eslint --fix`.

- **Pas de point-virgule** en fin d'instruction (`.ts` et `<script setup>`).
- Guillemets **simples** pour les chaînes, indentation de 2 espaces, une
  ligne vide finale en fin de fichier.
- Aucun import ni variable inutilisés (`@typescript-eslint/no-unused-vars`),
  y compris les `import type`.
- **Jamais de ternaire imbriqué** (`a ? x : b ? y : z`) : SonarQube le compte
  comme violation (`typescript:S3358`) et la porte qualité de la CI échoue.
  Écris des `if` avec retours anticipés :

```ts
export const changeColor = (change: number | null): string | undefined => {
  if (change === null || change === 0) return undefined
  if (change > 0) return 'error'
  return 'success'
}
```

- **Jamais de template literal imbriqué** (`` `${a} · ${t(`x.${b}`)}` ``) :
  SonarQube le compte aussi comme violation (`typescript:S4624`, porte qualité
  en échec sur candlekeep-frontend #49). Sors la partie intérieure dans une
  variable ou une petite fonction :

```ts
const romeLabel = (code: string) => t(`companies.hiring.rome.${code}`)
const title = `${code} · ${romeLabel(code)}`
```

# Tests

- Unitaires : Vitest, fichiers `*.spec.ts` colocalisés avec le code testé
  ou dans un dossier `tests/unit/` miroir de la structure source.
- E2E : Playwright, dossier `tests/e2e/`.

# Pièges transverses (toute version, tout pattern)

- Ne jamais accéder à `window`, `document`, ou `localStorage` sans un
  guard `if (import.meta.client)` — le code s'exécute aussi côté serveur
  (SSR) où ces objets n'existent pas.
- Ne pas dupliquer la logique de fetch dans plusieurs composables —
  centraliser dans un composable dédié par ressource (`useUsers()`,
  `usePosts()`), jamais un `$fetch` brut dispersé dans les composants.