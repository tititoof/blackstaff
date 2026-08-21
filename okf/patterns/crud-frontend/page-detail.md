---
type: Recipe
title: Page détail CRUD
tags: [nuxt, frontend, crud, page]
---

# Page détail CRUD

Dépend de [/patterns/crud-frontend/composable.md](/patterns/crud-frontend/composable.md).

Récupère l'identifiant via `useRoute().params.id`, appelle
`fetchOne(id)` du composable. Ne recompose jamais l'URL d'API
manuellement — c'est le rôle du composable.
