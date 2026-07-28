---
type: Example
title: Strategy — exemple Calcul de prix
tags: [strategy, pricing, rails, laravel, symfony]
---

# Application du pattern sur un calcul de prix

Trois stratégies de tarification interchangeables selon le profil du
client — même appel, tarif différent. Le contexte `PriceCalculator`
délègue sans jamais connaître les règles de chaque tarif.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Domain}` | `Pricing` |
| `{Strategy}` | `PricingStrategy` |
| `{Context}` | `PriceCalculator` |
| `{ConcreteA}` | `Standard` |
| `{ConcreteB}` | `Promotional` |
| `{ConcreteC}` | `B2b` |
| Méthode commune | `execute(product:, quantity:, customer:)` |
| Retour | `{ unit_price:, total:, discount_rate:, label: }` |

# Rails — implémentation concrète

```ruby
# app/strategies/pricings/base_pricing_strategy.rb
module Pricings
  module BasePricingStrategy
    def execute(product:, quantity:, customer:)
      raise NotImplementedError
    end
  end
end

# app/strategies/pricings/standard_pricing_strategy.rb
module Pricings
  class StandardPricingStrategy
    include BasePricingStrategy

    def execute(product:, quantity:, customer:)
      unit_price = product.base_price
      {
        unit_price:    unit_price,
        total:         unit_price * quantity,
        discount_rate: 0,
        label:         'Prix standard',
      }
    end
  end
end

# app/strategies/pricings/promotional_pricing_strategy.rb
module Pricings
  class PromotionalPricingStrategy
    include BasePricingStrategy

    DISCOUNT = 0.20  # 20% de remise

    def execute(product:, quantity:, customer:)
      unit_price     = product.base_price * (1 - DISCOUNT)
      {
        unit_price:    unit_price.round(2),
        total:         (unit_price * quantity).round(2),
        discount_rate: DISCOUNT,
        label:         'Prix promotionnel (-20%)',
      }
    end
  end
end

# app/strategies/pricings/b2b_pricing_strategy.rb
module Pricings
  class B2bPricingStrategy
    include BasePricingStrategy

    def execute(product:, quantity:, customer:)
      # Remise dégressive selon la quantité commandée
      discount = case quantity
                 when 1..9    then 0.10
                 when 10..49  then 0.15
                 else              0.20
                 end
      # Remise supplémentaire selon le contrat client
      discount += customer.extra_discount if customer.respond_to?(:extra_discount)

      unit_price = product.base_price * (1 - discount)
      {
        unit_price:    unit_price.round(2),
        total:         (unit_price * quantity).round(2),
        discount_rate: discount,
        label:         "Prix B2B (-#{(discount * 100).to_i}%)",
      }
    end
  end
end

# app/strategies/pricings/pricing_strategy_resolver.rb
module Pricings
  class PricingStrategyResolver
    STRATEGIES = {
      'standard'    => StandardPricingStrategy,
      'promotional' => PromotionalPricingStrategy,
      'b2b'         => B2bPricingStrategy,
    }.freeze

    def self.resolve(type)
      klass = STRATEGIES[type.to_s]
      raise ArgumentError, "Stratégie de prix inconnue : #{type}" unless klass
      klass.new
    end

    # Résolution automatique selon le profil du client
    def self.resolve_for(customer)
      type = if customer.b2b?         then 'b2b'
             elsif customer.promo?    then 'promotional'
             else                          'standard'
             end
      resolve(type)
    end
  end
end

# app/services/price_calculator.rb
class PriceCalculator
  def initialize(strategy:)
    @strategy = strategy
  end

  def calculate(product:, quantity:, customer:)
    @strategy.execute(product: product, quantity: quantity, customer: customer)
  end
end
```

```ruby
# Utilisation dans un controller
def quote
  product  = Product.find(params[:product_id])
  customer = Current.user

  calculator = PriceCalculator.new(
    strategy: Pricings::PricingStrategyResolver.resolve_for(customer)
  )

  pricing = calculator.calculate(
    product:  product,
    quantity: params[:quantity].to_i,
    customer: customer
  )

  render json: pricing
