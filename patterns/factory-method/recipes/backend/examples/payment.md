---
type: Example
title: Factory Method — exemple Paiement (Stripe, PayPal, Virement)
tags: [factory-method, payment, rails, laravel, symfony]
---

# Application du pattern sur un service de paiement

Cet exemple applique la recipe générique
[Rails](/patterns/factory-method/recipes/backend/rails-factory-method.md) /
[Laravel](/patterns/factory-method/recipes/backend/laravel-factory-method.md) /
[Symfony](/patterns/factory-method/recipes/backend/symfony-factory-method.md)
au cas concret d'un service de paiement avec 3 providers :
Stripe, PayPal, Virement bancaire.

# Correspondance avec les placeholders génériques

| Placeholder | Valeur concrète |
|---|---|
| `{Domain}` | `Payment` |
| `{Product}` | `PaymentGateway` |
| `{Creator}` | `PaymentProcessor` |
| `{ConcreteA}` | `Stripe` |
| `{ConcreteB}` | `Paypal` |
| `{ConcreteC}` | `Virement` |
| Méthode du produit | `charge(amount, currency, source)` |
| Variable d'env | `PAYMENT_PROVIDER` |

# Interface Produit

Le Produit abstrait expose trois méthodes communes à tous les gateways :

```
charge(amount, currency, source) → résultat de la transaction
refund(transactionId, amount?)   → annulation
status(transactionId)            → état de la transaction
```

# Particularité Stripe

Stripe requiert les montants en centimes (pas en euros entiers) —
le Créateur concret `StripePaymentProcessor` surcharge `execute()` pour
multiplier `amount × 100` avant d'appeler `super.execute()`. C'est le
seul Créateur qui surcharge la méthode d'exécution dans cet exemple.

# Rails — nommage concret

```
app/services/payments/
├── base_payment_gateway.rb
├── stripe_payment_gateway.rb
├── paypal_payment_gateway.rb
├── virement_payment_gateway.rb
├── base_payment_processor.rb
│     └── def create_payment_gateway → raise NotImplementedError
│     └── def execute(amount:, currency:, source:, order_id:)
├── stripe_payment_processor.rb
│     └── def create_payment_gateway → StripePaymentGateway.new
│     └── def execute(**args) → super(**args.merge(amount: args[:amount] * 100))
├── paypal_payment_processor.rb
│     └── def create_payment_gateway → PaypalPaymentGateway.new
├── virement_payment_processor.rb
│     └── def create_payment_gateway → VirementPaymentGateway.new
└── payment_processor_resolver.rb
      └── IMPLEMENTATIONS = { 'stripe' => ..., 'paypal' => ..., 'virement' => ... }
```

# Laravel — nommage concret

```
app/Services/Payments/
├── Contracts/PaymentGatewayInterface.php
│     └── charge(int $amount, string $currency, string $source): array
│     └── refund(string $transactionId, ?int $amount): array
│     └── status(string $transactionId): string
├── Products/StripeGateway.php, PaypalGateway.php, VirementGateway.php
├── Creators/AbstractPaymentProcessor.php
│     └── abstract protected function createPaymentGateway(): PaymentGatewayInterface
│     └── public function execute(array $args): array
├── Creators/StripePaymentProcessor.php
│     └── createPaymentGateway() → app(StripeGateway::class)
│     └── execute(['amount' => ...]) → parent::execute(['amount' => $args['amount'] * 100, ...])
├── Creators/PaypalPaymentProcessor.php, VirementPaymentProcessor.php
└── PaymentProcessorFactory.php
      └── config: config/payments.php → payment.provider
```

# Symfony — nommage concret

```
src/Service/Payment/
├── Product/PaymentGatewayInterface.php
├── Product/StripeGateway.php, PaypalGateway.php, VirementGateway.php
├── Creator/AbstractPaymentProcessor.php
│     └── abstract protected function createPaymentGateway(): PaymentGatewayInterface
├── Creator/StripePaymentProcessor.php
│     └── __construct(StripeGateway $stripeGateway, LoggerInterface $logger)
│     └── createPaymentGateway() → $this->stripeGateway
├── Creator/PaypalPaymentProcessor.php, VirementPaymentProcessor.php

# config/services.yaml
# parameters: payment_provider: '%env(PAYMENT_PROVIDER)%'
# alias: Abstract{Creator} → '%payment_provider%PaymentProcessor'
```

# Endpoint API attendu

```
POST /api/payments
Body: { amount: 4999, currency: "EUR", source: "tok_...", order_id: 42 }
Response: { transaction_id: "pi_...", status: "succeeded" }
```

# Tests à écrire

```
- StripePaymentGateway#charge → mock Stripe SDK, vérifier les centimes
- PaypalPaymentGateway#charge → mock PayPal API
- BasePaymentProcessor#execute → mock gateway, vérifier validate! + after_execute
- StripePaymentProcessor → vérifier la conversion amount * 100
- PaymentProcessorResolver → résout le bon Créateur selon l'env
```