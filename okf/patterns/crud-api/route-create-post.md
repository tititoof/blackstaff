---
type: Recipe
title: Route POST création
tags: [nuxt, api, crud, route]
---

# Route POST création

Dépend de [/patterns/crud-api/contract.md](/patterns/crud-api/contract.md).

Chemin `server/api/{resourcePlural}/index.post.ts`. Lit le body via
`readBody(event)`, forwarde tel quel vers Rails. Si `authStrategy` du
contrat est renseigné et que la route est protégée, voir
[/integrations/nuxt-auth-utils/bff-proxy-pattern.md](/integrations/nuxt-auth-utils/bff-proxy-pattern.md)
pour l'ajout des credentials avant l'appel Rails.
