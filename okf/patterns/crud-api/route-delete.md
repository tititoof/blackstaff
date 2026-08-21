---
type: Recipe
title: Route DELETE
tags: [nuxt, api, crud, route]
---

# Route DELETE

Dépend de [/patterns/crud-api/route-show-get.md](/patterns/crud-api/route-show-get.md).

Chemin `server/api/{resourcePlural}/[id].delete.ts`. Retourne un statut
204 sans corps si Rails confirme la suppression — ne pas inventer de
corps de réponse non prévu par le contrat.
