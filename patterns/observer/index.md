---
type: PatternIndex
title: Pattern Observer GoF — index
tags: [observer, design-pattern, gof]
---

# Principe

L'Observer définit une relation **un-à-plusieurs** entre objets : quand
un **Sujet** change d'état, tous ses **Observateurs** en sont notifiés et
mis à jour automatiquement, sans que le Sujet connaisse les Observateurs.

```
Subject (Observable)
  └── subscribe(observer)
  └── unsubscribe(observer)
  └── notify()  → appelle observer.update() sur chacun

Observer (interface)
  ├── ConcreteObserverA.update(event)
  ├── ConcreteObserverB.update(event)
  └── ConcreteObserverC.update(event)
```

Deux variantes courantes :

- **Push** : le Sujet envoie les données dans `update(data)` — l'Observateur
  reçoit tout sans avoir à interroger le Sujet.
- **Pull** : le Sujet envoie juste une notification, l'Observateur interroge
  lui-même le Sujet pour récupérer les données.

# Relation avec les mécanismes natifs des frameworks

L'Observer GoF pur est souvent implémenté nativement dans les frameworks
modernes — identifier ce qui est Observer avant d'en créer un custom :

| Mécanisme | Framework | Rôle Observer natif |
|---|---|---|
| `watch` / `watchEffect` | Vue 3 / Nuxt | Observateur de réactivité Vue |
| Pinia `$subscribe` | Nuxt | Observateur d'un store Pinia |
| `EventEmitter` / bus d'événements | Node / Nuxt | Sujet + Observateurs |
| `after_create`, `after_update` | Rails (ActiveRecord) | Callbacks = Observateurs du modèle |
| Eloquent Model Observers | Laravel | Observer GoF natif |
| EventDispatcher / EventSubscriber | Symfony | Sujet = dispatcher, Observateur = subscriber |
| Hooks n8n (webhooks) | n8n | Sujet = n8n event, Observateur = workflow |

# Cas d'usage couverts

| Cas | Recipe |
|---|---|
| Réactivité Pinia (watch de store) | [pinia-watch.md](/patterns/observer/recipes/frontend/examples/pinia-watch.md) |
| Bus d'événements DOM / Nuxt | [dom-events.md](/patterns/observer/recipes/frontend/examples/dom-events.md) |
| ActiveRecord callbacks Rails | [active-record-callbacks.md](/patterns/observer/recipes/backend/examples/active-record-callbacks.md) |
| Laravel Model Observers | [model-observer.md](/patterns/observer/recipes/backend/examples/model-observer.md) |
| Symfony EventSubscriber | [event-subscriber.md](/patterns/observer/recipes/backend/examples/event-subscriber.md) |

# Recipes génériques disponibles

| Framework | Recipe |
|---|---|
| Nuxt | [nuxt-observer.md](/patterns/observer/recipes/frontend/nuxt-observer.md) |
| Rails | [rails-observer.md](/patterns/observer/recipes/backend/rails-observer.md) |
| Laravel | [laravel-observer.md](/patterns/observer/recipes/backend/laravel-observer.md) |
| Symfony | [symfony-observer.md](/patterns/observer/recipes/backend/symfony-observer.md) |

# Variables de substitution

| Placeholder | Exemple concret |
|---|---|
| `{Subject}` | `OrderStore`, `User`, `Order` |
| `{Event}` | `OrderCreated`, `UserRegistered`, `StockChanged` |
| `{Observer}` | `EmailNotifier`, `StockUpdater`, `AuditLogger` |
| Méthode d'abonnement | `subscribe()`, `$subscribe()`, `on()`, `addListener()` |
| Méthode de notification | `notify()`, `emit()`, `dispatch()` |

# Frameworks et versions disponibles

| Framework | Base | Versions |
|---|---|---|
| Nuxt | [nuxt.md](/frameworks/nuxt.md) | [v3](/frameworks/nuxt/v3.md), [v4](/frameworks/nuxt/v4.md) |
| Rails | [rails.md](/frameworks/rails.md) | [v8](/frameworks/rails/v8.md) |
| Laravel | [laravel.md](/frameworks/laravel.md) | [v13](/frameworks/laravel/v13.md) |
| Symfony | [symfony.md](/frameworks/symfony.md) | [v7 LTS](/frameworks/symfony/v7.md) |

# Quand NE PAS utiliser

- Si la relation est one-to-one et directe → appel de méthode simple.
- Si l'ordre de notification entre Observateurs est critique → préférer
  une chaîne ordonnée (Chain of Responsibility).
- Si le nombre d'Observateurs est fixe et connu → couplage direct
  plus lisible qu'un bus d'événements.