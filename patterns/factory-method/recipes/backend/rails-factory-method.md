---
type: Recipe
title: Factory Method Rails — générique
tags: [rails, backend, factory-method, design-pattern]
---

# Quand utiliser ce pattern

Un service qui a plusieurs implémentations concrètes avec une logique
métier commune autour de la création, et où l'ajout d'une nouvelle
implémentation ne doit pas modifier le code existant (OCP).

Exemples concrets dans ce dossier :
- [Paiement (Stripe, PayPal, Virement)](/patterns/factory-method/recipes/backend/examples/payment.md)
- [Export (CSV, PDF, Excel)](/patterns/factory-method/recipes/backend/examples/export.md)
- [Notification (Email, SMS, Push)](/patterns/factory-method/recipes/backend/examples/notification.md)

# Dépendances

- [Conventions Rails générales](/frameworks/rails.md)
- [Rails 8 — chemins](/frameworks/rails/v8.md)

# Structure des fichiers

```
app/services/{domain}s/
├── base_{creator}.rb          ← Créateur abstrait
├── {concrete_a}_{creator}.rb  ← Créateur concret A
├── {concrete_b}_{creator}.rb  ← Créateur concret B
├── base_{product}.rb          ← Produit abstrait
├── {concrete_a}_{product}.rb  ← Produit concret A
├── {concrete_b}_{product}.rb  ← Produit concret B
└── {creator}_resolver.rb      ← Résolveur (point d'entrée)
```

# Produit abstrait

```ruby
# app/services/{domain}s/base_{product}.rb
module {Domain}s
  class Base{Product}
    # Déclarer ici les méthodes communes à tous les produits concrets.
    # Chaque méthode lève NotImplementedError — force les sous-classes
    # à toutes les implémenter.
    def perform(**args)
      raise NotImplementedError, "#{self.class} doit implémenter #perform"
    end
  end
end
```

# Produit concret (à dupliquer par implémentation)

```ruby
# app/services/{domain}s/{concrete_a}_{product}.rb
module {Domain}s
  class {ConcreteA}{Product} < Base{Product}
    def perform(**args)
      # Implémentation spécifique à {ConcreteA}
    end
  end
end
```

# Créateur abstrait

```ruby
# app/services/{domain}s/base_{creator}.rb
module {Domain}s
  class Base{Creator}
    # Méthode fabrique — abstraite, redéfinie dans chaque sous-classe.
    # Ne contient QUE la logique de création, aucune logique métier.
    def create_{product}
      raise NotImplementedError, "#{self.class} doit implémenter #create_{product}"
    end

    # Logique métier commune — utilise le produit via l'interface abstraite.
    # Les sous-classes n'ont PAS à surcharger cette méthode sauf pour
    # des ajustements mineurs (ex: conversion d'unités avant appel à super).
    def execute(**args)
      product = create_{product}   # ← appel à la méthode fabrique

      validate!(**args)
      result = product.perform(**args)
      after_execute(result, **args)

      result
    end

    private

    # Validation commune à toutes les implémentations.
    # Surcharger dans le Créateur concret pour des validations spécifiques.
    def validate!(**args)
      # ex: raise ArgumentError, "..." unless args[:required_key].present?
    end

    # Hook post-exécution (log, notification, etc.)
    # Surcharger pour adapter le comportement après exécution.
    def after_execute(result, **args)
      Rails.logger.info("[{Domain}] executed", result: result.inspect)
    end
  end
end
```

# Créateur concret (à dupliquer par implémentation)

```ruby
# app/services/{domain}s/{concrete_a}_{creator}.rb
module {Domain}s
  class {ConcreteA}{Creator} < Base{Creator}
    # Redéfinit UNIQUEMENT la méthode fabrique.
    def create_{product}
      {ConcreteA}{Product}.new
    end

    # Ne surcharger execute() que si cette implémentation a
    # une logique vraiment différente de la classe de base.
    # Exemple : pré-traitement des arguments avant délégation à super.
    # def execute(**args)
    #   super(**args.merge(extra_param: compute_extra))
    # end
  end
end
```

# Résolveur

```ruby
# app/services/{domain}s/{creator}_resolver.rb
module {Domain}s
  class {Creator}Resolver
    IMPLEMENTATIONS = {
      '{concrete_a}' => {ConcreteA}{Creator},
      '{concrete_b}' => {ConcreteB}{Creator},
    }.freeze

    def self.resolve(type = ENV.fetch('{DOMAIN}_PROVIDER', '{concrete_a}'))
      klass = IMPLEMENTATIONS[type.to_s]
      raise ArgumentError, "Implémentation inconnue : #{type}" unless klass
      klass.new
    end
  end
end
```

# Utilisation dans un controller ou service applicatif

```ruby
creator = {Domain}s::{Creator}Resolver.resolve
result  = creator.execute(**params)
```

# Ajouter une nouvelle implémentation (OCP — rien d'existant modifié)

```ruby
# 1. Nouveau Produit
class {ConcreteC}{Product} < Base{Product}
  def perform(**args) = ...
end

# 2. Nouveau Créateur
class {ConcreteC}{Creator} < Base{Creator}
  def create_{product} = {ConcreteC}{Product}.new
end

# 3. Enregistrer dans le résolveur (seul fichier à modifier)
IMPLEMENTATIONS = { ..., '{concrete_c}' => {ConcreteC}{Creator} }.freeze
```

# Règles à respecter

- `create_{product}` ne fait **que** créer et retourner un Produit.
  Pas de validation, pas de log, pas d'effet de bord.
- La logique métier commune vit dans `Base{Creator}#execute`.
  Les Créateurs concrets ne la dupliquent jamais — ils appellent `super`.
- Les sous-classes surchargent `execute` uniquement pour des
  ajustements spécifiques (ex: conversion d'unités), jamais pour
  réécrire la logique complète.
- Le Résolveur est le **seul** endroit où les types concrets sont connus.
  Controllers et services applicatifs n'importent jamais un Créateur concret.