---
type: Recipe
title: Route GET détail
tags: [nuxt, api, crud, route]
---

# Route GET détail

Dépend de [/patterns/crud-api/contract.md](/patterns/crud-api/contract.md).

Chemin `server/api/{resourcePlural}/[id].get.ts`. Récupère `id` via
`getRouterParam(event, 'id')`, proxifie vers
`${backendResourcePath}/${id}`. Retourne 404 si Rails répond 404 — ne pas
absorber l'erreur silencieusement.