end
```

# Laravel — implémentation concrète

```php
// app/Strategies/Pricings/Contracts/PricingStrategyInterface.php
interface PricingStrategyInterface
{
    public function execute(array $args): array;
    // $args = ['product' => Product, 'quantity' => int, 'customer' => User]
    // Retour = ['unit_price' => float, 'total' => float, 'discount_rate' => float, 'label' => string]
}

// app/Strategies/Pricings/StandardPricingStrategy.php
class StandardPricingStrategy implements PricingStrategyInterface
{
    public function execute(array $args): array
    {
        ['product' => $product, 'quantity' => $qty] = $args;
        return [
            'unit_price'    => $product->base_price,
            'total'         => $product->base_price * $qty,
            'discount_rate' => 0,
            'label'         => 'Prix standard',
        ];
    }
}

// app/Strategies/Pricings/B2bPricingStrategy.php
class B2bPricingStrategy implements PricingStrategyInterface
{
    public function execute(array $args): array
    {
        ['product' => $product, 'quantity' => $qty, 'customer' => $customer] = $args;
        $discount = match(true) {
            $qty < 10  => 0.10,
            $qty < 50  => 0.15,
            default    => 0.20,
        };
        $discount += $customer->extra_discount ?? 0;
        $unitPrice = round($product->base_price * (1 - $discount), 2);
        return [
            'unit_price'    => $unitPrice,
            'total'         => round($unitPrice * $qty, 2),
            'discount_rate' => $discount,
            'label'         => 'Prix B2B (-'.($discount * 100).'%)',
        ];
    }
}

// app/Services/PriceCalculator.php
class PriceCalculator
{
    public function __construct(private PricingStrategyInterface $strategy) {}

    public function setStrategy(PricingStrategyInterface $strategy): void
    {
        $this->strategy = $strategy;
    }

    public function calculate(Product $product, int $qty, User $customer): array
    {
        return $this->strategy->execute([
            'product'  => $product,
            'quantity' => $qty,
            'customer' => $customer,
        ]);
    }
}
```

# Symfony — avec tagged services

```php
// src/Strategy/Pricing/PricingStrategyInterface.php
interface PricingStrategyInterface
{
    public function execute(array $args): array;
    public function supports(string $type): bool;
}

// src/Strategy/Pricing/B2bPricingStrategy.php
class B2bPricingStrategy implements PricingStrategyInterface
{
    public function supports(string $type): bool { return $type === 'b2b'; }

    public function execute(array $args): array
    {
        ['product' => $product, 'quantity' => $qty, 'customer' => $customer] = $args;
        $discount = match(true) { $qty < 10 => 0.10, $qty < 50 => 0.15, default => 0.20 };
        $unitPrice = round($product->getBasePrice() * (1 - $discount), 2);
        return ['unit_price' => $unitPrice, 'total' => $unitPrice * $qty,
                'discount_rate' => $discount, 'label' => "Prix B2B"];
    }
}

// config/services.yaml
// _instanceof: App\Strategy\Pricing\PricingStrategyInterface:
//   tags: ['app.pricing.strategy']
```

# Différence Strategy vs if/else

```ruby
# ❌ Sans Strategy — conditions dispersées dans le controller
def quote
  if current_user.b2b?
    price = product.base_price * 0.85
  elsif current_user.promo?
    price = product.base_price * 0.80
  else
    price = product.base_price
  end
  # Chaque nouvelle règle tarifaire = modifier ce controller
end

# ✅ Avec Strategy — le controller ne connaît plus les règles
def quote
  calculator = PriceCalculator.new(
    strategy: Pricings::PricingStrategyResolver.resolve_for(current_user)
  )
  render json: calculator.calculate(product: product, quantity: qty, customer: current_user)
  # Nouvelle règle tarifaire = nouvelle classe, controller inchangé
end
```