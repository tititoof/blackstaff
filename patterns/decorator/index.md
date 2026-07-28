---
type: PatternIndex
title: Pattern Decorator GoF — index
tags: [decorator, design-pattern, gof]
---

# Principe

Le Decorator attache dynamiquement des responsabilités supplémentaires à
un objet — **sans modifier sa classe ni créer de sous-classe**. Il enveloppe
l'objet original dans un "wrapper" qui implémente la même interface et
ajoute son comportement avant ou après la délégation.

```
Component (interface)
  └── ConcreteComponent.operation()    ← l'objet original

Decorator (implémente Component, contient un Component)
  └── operation()
        ├── pre-processing (ajout de comportement)
        ├── wrapped.operation()         ← délégation
        └── post-processing (ajout de comportement)

DecoratorA wraps ConcreteComponent
DecoratorB wraps DecoratorA
DecoratorC wraps DecoratorB
→ empilement de couches, chacune ajoute une responsabilité
```

# Différence clé avec l'héritage

| | Héritage | Decorator |
|---|---|---|
| Moment du choix | Compilation | Runtime |
| Combinaisons | Exponentiel (2^N sous-classes) | Linéaire (N decorators) |
| Modification | Classe modifiée | Classe originale intacte |
| Réversibilité | Impossible | Possible (désenvelopper) |

# Relation avec les middlewares

Les middlewares des frameworks web **sont** des Decorators : chaque
middleware enveloppe la requête/réponse, ajoute son comportement (auth,
logging, CORS, rate-limiting), puis passe la main au middleware suivant.

```
Request → AuthMiddleware → LoggingMiddleware → Controller → Response
         ↑ Decorator A    ↑ Decorator B
```

# Cas d'usage couverts

| Cas | Recipe |
|---|---|
| Logging d'un service | [logging.md](/patterns/decorator/recipes/backend/examples/logging.md) |
| Cache d'un service | [caching.md](/patterns/decorator/recipes/backend/examples/caching.md) |
| Middlewares comme Decorators | [middleware.md](/patterns/decorator/recipes/backend/examples/middleware.md) |
| Enrichir un composable Nuxt | [composable-decorator.md](/patterns/decorator/recipes/frontend/examples/composable-decorator.md) |
| Wrapper de composant Vue | [component-decorator.md](/patterns/decorator/recipes/frontend/examples/component-decorator.md) |

# Recipes génériques disponibles

| Framework | Recipe |
|---|---|
| Nuxt | [nuxt-decorator.md](/patterns/decorator/recipes/frontend/nuxt-decorator.md) |
| Rails | [rails-decorator.md](/patterns/decorator/recipes/backend/rails-decorator.md) |
| Laravel | [laravel-decorator.md](/patterns/decorator/recipes/backend/laravel-decorator.md) |
| Symfony | [symfony-decorator.md](/patterns/decorator/recipes/backend/symfony-decorator.md) |

# Variables de substitution

| Placeholder | Exemple concret |
|---|---|
| `{Component}` | `PaymentService`, `UserRepository`, `ApiClient` |
| `{ConcreteComponent}` | `StripePaymentService`, `EloquentUserRepository` |
| `{DecoratorA}` | `LoggingDecorator`, `CachingDecorator` |
| `{DecoratorB}` | `RetryDecorator`, `MetricsDecorator` |

# Frameworks et versions disponibles

| Framework | Base | Versions |
|---|---|---|
| Nuxt | [nuxt.md](/frameworks/nuxt.md) | [v3](/frameworks/nuxt/v3.md), [v4](/frameworks/nuxt/v4.md) |
| Rails | [rails.md](/frameworks/rails.md) | [v8](/frameworks/rails/v8.md) |
| Laravel | [laravel.md](/frameworks/laravel.md) | [v13](/frameworks/laravel/v13.md) |
| Symfony | [symfony.md](/frameworks/symfony.md) | [v7 LTS](/frameworks/symfony/v7.md) |

# Quand NE PAS utiliser

- Si le comportement supplémentaire est fixe et unique → un simple héritage
  ou une composition directe est plus lisible.
- Si l'ordre des couches est critique et complexe → Chain of Responsibility
  est plus adapté.
- Si les Decorators doivent se connaître mutuellement → le couplage annule
  le bénéfice du pattern.