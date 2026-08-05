---
type: PatternIndex
title: Pattern CRUD — index
tags: [crud, création, modification, suppression, liste, gérer, gestion, ressource]
---

# Principe de composition

Même logique que le pattern `auth` : deux côtés indépendants composés
selon la config projet. Une resource CRUD est une entité métier (ex.
`Post`, `Product`, `Invoice`) avec les opérations index/show/create/
update/destroy — côté frontend et/ou backend selon la stack déclarée.

- **Frontend** (si `stack.frontend.framework` déclaré) :
  [nuxt-crud-client](/patterns/crud/recipes/frontend/nuxt-crud-client.md)
- **Backend** (si `stack.backend.framework` déclaré) :
  - [rails-crud-api](/patterns/crud/recipes/backend/rails-crud-api.md)
  - [laravel-crud-api](/patterns/crud/recipes/backend/laravel-crud-api.md)
  - [symfony-crud-api](/patterns/crud/recipes/backend/symfony-crud-api.md)

# Variable de substitution : {Resource}

Dans toutes les recipes, `{Resource}` est un placeholder à remplacer par
le nom réel de la ressource en PascalCase singulier (ex. `Post`, `Product`)
et `{resource}` par sa version snake_case/camelCase selon le langage.
Le résolveur n8n doit substituer cette variable depuis la spec de la tâche
avant d'injecter le contenu dans le prompt de génération.

# Résolution de version

Même mécanisme que le pattern `auth` :

```
recipe → /frameworks/{nom}.md (logique) → /frameworks/{nom}/v{N}.md (chemins)
```

# Frameworks et versions disponibles

| Framework | Logique (base partagée) | Versions disponibles |
|---|---|---|
| Nuxt | [nuxt.md](/frameworks/nuxt.md) | [v3](/frameworks/nuxt/v3.md), [v4](/frameworks/nuxt/v4.md) |
| Rails | [rails.md](/frameworks/rails.md) | [v8](/frameworks/rails/v8.md) |
| Laravel | [laravel.md](/frameworks/laravel.md) | [v13](/frameworks/laravel/v13.md) |
| Symfony | [symfony.md](/frameworks/symfony.md) | [v7 LTS](/frameworks/symfony/v7.md) (défaut), [v8](/frameworks/symfony/v8.md) |

# Dépendances disponibles

| Dépendance | Écosystème | Fichier |
|---|---|---|
| jsonapi-serializer | ruby | [rails-jsonapi-serializer.md](/patterns/crud/dependencies/rails-jsonapi-serializer.md) |
| Kaminari (pagination) | ruby | [rails-kaminari.md](/patterns/crud/dependencies/rails-kaminari.md) |
| Laravel API Resources | php (natif) | [laravel-api-resources.md](/patterns/crud/dependencies/laravel-api-resources.md) |
| Symfony API Platform | php | [symfony-api-platform.md](/patterns/crud/dependencies/symfony-api-platform.md) |

# Pour ajouter une nouvelle resource

Pas de nouveau fichier OKF à créer — la recipe est générique via
`{Resource}`. Seule la spec de la tâche change (nom de la resource,
attributs, relations). Le modèle de génération substitute `{Resource}`
et génère les fichiers correspondants.

# Pour ajouter un nouveau framework backend

Même principe que le pattern `auth` : ajouter dans la base racine
[frameworks/](/frameworks/index.md), puis créer
`recipes/backend/{nom}-crud-api.md` qui lie vers cette base.

# Exemples d'instructions qui déclenchent ce pattern

- "Je veux pouvoir gérer les articles : les créer, les modifier, les lister et les supprimer."
- "Ajoute une page pour créer des produits, avec possibilité de les éditer ensuite."
- "Interface de gestion des utilisateurs (liste, création, édition, suppression)."