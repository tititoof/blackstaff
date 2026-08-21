---
type: Recipe
title: Contrat CRUD API
tags: [nuxt, api, crud, contract]
---

# Contrat CRUD API

Voir [/contracts/crud-contract.schema.json](/contracts/crud-contract.schema.json).
Étend le contrat frontend avec les faits backend :

```json
{
  "resource": "articles",
  "apiBaseUrl": "/api/articles",
  "backend": { "kind": "rails", "baseUrl": "http://api.internal:3000" },
  "backendResourcePath": "/articles",
  "responseFormat": "{ data: T[] }",
  "errorFormat": "{ errors: string[] }"
}
```

- [/patterns/crud-api/route-index-get.md](/patterns/crud-api/route-index-get.md)
- [/patterns/crud-api/route-show-get.md](/patterns/crud-api/route-show-get.md)
- [/patterns/crud-api/route-create-post.md](/patterns/crud-api/route-create-post.md)
- [/patterns/crud-api/route-update-patch.md](/patterns/crud-api/route-update-patch.md)
- [/patterns/crud-api/route-delete.md](/patterns/crud-api/route-delete.md)
