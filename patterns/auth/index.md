---
type: PatternIndex
title: Pattern Auth — index
tags: [auth, authentification, connexion, inscription, session, login, protéger, sécuriser]
---

# Principe de composition

Le pattern auth se décompose en **deux côtés indépendants**, à composer
selon la config projet plutôt que de chercher une recipe combinée toute
faite :

- **Frontend** (si `stack.frontend.framework` déclaré) :
  [nuxt-auth-client](/patterns/auth/recipes/frontend/nuxt-auth-client.md)
  [nuxt-auth-client](/patterns/auth/recipes/frontend/nuxt-auth-bff.md)
- **Backend** (si `stack.backend.framework` déclaré) :
  - [rails-auth-api](/patterns/auth/recipes/backend/rails-auth-api.md)
  - [laravel-auth-api](/patterns/auth/recipes/backend/laravel-auth-api.md)
  - [symfony-auth-api](/patterns/auth/recipes/backend/symfony-auth-api.md)

Si un seul des deux côtés est déclaré dans la config projet (ex. Rails
seul, sans frontend Nuxt), ne charger que la recipe backend correspondante.

# Résolution de version

Chaque recipe backend/frontend lie vers un concept `Framework` (logique,
stable) qui lie lui-même vers un concept `FrameworkVersion` (chemins,
dépendant de la version déclarée dans la config projet) :

```
recipe → framework.md (logique) → framework/v{N}.md (chemins)
```

Le résolveur doit :
1. Charger la recipe (frontend et/ou backend selon la config projet).
2. Suivre le lien vers le `Framework` correspondant.
3. Suivre le lien vers le `FrameworkVersion` correspondant à la version
   déclarée. Si la version exacte n'existe pas, fallback sur la version
   majeure la plus proche en dessous.
4. Charger les `Dependency` listées dans la recipe, vérifier leur
   installation, les installer si absentes (voir `dependency-resolver`).

# Frameworks et versions disponibles

Ce pattern ne définit plus ses propres fichiers framework — il **lie**
vers la base partagée à la racine du bundle
([frameworks/index.md](/frameworks/index.md)), commune à tous les
patterns (auth, crud, futurs).

| Framework | Logique (base partagée) | Versions disponibles |
|---|---|---|
| Nuxt | [nuxt.md](/frameworks/nuxt.md) | [v3](/frameworks/nuxt/v3.md), [v4](/frameworks/nuxt/v4.md) |
| Rails | [rails.md](/frameworks/rails.md) | [v8](/frameworks/rails/v8.md) |
| Laravel | [laravel.md](/frameworks/laravel.md) | [v13](/frameworks/laravel/v13.md) |
| Symfony | [symfony.md](/frameworks/symfony.md) | [v7 LTS](/frameworks/symfony/v7.md) (défaut), [v8](/frameworks/symfony/v8.md) |

# Dépendances disponibles

| Dépendance | Écosystème | Fichier |
|---|---|---|
| Pinia | node | [nuxt-pinia.md](/patterns/auth/dependencies/nuxt-pinia.md) |
| Devise | ruby | [rails-devise.md](/patterns/auth/dependencies/rails-devise.md) |
| devise-jwt | ruby | [rails-jwt.md](/patterns/auth/dependencies/rails-jwt.md) |
| Laravel Sanctum | php | [laravel-sanctum.md](/patterns/auth/dependencies/laravel-sanctum.md) |
| Security Bundle | php | [symfony-security-bundle.md](/patterns/auth/dependencies/symfony-security-bundle.md) |
| LexikJWTAuthenticationBundle | php | [symfony-jwt.md](/patterns/auth/dependencies/symfony-jwt.md) |

# Pour ajouter un nouveau framework backend (ex. Django, Adonis)

1. Créer `frameworks/{nom}.md` (logique) et `frameworks/{nom}/v{N}.md`
   (chemins) **dans la base racine**, pas dans ce pattern — voir
   [frameworks/index.md](/frameworks/index.md).
2. Créer les `dependencies/{nom}-*.md` ici, dans `patterns/auth/dependencies/`
   (les dépendances restent spécifiques au pattern, contrairement aux
   frameworks qui sont partagés).
3. Créer `recipes/backend/{nom}-auth-api.md` qui lie vers les deux.
4. Ajouter une ligne dans le tableau ci-dessus.

Aucune modification du résolveur n8n n'est nécessaire — la composition
frontend/backend reste générique, et le résolveur suit les liens markdown
qu'ils pointent vers la base racine ou vers ce pattern.

# Exemples d'instructions qui déclenchent ce pattern

- "Implémente la connexion et l'inscription des utilisateurs."
- "Protège ces pages pour qu'elles ne soient accessibles qu'aux utilisateurs connectés."
- "Ajoute un système de session pour garder l'utilisateur connecté entre les visites."