---
type: Recipe
title: Pagination liste
tags: [nuxt, frontend, pagination]
---

# Pagination liste

Utilisé par [/patterns/crud-frontend/page-list.md](/patterns/crud-frontend/page-list.md)
et [/patterns/crud-api/route-index-get.md](/patterns/crud-api/route-index-get.md).

Le composable expose un état `page` et une fonction `fetchAll(page)`. La
route API transmet ce paramètre sous le nom exact déclaré dans
`paginationParam` du contrat (résolu via
[/backends/rails.md](/backends/rails.md)) — jamais recalculé côté route
ou côté composable indépendamment.
