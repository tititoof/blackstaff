---
type: Recipe
title: Page édition CRUD
tags: [nuxt, frontend, crud, page]
---

# Page édition CRUD

Dépend de [/patterns/crud-frontend/page-create.md](/patterns/crud-frontend/page-create.md)
(mêmes règles de formulaire) et de
[/patterns/crud-frontend/page-detail.md](/patterns/crud-frontend/page-detail.md)
(mêmes règles de récupération de l'identifiant).

Pré-remplit le formulaire via `fetchOne`, soumet via `update(id, payload)`
— jamais `create()`.
