---
type: Recipe
title: Page liste CRUD
tags: [nuxt, frontend, crud, page]
---

# Page liste CRUD

Dépend de [/patterns/crud-frontend/composable.md](/patterns/crud-frontend/composable.md),
[/patterns/error-handling/error-handling.md](/patterns/error-handling/error-handling.md)
et [/patterns/pagination/pagination.md](/patterns/pagination/pagination.md).

Consomme uniquement `contract.composableName` — n'appelle jamais
`$fetch` ou `useFetch` directement dans cette page.

Les trois états `loading`, `error`, `data` (voir pattern gestion
d'erreurs) doivent être rendus explicitement dans le template.
