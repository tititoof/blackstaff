---
type: Example
title: Adapter — exemple SDK tiers (Stripe, Twilio)
tags: [adapter, sdk, stripe, twilio, rails, laravel, symfony]
---

# Application du pattern sur un SDK de paiement Stripe

L'Adapter encapsule le SDK Stripe et expose l'interface `PaymentGateway`
de ton application — le reste du code ne connaît jamais Stripe directement.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Target}` | `PaymentGateway` |
| `{Adapter}` | `StripeAdapter` |
| `{Adaptee}` | `Stripe\StripeClient` (SDK officiel) |
| Méthode Target | `charge(amount, currency, source)` |
| Méthode Adaptee | `$stripe->paymentIntents->create([...])` |

# Rails

```ruby
# app/interfaces/payment_gateway_interface.rb
module PaymentGatewayInterface
  def charge(amount:, currency:, source:)  = raise NotImplementedError
  def refund(transaction_id:, amount: nil) = raise NotImplementedError
  def status(transaction_id:)              = raise NotImplementedError
end

# app/adapters/stripe_adapter.rb
class StripeAdapter
  include PaymentGatewayInterface

  def initialize(stripe_client = nil)
    @stripe = stripe_client || Stripe::StripeClient.new(ENV.fetch('STRIPE_SECRET_KEY'))
  end

  def charge(amount:, currency:, source:)
    intent = @stripe.payment_intents.create(
      amount:               (amount * 100).to_i,  # ← Stripe attend des centimes
      currency:             currency.downcase,
      payment_method:       source,
      confirm:              true,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' }
    )
    translate_intent(intent)
  rescue Stripe::CardError => e
    raise PaymentDeclinedError, e.message        # ← exception du domaine
  rescue Stripe::InvalidRequestError => e
    raise PaymentInvalidError, e.message
  rescue Stripe::StripeError => e
    raise PaymentGatewayError, e.message
  end

  def refund(transaction_id:, amount: nil)
    params = { payment_intent: transaction_id }
    params[:amount] = (amount * 100).to_i if amount
    refund = @stripe.refunds.create(params)
    { id: refund.id, status: refund.status }
  rescue Stripe::StripeError => e
    raise PaymentGatewayError, e.message
  end

  def status(transaction_id:)
    intent = @stripe.payment_intents.retrieve(transaction_id)
    intent.status
  rescue Stripe::StripeError => e
    raise PaymentGatewayError, e.message
  end

  private

  def translate_intent(intent)
    {
      id:             intent.id,
      status:         intent.status,
      amount:         intent.amount / 100.0,   # ← retour en euros
      currency:       intent.currency.upcase,
      client_secret:  intent.client_secret,
    }
  end
end
```

# Laravel

```php
// app/Adapters/StripeAdapter.php
class StripeAdapter implements PaymentGatewayInterface
{
    private readonly StripeClient $stripe;

    public function __construct(?StripeClient $stripe = null)
    {
        $this->stripe = $stripe ?? new StripeClient(config('services.stripe.secret'));
    }

    public function charge(array $args): array
    {
        ['amount' => $amount, 'currency' => $currency, 'source' => $source] = $args;

        try {
            $intent = $this->stripe->paymentIntents->create([
                'amount'               => (int) round($amount * 100),
                'currency'             => strtolower($currency),
                'payment_method'       => $source,
                'confirm'              => true,
                'automatic_payment_methods' => ['enabled' => true, 'allow_redirects' => 'never'],
            ]);

            return $this->translateIntent($intent);

        } catch (CardException $e) {
            throw new PaymentDeclinedException($e->getMessage(), previous: $e);
        } catch (InvalidRequestException $e) {
            throw new PaymentInvalidException($e->getMessage(), previous: $e);
        } catch (ApiErrorException $e) {
            throw new PaymentGatewayException($e->getMessage(), previous: $e);
        }
    }

    public function refund(array $args): array
    {
        ['transaction_id' => $txId] = $args;
        $params = ['payment_intent' => $txId];
        if (isset($args['amount'])) $params['amount'] = (int) round($args['amount'] * 100);

        try {
            $refund = $this->stripe->refunds->create($params);
            return ['id' => $refund->id, 'status' => $refund->status];
        } catch (ApiErrorException $e) {
            throw new PaymentGatewayException($e->getMessage(), previous: $e);
        }
    }

    public function status(array $args): array
    {
        $intent = $this->stripe->paymentIntents->retrieve($args['transaction_id']);
        return ['status' => $intent->status];
    }

    private function translateIntent(PaymentIntent $intent): array
    {
        return [
            'id'            => $intent->id,
            'status'        => $intent->status,
            'amount'        => $intent->amount / 100,
            'currency'      => strtoupper($intent->currency),
            'client_secret' => $intent->client_secret,
        ];
    }
}
```

# Symfony

```php
// src/Adapter/StripePaymentAdapter.php
class StripePaymentAdapter implements PaymentGatewayInterface
{
    public function __construct(
        private readonly StripeClient    $stripe,
        private readonly LoggerInterface $logger,
    ) {}

    public function charge(array $args): array
    {
        $this->logger->info('[StripeAdapter] Charging', ['amount' => $args['amount']]);
        try {
            $intent = $this->stripe->paymentIntents->create([
                'amount'         => (int) round($args['amount'] * 100),
                'currency'       => strtolower($args['currency']),
                'payment_method' => $args['source'],
                'confirm'        => true,
                'automatic_payment_methods' => ['enabled' => true, 'allow_redirects' => 'never'],
            ]);
            return ['id' => $intent->id, 'status' => $intent->status,
                    'amount' => $intent->amount / 100];
        } catch (\Stripe\Exception\CardException $e) {
            throw new PaymentDeclinedException($e->getMessage(), previous: $e);
        } catch (\Stripe\Exception\ApiErrorException $e) {
            throw new PaymentGatewayException($e->getMessage(), previous: $e);
        }
    }
    // ...
}
```

```yaml
# config/services.yaml
services:
    Stripe\StripeClient:
        arguments: ['%env(STRIPE_SECRET_KEY)%']

    App\Port\PaymentGatewayInterface:
        alias: App\Adapter\StripePaymentAdapter
```

# Ce que l'Adapter ajoute sur le SDK brut

1. **Interface uniforme** — `charge(amount, currency, source)` au lieu de
   `paymentIntents->create(['amount' => ..., 'currency' => ..., 'payment_method' => ..., 'confirm' => true, ...])`
2. **Conversion d'unités** — euros ↔ centimes traduits de façon invisible
3. **Normalisation des exceptions** — `Stripe::CardError` → `PaymentDeclinedError`
   (exception du domaine, pas du SDK)
4. **Interchangeabilité** — swapper Stripe pour PayPal = remplacer l'Adapter,
   pas 50 appels `paymentIntents->create(...)` dans tout le code