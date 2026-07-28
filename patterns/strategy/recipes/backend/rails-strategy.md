---
type: Recipe
title: Strategy Rails — générique
tags: [rails, backend, strategy, design-pattern]
---

# Quand utiliser ce pattern

Un algorithme qui peut varier selon le contexte (type d'utilisateur,
configuration, paramètre runtime) sans que le code appelant ait à
connaître l'implémentation choisie.

Exemples concrets :
- [Calcul de prix](/patterns/strategy/recipes/backend/examples/pricing.md)
- [Validation](/patterns/strategy/recipes/backend/examples/validation.md)
- [Tri](/patterns/strategy/recipes/backend/examples/sorting.md)

# Dépendances

- [Conventions Rails générales](/frameworks/rails.md)
- [Rails 8 — chemins](/frameworks/rails/v8.md)

# Structure des fichiers

```
app/strategies/{domain}s/
├── base_{strategy}.rb          ← interface (module ou classe abstraite)
├── {concrete_a}_{strategy}.rb
├── {concrete_b}_{strategy}.rb
└── {concrete_c}_{strategy}.rb
app/services/
└── {context}.rb                ← contexte qui utilise la stratégie
```

# Interface Strategy (module Ruby)

```ruby
# app/strategies/{domain}s/base_{strategy}.rb
module {Domain}s
  module Base{Strategy}
    # Méthode commune à toutes les stratégies.
    # Lève NotImplementedError si une sous-classe oublie de l'implémenter.
    def execute(**args)
      raise NotImplementedError, "#{self.class} doit implémenter #execute"
    end
  end
end
```

# Stratégies concrètes (à dupliquer par algorithme)

```ruby
# app/strategies/{domain}s/{concrete_a}_{strategy}.rb
module {Domain}s
  class {ConcreteA}{Strategy}
    include Base{Strategy}

    def execute(**args)
      # Implémentation de l'algorithme A
      # Reçoit les mêmes args que toutes les autres stratégies
      # Retourne le même type que toutes les autres stratégies
    end
  end
end

# app/strategies/{domain}s/{concrete_b}_{strategy}.rb
module {Domain}s
  class {ConcreteB}{Strategy}
    include Base{Strategy}

    def execute(**args)
      # Implémentation de l'algorithme B
    end
  end
end
```

# Contexte

```ruby
# app/services/{context}.rb
class {Context}
  def initialize(strategy: nil)
    @strategy = strategy || default_strategy
  end

  # Permet de changer la stratégie au runtime
  def strategy=(strategy)
    @strategy = strategy
  end

  # Délègue à la stratégie sans connaître son implémentation
  def run(**args)
    @strategy.execute(**args)
  end

  private

  def default_strategy
    {Domain}s::{ConcreteA}{Strategy}.new
  end
end
```

# Résolveur (sélection de la stratégie selon un paramètre)

```ruby
# app/strategies/{domain}s/{strategy}_resolver.rb
module {Domain}s
  class {Strategy}Resolver
    STRATEGIES = {
      '{concrete_a}' => {ConcreteA}{Strategy},
      '{concrete_b}' => {ConcreteB}{Strategy},
      '{concrete_c}' => {ConcreteC}{Strategy},
    }.freeze

    def self.resolve(type)
      klass = STRATEGIES[type.to_s]
      raise ArgumentError, "Stratégie inconnue : #{type}" unless klass
      klass.new
    end
  end
end
```

# Utilisation dans un controller ou service

```ruby
# Stratégie fixée à l'initialisation
context = {Context}.new(
  strategy: {Domain}s::{Strategy}Resolver.resolve(params[:type])
)
result = context.run(**payload)

# Changement de stratégie au runtime
context = {Context}.new
context.strategy = {Domain}s::{ConcreteB}{Strategy}.new
result = context.run(**payload)

# Stratégie passée directement (sans contexte si logique légère)
strategy = {Domain}s::{Strategy}Resolver.resolve(user.plan)
result = strategy.execute(**payload)
```

# Ajouter une nouvelle stratégie (OCP)

```ruby
# 1. Nouvelle stratégie
class {ConcreteD}{Strategy}
  include Base{Strategy}
  def execute(**args) = ...
end

# 2. Enregistrer dans le résolveur (seul fichier à modifier)
STRATEGIES = { ..., '{concrete_d}' => {ConcreteD}{Strategy} }.freeze
# Le Contexte et le code appelant ne changent pas.
```

# Règles à respecter

- Toutes les stratégies reçoivent **les mêmes arguments** et retournent
  **le même type** — si ce n'est pas possible, elles ne sont pas
  interchangeables et ce n'est pas Strategy.
- Le Contexte ne doit jamais faire de `is_a?` ou de `case type` pour
  choisir son comportement — c'est exactement ce que Strategy remplace.
- Préférer l'injection de stratégie dans le constructeur du Contexte
  plutôt que le setter au runtime, sauf si le changement en cours de vie
  est réellement nécessaire.