---
type: PatternIndex
title: Pattern Command GoF — index
tags: [command, design-pattern, gof]
---

# Principe

Le Command encapsule une **requête en objet** — avec ses paramètres, sa
logique d'exécution et optionnellement sa logique d'annulation. Cela permet
de paramétrer des clients avec différentes requêtes, de les mettre en file,
de les logger et de les rendre annulables.

```
Client → Command.execute()
               └── Receiver.action()

Command (interface)
  ├── execute()
  └── undo()       ← optionnel — pour l'annulabilité

ConcreteCommand
  ├── execute()  → délègue au Receiver + sauvegarde l'état précédent
  └── undo()     → restaure l'état sauvegardé

Invoker (file, historique, scheduler)
  └── stocke et déclenche les Commands
```

# Quatre propriétés clés

1. **Encapsulation** — les paramètres de l'action font partie de l'objet Command.
2. **Découplage** — l'Invoker (scheduler, queue) ne connaît pas le Receiver
   (service métier) — il appelle juste `execute()`.
3. **Persistabilité** — un objet Command peut être sérialisé, stocké,
   transmis à un worker (= job Sidekiq/Horizon/Messenger).
4. **Annulabilité** — `undo()` restaure l'état précédent si implémenté.

# Relation directe avec les jobs

Les jobs Sidekiq, Laravel Horizon, Symfony Messenger **sont** des Commands :

```
CreateOrderJob.perform_later(order_id: 42)
 └── encapsule la commande "créer la commande 42"
 └── sérialisable (Redis/DB)
 └── exécutable par un worker plus tard
 └── rejouable (retry)
```

La différence avec un Command GoF pur : les jobs ne sont pas "annulables" via
`undo()` — mais ils sont en revanche idempotents (conçus pour être rejoués).

# Cas d'usage couverts

| Cas | Recipe |
|---|---|
| Jobs Sidekiq/Horizon/Messenger | [job-queue.md](/patterns/command/recipes/backend/examples/job-queue.md) |
| Action transactionnelle complexe | [transaction.md](/patterns/command/recipes/backend/examples/transaction.md) |
| Traitement par lot | [batch.md](/patterns/command/recipes/backend/examples/batch.md) |
| Undo/Redo côté frontend | [undo-redo.md](/patterns/command/recipes/frontend/examples/undo-redo.md) |
| File d'actions optimiste | [action-queue.md](/patterns/command/recipes/frontend/examples/action-queue.md) |

# Recipes génériques disponibles

| Framework | Recipe |
|---|---|
| Nuxt | [nuxt-command.md](/patterns/command/recipes/frontend/nuxt-command.md) |
| Rails | [rails-command.md](/patterns/command/recipes/backend/rails-command.md) |
| Laravel | [laravel-command.md](/patterns/command/recipes/backend/laravel-command.md) |
| Symfony | [symfony-command.md](/patterns/command/recipes/backend/symfony-command.md) |

# Variables de substitution

| Placeholder | Valeur concrète |
|---|---|
| `{Command}` | `CreateOrderCommand`, `SendEmailCommand` |
| `{Receiver}` | `OrderService`, `MailService` |
| `{Invoker}` | `CommandBus`, `JobQueue`, `HistoryManager` |
| Méthode d'exécution | `execute()`, `handle()`, `perform()` |
| Méthode d'annulation | `undo()`, `revert()` |

# Frameworks et versions disponibles

| Framework | Base | Versions |
|---|---|---|
| Nuxt | [nuxt.md](/frameworks/nuxt.md) | [v3](/frameworks/nuxt/v3.md), [v4](/frameworks/nuxt/v4.md) |
| Rails | [rails.md](/frameworks/rails.md) | [v8](/frameworks/rails/v8.md) |
| Laravel | [laravel.md](/frameworks/laravel.md) | [v13](/frameworks/laravel/v13.md) |
| Symfony | [symfony.md](/frameworks/symfony.md) | [v7 LTS](/frameworks/symfony/v7.md) |

# Quand NE PAS utiliser

- Si l'action est triviale et n'a besoin ni d'être mise en file ni annulée
  → un simple appel de méthode suffit.
- Si la Command ne fait que déléguer sans ajouter de valeur (wrapping inutile)
  → over-engineering.
- Si l'annulabilité est requise mais que l'état avant/après est trop coûteux
  à stocker → envisager Memento plutôt que Command.