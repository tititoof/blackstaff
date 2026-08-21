---
type: Recipe
title: Composable CRUD
tags: [nuxt, frontend, crud, composable]
---

# Composable CRUD

Dépend de [/patterns/crud-frontend/contract.md](/patterns/crud-frontend/contract.md)
et de [/frameworks/nuxt/nuxt.md](/frameworks/nuxt/nuxt.md).

Chemin de sortie selon `nuxtVersion` du contrat — voir
[/frameworks/nuxt/v3.md](/frameworks/nuxt/v3.md) ou
[/frameworks/nuxt/v4.md](/frameworks/nuxt/v4.md).

Doit exposer : `items`, `item`, `loading`, `error`, et les fonctions
`fetchAll`, `fetchOne`, `create`, `update`, `remove`. Toutes les URLs
utilisées viennent de `contract.apiBaseUrl`, jamais reconstruites depuis
`contract.resource`.

# Pièges à éviter

- Ne jamais mettre de logique de redirection dans le composable — c'est
  le rôle de la page appelante.
- Toujours gérer `loading` et `error` pour chaque opération, pas
  seulement `fetchAll`.
