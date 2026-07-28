---
type: Recipe
title: Adapter Rails — générique
tags: [rails, backend, adapter, design-pattern]
---

# Quand utiliser ce pattern

Intégrer un SDK tiers, un système legacy ou un format externe en exposant
l'interface attendue par ton application — sans coupler le code applicatif
à l'API du tiers.

Exemples concrets :
- [SDK tiers (Stripe, Twilio...)](/patterns/adapter/recipes/backend/examples/sdk-adapter.md)
- [Système legacy](/patterns/adapter/recipes/backend/examples/legacy-adapter.md)
- [Adaptateur de format](/patterns/adapter/recipes/backend/examples/format-adapter.md)

# Dépendances

- [Conventions Rails générales](/frameworks/rails.md)
- [Rails 8 — chemins](/frameworks/rails/v8.md)

# Structure des fichiers

```
app/adapters/
└── {adapter}.rb                ← Adapter par composition (recommandé)
app/interfaces/
└── {target}_interface.rb       ← Interface Target (module Ruby)
```

# Interface Target (ce que ton app attend)

```ruby
# app/interfaces/{target}_interface.rb
module {Target}Interface
  def {method_a}(**args)
    raise NotImplementedError, "#{self.class} doit implémenter #{__method__}"
  end

  def {method_b}(**args)
    raise NotImplementedError, "#{self.class} doit implémenter #{__method__}"
  end
end
```

# Adapter par composition (recommandé)

```ruby
# app/adapters/{adapter}.rb
class {Adapter}
  include {Target}Interface

  def initialize(adaptee = nil)
    # L'Adaptee peut être injecté (testabilité) ou instancié ici
    @adaptee = adaptee || build_adaptee
  end

  # Traduit l'appel Target vers l'API de l'Adaptee
  def {method_a}(**args)
    # Transformer les arguments du format Target vers le format Adaptee
    adaptee_args = translate_args_to_adaptee(args)

    # Appeler l'Adaptee
    raw_result = @adaptee.{adaptee_method}(adaptee_args)

    # Transformer le résultat du format Adaptee vers le format Target
    translate_result_to_target(raw_result)
  end

  def {method_b}(**args)
    raw_result = @adaptee.{other_adaptee_method}(**translate_args_to_adaptee(args))
    translate_result_to_target(raw_result)
  end

  private

  def build_adaptee
    # Instanciation de l'Adaptee avec sa propre configuration
    {Adaptee}.new(
      api_key: ENV.fetch('{ADAPTEE}_API_KEY'),
      # autres options spécifiques à l'Adaptee
    )
  end

  def translate_args_to_adaptee(args)
    # Convertir les arguments du format unifié vers le format propriétaire
    # ex: { amount: 1999 } → { amount: 199900, currency: 'eur' }
  end

  def translate_result_to_target(raw)
    # Convertir le résultat propriétaire vers le format unifié
    # ex: Stripe::PaymentIntent → { id: '...', status: 'succeeded', amount: 1999 }
    {
      id:     raw.id,
      status: raw.status,
      # normalisation du format...
    }
  end
end
```

# Utilisation dans le code applicatif

```ruby
# Le code applicatif ne connaît que {Target}Interface
# Il peut utiliser n'importe quel Adapter interchangeable

class PaymentService
  def initialize(gateway: nil)
    # Injecter l'Adapter ou le résoudre depuis la config
    @gateway = gateway || build_default_gateway
  end

  def process(order:, token:)
    @gateway.{method_a}(amount: order.total, source: token)
  end

  private

  def build_default_gateway
    case ENV.fetch('PAYMENT_PROVIDER', 'stripe')
    when 'stripe'  then {Adapter}.new
    when 'paypal'  then PaypalAdapter.new
    else raise "Provider inconnu"
    end
  end
end
```

# Règles à respecter

- L'Adapter **ne contient que de la traduction** — pas de logique métier.
  Si la traduction devient complexe, extraire dans un `Translator` dédié.
- Toujours injecter l'Adaptee dans le constructeur pour les tests —
  évite les appels réels au SDK en test unitaire.
- Normaliser les exceptions : les exceptions propriétaires de l'Adaptee
  (`Stripe::CardError`) doivent être catchées dans l'Adapter et
  transformées en exceptions du domaine de ton app.