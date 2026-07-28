---
type: PatternIndex
title: Pattern Facade GoF — index
tags: [facade, design-pattern, gof]
---

# Principe

La Facade fournit une **interface simplifiée** à un sous-système complexe.
Elle ne masque pas le sous-système (il reste accessible) — elle offre un
point d'entrée unique pour les cas d'usage courants, sans que le client
ait à connaître tous les composants internes.

```
Client → Facade.simpleOperation()
              ├── SubsystemA.step1()
              ├── SubsystemB.step2()
              └── SubsystemC.step3()
```

Trois propriétés fondamentales :

1. **Interface simplifiée** — une méthode de la Facade remplace N appels
   coordonnés vers le sous-système.
2. **Découplage** — le client ne connaît pas les composants du sous-système,
   seule la Facade les orchestre.
3. **Sous-système accessible** — la Facade ne cache pas les composants,
   elle propose juste un raccourci pour les cas courants. Un client
   peut toujours accéder directement au sous-système si nécessaire.

# Différences avec les patterns proches

| | Facade | Adapter | Mediator |
|---|---|---|---|
| Objectif | Simplifier une interface complexe | Rendre compatible une interface incompatible | Coordonner des objets qui s'observent mutuellement |
| Interface cible | Nouvelle, définie par toi | Déjà définie (par le client) | Centralisée (les composants ne se connaissent pas) |
| Sous-système | Inchangé, toujours accessible | Inchangé, traduit | Modifié pour pointer vers le Mediator |
| Nombre de sous-systèmes | Plusieurs | Un seul Adaptee | Plusieurs pairs |

# Cas d'usage couverts

| Cas | Description |
|---|---|
| **Orchestration de services** | Une action métier qui nécessite plusieurs services (commande = stock + paiement + email) |
| **Masquer la complexité d'intégration** | Plusieurs sources de données, plusieurs APIs, plusieurs étapes |
| **Point d'entrée unifié** | Le client ne doit appeler qu'une seule méthode pour un cas d'usage complet |

# Recipes disponibles

| Framework | Générique | Exemples |
|---|---|---|
| Nuxt | [nuxt-facade.md](/patterns/facade/recipes/frontend/nuxt-facade.md) | [checkout](/patterns/facade/recipes/frontend/examples/checkout-facade.md), [auth](/patterns/facade/recipes/frontend/examples/auth-facade.md) |
| Rails | [rails-facade.md](/patterns/facade/recipes/backend/rails-facade.md) | [commande](/patterns/facade/recipes/backend/examples/order-facade.md), [notification](/patterns/facade/recipes/backend/examples/notification-facade.md), [reporting](/patterns/facade/recipes/backend/examples/reporting-facade.md) |
| Laravel | [laravel-facade.md](/patterns/facade/recipes/backend/laravel-facade.md) | idem |
| Symfony | [symfony-facade.md](/patterns/facade/recipes/backend/symfony-facade.md) | idem |

# Variables de substitution

| Placeholder | Exemple concret |
|---|---|
| `{Facade}` | `OrderFacade`, `CheckoutFacade`, `NotificationFacade` |
| `{SubsystemA}` | `StockService`, `PaymentService`, `MailService` |
| `{Operation}` | `placeOrder()`, `checkout()`, `notify()` |

# Frameworks et versions disponibles

| Framework | Base | Versions |
|---|---|---|
| Nuxt | [nuxt.md](/frameworks/nuxt.md) | [v3](/frameworks/nuxt/v3.md), [v4](/frameworks/nuxt/v4.md) |
| Rails | [rails.md](/frameworks/rails.md) | [v8](/frameworks/rails/v8.md) |
| Laravel | [laravel.md](/frameworks/laravel.md) | [v13](/frameworks/laravel/v13.md) |
| Symfony | [symfony.md](/frameworks/symfony.md) | [v7 LTS](/frameworks/symfony/v7.md) |

# Quand NE PAS utiliser

- Si le sous-système n'a qu'un seul composant → inutile, appeler directement.
- Si le client a besoin d'un contrôle fin sur chaque étape → la Facade
  masque trop, exposer les composants directement.
- Si la Facade devient un "god object" qui fait tout → découper en plusieurs
  facades ou services dédiés.