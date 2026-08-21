---
type: Recipe
title: Route GET liste
tags: [nuxt, api, crud, route]
---

# Route GET liste

Dépend de [/patterns/crud-api/contract.md](/patterns/crud-api/contract.md)
et de [/frameworks/nuxt/nuxt.md](/frameworks/nuxt/nuxt.md) pour le chemin
`server/api/{resourcePlural}/index.get.ts`.

Proxifie vers `contract.backend.baseUrl + contract.backendResourcePath`,
transmet les query params de pagination — voir
[/patterns/pagination/pagination.md](/patterns/pagination/pagination.md)
pour la mécanique complète (`paginationParam` résolu via
[/backends/rails.md](/backends/rails.md)), retourne la réponse telle quelle
dans le `responseFormat` déclaré — pas de transformation de forme côté
Nuxt.
