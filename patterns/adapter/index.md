---
type: PatternIndex
title: Pattern Adapter GoF — index
tags: [adapter, design-pattern, gof]
---

# Principe

L'Adapter convertit l'interface d'une classe en une autre interface attendue
par le client. Il permet à des classes incompatibles de collaborer sans
modifier leur code source.

```
Client → {Target}Interface.method()
              ↑
          Adapter.method()
              └── Adaptee.differentMethod()  ← traduit l'appel
```

Deux variantes selon la situation :

- **Adapter par composition** (recommandé) : l'Adapter contient l'Adaptee
  et délègue — ne nécessite pas de modifier l'Adaptee.
- **Adapter par héritage** : l'Adapter hérite de l'Adaptee et implémente
  l'interface Target — possible uniquement si l'Adaptee n'est pas `final`.

# Trois cas d'usage principaux

| Cas | Description |
|---|---|
| **SDK tiers** | Le SDK a son propre idiome (Stripe, Twilio, Sendgrid) — l'Adapter expose l'interface de ton app |
| **Système legacy** | Code ancien avec une API non standard — l'Adapter donne une façade moderne |
| **Format de données** | Convertir entre formats incompatibles (snake_case/camelCase, JSON/XML, formats d'API différents) |

# Différence avec Facade

| | Adapter | Facade |
|---|---|---|
| Objectif | Rendre compatible une interface existante | Simplifier une interface complexe |
| Interface cible | Déjà définie (par le client) | Nouvelle, définie par toi |
| Traduction | Oui — méthodes différentes | Non — mêmes méthodes, moins nombreuses |
| Modification de l'Adaptee | Jamais | Jamais |

# Recipes disponibles

| Framework | Générique | Exemples |
|---|---|---|
| Nuxt | [nuxt-adapter.md](/patterns/adapter/recipes/frontend/nuxt-adapter.md) | [API externe](/patterns/adapter/recipes/frontend/examples/api-adapter.md), [format](/patterns/adapter/recipes/frontend/examples/format-adapter.md) |
| Rails | [rails-adapter.md](/patterns/adapter/recipes/backend/rails-adapter.md) | [SDK tiers](/patterns/adapter/recipes/backend/examples/sdk-adapter.md), [legacy](/patterns/adapter/recipes/backend/examples/legacy-adapter.md), [format](/patterns/adapter/recipes/backend/examples/format-adapter.md) |
| Laravel | [laravel-adapter.md](/patterns/adapter/recipes/backend/laravel-adapter.md) | idem |
| Symfony | [symfony-adapter.md](/patterns/adapter/recipes/backend/symfony-adapter.md) | idem |

# Variables de substitution

| Placeholder | Exemple concret |
|---|---|
| `{Target}` | `PaymentGatewayInterface`, `NotificationInterface` |
| `{Adapter}` | `StripeAdapter`, `TwilioAdapter`, `LegacyOrderAdapter` |
| `{Adaptee}` | `Stripe\PaymentIntent`, `Twilio\Client`, `LegacyOrderSystem` |
| Méthode Target | `charge(amount, currency)` |
| Méthode Adaptee | `PaymentIntent::create(['amount' => ..., 'currency' => ...])` |

# Frameworks et versions disponibles

| Framework | Base | Versions |
|---|---|---|
| Nuxt | [nuxt.md](/frameworks/nuxt.md) | [v3](/frameworks/nuxt/v3.md), [v4](/frameworks/nuxt/v4.md) |
| Rails | [rails.md](/frameworks/rails.md) | [v8](/frameworks/rails/v8.md) |
| Laravel | [laravel.md](/frameworks/laravel.md) | [v13](/frameworks/laravel/v13.md) |
| Symfony | [symfony.md](/frameworks/symfony.md) | [v7 LTS](/frameworks/symfony/v7.md) |

# Quand NE PAS utiliser

- Si l'interface de l'Adaptee est déjà compatible → pas besoin d'adapter.
- Si tu contrôles l'Adaptee → modifier directement son interface est plus simple.
- Si la traduction est si complexe qu'elle devient de la logique métier →
  un service dédié est plus approprié qu'un simple Adapter.