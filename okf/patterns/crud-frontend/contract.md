---
type: Recipe
title: Contrat CRUD frontend
tags: [nuxt, frontend, crud, contract]
---

# Contrat CRUD frontend

Objet produit une seule fois par run, avant toute génération de fichier.
Voir [/contracts/crud-contract.schema.json](/contracts/crud-contract.schema.json)
pour le schéma complet.

```json
{
  "resource": "Article",
  "resourcePlural": "articles",
  "apiBaseUrl": "/api/articles",
  "composableName": "useArticles",
  "typeName": "Article",
  "fields": [
    { "name": "title", "type": "string" },
    { "name": "body", "type": "string" }
  ],
  "responseFormat": "{ data: T[] }"
}
```

Chaque concept ci-dessous consomme ce contrat sans jamais recalculer
`apiBaseUrl`, `composableName` ou `resourcePlural`.

- [/patterns/crud-frontend/composable.md](/patterns/crud-frontend/composable.md)
- [/patterns/crud-frontend/page-list.md](/patterns/crud-frontend/page-list.md)
- [/patterns/crud-frontend/page-detail.md](/patterns/crud-frontend/page-detail.md)
- [/patterns/crud-frontend/page-create.md](/patterns/crud-frontend/page-create.md)
- [/patterns/crud-frontend/page-edit.md](/patterns/crud-frontend/page-edit.md)
