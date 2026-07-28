---
type: Recipe
title: Decorator Rails — générique
tags: [rails, backend, decorator, design-pattern]
---

# Quand utiliser ce pattern

Enrichir un objet (service, repository, client API) avec des responsabilités
transversales (logging, cache, retry, métriques) sans modifier sa classe
originale ni créer de sous-classes.

Exemples concrets :
- [Logging d'un service](/patterns/decorator/recipes/backend/examples/logging.md)
- [Cache d'un service](/patterns/decorator/recipes/backend/examples/caching.md)
- [Middlewares comme Decorators](/patterns/decorator/recipes/backend/examples/middleware.md)

# Dépendances

- [Conventions Rails générales](/frameworks/rails.md)
- [Rails 8 — chemins](/frameworks/rails/v8.md)

# Structure des fichiers

```
app/services/{domain}s/
├── {component}_interface.rb        ← interface commune (module)
├── {concrete_component}.rb         ← implémentation originale
├── decorators/
│   ├── base_decorator.rb           ← classe de base des decorators
│   ├── {decorator_a}_decorator.rb  ← Decorator A (logging, cache...)
│   └── {decorator_b}_decorator.rb  ← Decorator B
```

# Interface commune (module Ruby)

```ruby
# app/services/{domain}s/{component}_interface.rb
module {Domain}s
  module {Component}Interface
    def {operation}(**args)
      raise NotImplementedError, "#{self.class} doit implémenter #{__method__}"
    end
    # Déclarer toutes les méthodes de l'interface
  end
end
```

# Composant concret (l'implémentation originale)

```ruby
# app/services/{domain}s/{concrete_component}.rb
module {Domain}s
  class {ConcreteComponent}
    include {Component}Interface

    def {operation}(**args)
      # Implémentation réelle
    end
  end
end
```

# Base Decorator

```ruby
# app/services/{domain}s/decorators/base_decorator.rb
module {Domain}s
  module Decorators
    class BaseDecorator
      include {Component}Interface

      def initialize(wrapped)
        @wrapped = wrapped
      end

      # Délégation par défaut — les sous-classes surchargent uniquement
      # les méthodes qu'elles enrichissent, le reste est délégué.
      def {operation}(**args)
        @wrapped.{operation}(**args)
      end
    end
  end
end
```

# Decorator concret A (à dupliquer par couche)

```ruby
# app/services/{domain}s/decorators/{decorator_a}_decorator.rb
module {Domain}s
  module Decorators
    class {DecoratorA}Decorator < BaseDecorator
      def initialize(wrapped)
        super(wrapped)
        # Initialiser les dépendances du decorator (logger, cache...)
      end

      def {operation}(**args)
        before_{operation}(**args)         # comportement avant
        result = super(**args)             # délégation vers le composant enveloppé
        after_{operation}(result, **args)  # comportement après
        result
      end

      private

      def before_{operation}(**args)
        # Pré-traitement : log, vérification de cache, métriques...
      end

      def after_{operation}(result, **args)
        # Post-traitement : mise en cache, log du résultat...
      end
    end
  end
end
```

# Assemblage — empiler les Decorators

```ruby
# Ordre des couches : le premier Decorator enveloppé est exécuté en dernier
# (comme des poupées russes)
component = {Domain}s::{ConcreteComponent}.new
component = {Domain}s::Decorators::{DecoratorA}Decorator.new(component)
component = {Domain}s::Decorators::{DecoratorB}Decorator.new(component)

# Appel transparent — le code client ne sait pas combien de couches il y a
result = component.{operation}(**args)
```

# Assemblage via factory (recommandé pour centraliser la configuration)

```ruby
# app/services/{domain}s/{component}_factory.rb
module {Domain}s
  class {Component}Factory
    def self.build(decorators: %i[{decorator_a} {decorator_b}])
      component = {ConcreteComponent}.new
      decorators.each do |d|
        component = case d
                    when :{decorator_a} then Decorators::{DecoratorA}Decorator.new(component)
                    when :{decorator_b} then Decorators::{DecoratorB}Decorator.new(component)
                    end
      end
      component
    end
  end
end

# Utilisation
service = {Domain}s::{Component}Factory.build
service = {Domain}s::{Component}Factory.build(decorators: [:{decorator_a}]) # sans {decorator_b}
```

# Règles à respecter

- Chaque Decorator doit implémenter **toutes** les méthodes de l'interface —
  sinon la délégation par défaut de `BaseDecorator` couvre les méthodes non
  surchargées, mais l'interface n'est pas complète.
- Toujours appeler `super` pour déléguer au composant enveloppé, sauf
  cas exceptionnel (court-circuit de cache = ne pas appeler le vrai service).
- L'ordre d'empilement est important : le Decorator extérieur est exécuté
  en premier. `LoggingDecorator(CacheDecorator(service))` logge avant de
  chercher en cache ; `CacheDecorator(LoggingDecorator(service))` logge
  uniquement les appels qui passent le cache.