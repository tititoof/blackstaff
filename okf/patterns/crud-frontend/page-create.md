---
type: Recipe
title: Page création CRUD
tags: [nuxt, frontend, crud, page]
---

# Page création CRUD

Dépend de [/patterns/crud-frontend/composable.md](/patterns/crud-frontend/composable.md)
et de [/patterns/forms/vuetify-form.md](/patterns/forms/vuetify-form.md).

Les champs du formulaire viennent de `contract.fields` — ne jamais
inventer un champ absent du contrat, ni en omettre un présent.

Après `create()` réussi, navigation vers la page liste (`/{resourcePlural}`)
via `navigateTo`, décidée dans la page, pas dans le composable.
