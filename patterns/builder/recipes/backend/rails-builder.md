---
type: Recipe
title: Builder Rails — générique
tags: [rails, backend, builder, design-pattern]
---

# Quand utiliser ce pattern

Un objet complexe dont la construction nécessite de nombreuses étapes
optionnelles ou variables, ou dont il existe plusieurs représentations
produites par le même processus de construction.

Exemples concrets :
- [Rapport (PDF, CSV)](/patterns/builder/recipes/backend/examples/report-builder.md)
- [Requête complexe (SQL, Elasticsearch)](/patterns/builder/recipes/backend/examples/query-builder.md)

# Dépendances

- [Conventions Rails générales](/frameworks/rails.md)
- [Rails 8 — chemins](/frameworks/rails/v8.md)

# Structure des fichiers

```
app/builders/{domain}s/
├── {builder}_interface.rb        ← Interface Builder (module Ruby)
├── {concrete_a}_{builder}.rb     ← ConcreteBuilder A
├── {concrete_b}_{builder}.rb     ← ConcreteBuilder B
└── {director}.rb                 ← Director
```

# Interface Builder (module Ruby)

```ruby
# app/builders/{domain}s/{builder}_interface.rb
module {Domain}s
  module {Builder}Interface
    # Réinitialise le produit en cours de construction.
    # Toujours appeler reset avant de commencer une nouvelle construction.
    def reset
      raise NotImplementedError, "#{self.class} doit implémenter #reset"
    end

    # Étapes de construction — chaque étape est indépendante.
    # Retourner self pour permettre le chaînage (fluent interface).
    def step_a(**opts)
      raise NotImplementedError, "#{self.class} doit implémenter #step_a"
    end

    def step_b(**opts)
      raise NotImplementedError, "#{self.class} doit implémenter #step_b"
    end

    def step_c(**opts)
      raise NotImplementedError, "#{self.class} doit implémenter #step_c"
    end

    # Retourne le produit fini. Non déclaré dans l'interface car les
    # ConcreteBuilders peuvent produire des types très différents.
    # def get_result → à implémenter dans chaque ConcreteBuilder
  end
end
```

# ConcreteBuilder (à dupliquer par représentation)

```ruby
# app/builders/{domain}s/{concrete_a}_{builder}.rb
module {Domain}s
  class {ConcreteA}{Builder}
    include {Builder}Interface

    def initialize
      reset
    end

    def reset
      @product = {ProductA}.new   # objet vide à construire
      self
    end

    # Chaque étape construit une partie du produit.
    def step_a(**opts)
      @product.part_a = build_part_a(opts)
      self   # retourner self → chaînage possible
    end

    def step_b(**opts)
      @product.part_b = build_part_b(opts)
      self
    end

    def step_c(**opts)
      @product.part_c = build_part_c(opts)
      self
    end

    # Retourne le produit fini et remet le builder à zéro.
    def get_result
      product = @product
      reset
      product
    end

    private

    def build_part_a(opts)
      # Logique de construction spécifique à {ConcreteA}
    end

    def build_part_b(opts)
      # Logique de construction spécifique à {ConcreteA}
    end

    def build_part_c(opts)
      # Logique de construction spécifique à {ConcreteA}
    end
  end
end
```

# Director

```ruby
# app/builders/{domain}s/{director}.rb
module {Domain}s
  class {Director}
    # Le Director reçoit un Builder et orchestre ses étapes.
    # Il encapsule les "recettes" réutilisables de construction —
    # chaque méthode du Director correspond à une configuration connue.
    def initialize(builder)
      @builder = builder
    end

    # Permet de changer le builder en cours de route si nécessaire.
    def builder=(builder)
      @builder = builder
    end

    # Recette A — configuration la plus simple.
    def build_minimal(**opts)
      @builder.reset
      @builder.step_a(**opts)
    end

    # Recette B — configuration complète.
    def build_full(**opts)
      @builder.reset
      @builder.step_a(**opts)
      @builder.step_b(**opts)
      @builder.step_c(**opts)
    end

    # Recette C — configuration spécifique au domaine.
    # Ajouter ici les recettes métier réutilisables.
    def build_custom(**opts)
      @builder.reset
      @builder.step_a(**opts)
      @builder.step_c(**opts)
    end
  end
end
```

# Utilisation dans un service ou controller

```ruby
# Avec Director (recette réutilisable)
builder  = {Domain}s::{ConcreteA}{Builder}.new
director = {Domain}s::{Director}.new(builder)

director.build_full(param_a: 'valeur', param_b: 42)
result = builder.get_result

# Avec chaînage direct (sans Director — pour des constructions uniques)
result = {Domain}s::{ConcreteA}{Builder}.new
           .step_a(param_a: 'valeur')
           .step_c(param_c: true)
           .get_result

# Changer de representation avec le même Director
builder_b = {Domain}s::{ConcreteB}{Builder}.new
director.builder = builder_b
director.build_full(param_a: 'valeur', param_b: 42)
result_b = builder_b.get_result
# Même recette, représentation différente.
```

# Ajouter une nouvelle représentation (OCP)

```ruby
# 1. Nouveau ConcreteBuilder
class {ConcreteC}{Builder}
  include {Builder}Interface
  def reset  = (@product = {ProductC}.new; self)
  def step_a(**opts) = (@product.part_a = ...; self)
  def step_b(**opts) = (@product.part_b = ...; self)
  def step_c(**opts) = (@product.part_c = ...; self)
  def get_result = (product = @product; reset; product)
end

# 2. Passer au Director existant — aucune modification du Director
director.builder = {Domain}s::{ConcreteC}{Builder}.new
director.build_full(**opts)
result_c = director.instance_variable_get(:@builder).get_result
```

# Règles à respecter

- `reset` doit toujours être appelé avant de commencer une construction,
  et après `get_result` — évite de réutiliser accidentellement un produit
  précédent.
- Chaque étape retourne `self` pour permettre le chaînage fluent —
  convention importante pour la lisibilité.
- `get_result` n'est PAS dans l'interface Builder — les produits concrets
  peuvent avoir des types et interfaces très différents.
- Le Director ne connaît que l'interface Builder, jamais les ConcreteBuilders
  ni les types de produits — c'est le client qui récupère le résultat
  directement depuis le Builder.