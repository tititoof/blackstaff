---
type: PatternIndex
title: Pattern Singleton GoF — index
tags: [singleton, design-pattern, gof]
---

# Principe

Le Singleton garantit qu'une classe n'a **qu'une seule instance** dans
tout le programme, et fournit un point d'accès global à cette instance.

```
Singleton.getInstance()  →  toujours la même instance
Singleton.getInstance()  →  toujours la même instance
```

Deux mécanismes fondamentaux :
1. **Constructeur privé** — empêche `new Singleton()` depuis l'extérieur.
2. **Méthode statique `getInstance()`** — crée l'instance au premier appel
   (lazy initialization), la retourne en cache lors des appels suivants.

# ⚠️ Avertissement important : Singleton ≠ toujours la bonne solution

Le Singleton est l'un des patterns les plus souvent **mal utilisés** :

- Il crée un couplage global difficile à tester (constructeur privé =
  impossible de mocker sans contorsions).
- En environnement multi-thread (serveurs), une instance statique partagée
  entre requêtes peut provoquer des **race conditions** et des **fuites
  de données entre utilisateurs**.
- **En Rails, Laravel et Symfony**, le conteneur de services gère déjà
  l'unicité par scope — un service déclaré en scope `singleton` dans le
  conteneur est instancié une fois et réutilisé, sans pattern Singleton
  classique ni instance statique. C'est l'approche recommandée côté backend.

→ Utiliser le Singleton classique (instance statique) uniquement quand le
conteneur de services n'est pas disponible ou pertinent (scripts CLI,
bibliothèques autonomes, code côté client TypeScript sans framework DI).

# Trois cas d'usage couverts

| Cas | Singleton GoF | Scope DI équivalent |
|---|---|---|
| **Client partagé** (API externe, cache, logger) | Instance statique si hors DI | Service scopé `singleton` en DI |
| **Config globale** | Instance statique lue depuis env | Service config injecté |
| **Service sans état** | Instance statique | Service DI (tout scope) |

# Recipes disponibles

| Framework | Générique | Exemples |
|---|---|---|
| Nuxt | [nuxt-singleton.md](/patterns/singleton/recipes/frontend/nuxt-singleton.md) | [client API](/patterns/singleton/recipes/frontend/examples/api-client.md), [config](/patterns/singleton/recipes/frontend/examples/app-config.md), [formateur](/patterns/singleton/recipes/frontend/examples/formatter.md) |
| Rails | [rails-singleton.md](/patterns/singleton/recipes/backend/rails-singleton.md) | [client API](/patterns/singleton/recipes/backend/examples/api-client.md), [config](/patterns/singleton/recipes/backend/examples/app-config.md), [formateur](/patterns/singleton/recipes/backend/examples/formatter.md) |
| Laravel | [laravel-singleton.md](/patterns/singleton/recipes/backend/laravel-singleton.md) | idem |
| Symfony | [symfony-singleton.md](/patterns/singleton/recipes/backend/symfony-singleton.md) | idem |

# Variables de substitution

| Placeholder | Exemple concret |
|---|---|
| `{Singleton}` | `ApiClient`, `AppConfig`, `CurrencyFormatter` |
| `{resource}` | La ressource gérée (connection, config, format) |

# Frameworks et versions disponibles

| Framework | Base | Versions |
|---|---|---|
| Nuxt | [nuxt.md](/frameworks/nuxt.md) | [v3](/frameworks/nuxt/v3.md), [v4](/frameworks/nuxt/v4.md) |
| Rails | [rails.md](/frameworks/rails.md) | [v8](/frameworks/rails/v8.md) |
| Laravel | [laravel.md](/frameworks/laravel.md) | [v13](/frameworks/laravel/v13.md) |
| Symfony | [symfony.md](/frameworks/symfony.md) | [v7 LTS](/frameworks/symfony/v7.md) |

# Quand NE PAS utiliser

- Si un conteneur de services (Laravel, Symfony, Nuxt plugins) est
  disponible → préférer un service scopé DI, plus testable.
- Si l'instance gère un état mutable lié à une requête HTTP → dangereux
  en multi-thread, l'état d'un utilisateur peut polluer celui d'un autre.
- Si l'objet est complexe à initialiser et dépend du contexte → Builder
  ou Factory Method sont plus adaptés.