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