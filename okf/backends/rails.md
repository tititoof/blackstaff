---
type: Reference
title: Conventions Rails (API)
tags: [rails, backend]
---

# Conventions Rails (API)

Ces conventions dépendent du choix de sérialiseur du projet — à déclarer
explicitement dans le contrat, jamais deviné depuis un exemple de réponse.

## Formats de réponse possibles

| Sérialiseur | Forme de la réponse liste | Forme d'une erreur |
|---|---|---|
| `jsonapi-serializer` | `{ data: [...] }` | `{ errors: [{ detail: string }] }` |
| API Resources maison | `{ data: [...], meta: {...} }` | `{ errors: string[] }` |
| ActiveModelSerializers | `{ resource_name: [...] }` | `{ errors: {...} }` |

## Pagination

- `page[number]` / `page[size]` si `jsonapi-serializer` + `pagy`/`kaminari`
  en mode JSON:API.
- `page` / `per_page` en query simple sinon.

Le paramètre exact à utiliser doit venir du contrat (`paginationParam`),
jamais recalculé par le modèle à partir du nom du gem.

# Pièges à éviter

- Ne pas supposer que toutes les réponses Rails suivent JSON:API — beaucoup
  de projets exposent un format maison.
- Le code de statut Rails pour une erreur de validation Devise est souvent
  `422`, pas `400` — à vérifier côté backend réel plutôt qu'à deviner.
