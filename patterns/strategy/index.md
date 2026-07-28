---
type: PatternIndex
title: Pattern Strategy GoF — index
tags: [strategy, design-pattern, gof]
---

# Principe

Le Strategy définit une **famille d'algorithmes**, encapsule chacun dans
une classe séparée, et les rend **interchangeables au runtime** sans
modifier le code qui les utilise.

```
Context
  └── setStrategy(strategy)     ← injecte ou change l'algorithme
  └── execute()                 ← délègue à strategy.run()

StrategyInterface
  ├── ConcreteStrategyA.run()
  ├── ConcreteStrategyB.run()
  └── ConcreteStrategyC.run()
```

Trois règles fondamentales :

1. **Même interface** — toutes les stratégies exposent la même méthode.
2. **Interchangeables au runtime** — le contexte peut changer de stratégie
   sans être réinstancié.
3. **Contexte délègue** — le contexte ne connaît pas l'implémentation de
   l'algorithme, il lui passe les données et récupère le résultat.

# Différence clé avec Factory Method

Factory Method décide **quel objet créer** — le produit est le résultat.
Strategy décide **quel algorithme appliquer** — le comportement est le
résultat. La Factory Method peut choisir quelle Strategy instancier, les
deux se complètent souvent.

# Cas d'usage couverts

| Cas | Description |
|---|---|
| **Calcul de prix** | Standard, promotion, B2B, fidélité — même appel, tarif différent |
| **Validation** | Règles différentes selon le contexte (inscription, admin, invité) |
| **Tri** | Critère de tri interchangeable sans réécrire la liste |

# Recipes disponibles

| Framework | Générique | Exemples |
|---|---|---|
| Nuxt | [nuxt-strategy.md](/patterns/strategy/recipes/frontend/nuxt-strategy.md) | [validation](/patterns/strategy/recipes/frontend/examples/validation.md), [tri](/patterns/strategy/recipes/frontend/examples/sorting.md) |
| Rails | [rails-strategy.md](/patterns/strategy/recipes/backend/rails-strategy.md) | [prix](/patterns/strategy/recipes/backend/examples/pricing.md), [validation](/patterns/strategy/recipes/backend/examples/validation.md), [tri](/patterns/strategy/recipes/backend/examples/sorting.md) |
| Laravel | [laravel-strategy.md](/patterns/strategy/recipes/backend/laravel-strategy.md) | idem |
| Symfony | [symfony-strategy.md](/patterns/strategy/recipes/backend/symfony-strategy.md) | idem |

# Variables de substitution

| Placeholder | Exemple concret |
|---|---|
| `{Strategy}` | `PricingStrategy`, `ValidationStrategy`, `SortStrategy` |
| `{Context}` | `PriceCalculator`, `FormValidator`, `ProductList` |
| `{ConcreteA}` | `StandardPricing`, `EmailValidation`, `PriceSort` |
| Méthode commune | `calculate()`, `validate()`, `sort()` |

# Frameworks et versions disponibles

| Framework | Base | Versions |
|---|---|---|
| Nuxt | [nuxt.md](/frameworks/nuxt.md) | [v3](/frameworks/nuxt/v3.md), [v4](/frameworks/nuxt/v4.md) |
| Rails | [rails.md](/frameworks/rails.md) | [v8](/frameworks/rails/v8.md) |
| Laravel | [laravel.md](/frameworks/laravel.md) | [v13](/frameworks/laravel/v13.md) |
| Symfony | [symfony.md](/frameworks/symfony.md) | [v7 LTS](/frameworks/symfony/v7.md) |

# Quand NE PAS utiliser

- Si tu n'as que 1-2 algorithmes stables → un simple `if/else` suffit,
  une hiérarchie de classes est over-engineering.
- Si les algorithmes ne partagent pas de données en entrée/sortie → ils
  n'ont pas d'interface commune, ce n'est pas Strategy.
- Si le choix d'algorithme ne change jamais au runtime → Template Method
  (choix à la création via héritage) est plus simple.