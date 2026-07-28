---
type: Example
title: Decorator — exemple Logging d'un service
tags: [decorator, logging, rails, laravel, symfony]
---

# Application du pattern sur un service de paiement décoré avec du logging

Ajouter du logging détaillé à un service existant sans modifier une ligne
de son code — la couche de log est encapsulée dans un Decorator.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Component}` | `PaymentService` |
| `{ConcreteComponent}` | `StripePaymentService` |
| `{DecoratorA}` | `Logging` |
| Méthodes décorées | `charge(amount, currency, source)`, `refund(transactionId)` |

# Rails

```ruby
# app/services/payments/decorators/logging_decorator.rb
module Payments
  module Decorators
    class LoggingDecorator < BaseDecorator
      def initialize(wrapped)
        super
        @logger = Rails.logger
      end

      def charge(amount:, currency:, source:)
        @logger.info("[Payment] Charging #{amount} #{currency}", source: source)
        start = Process.clock_gettime(Process::CLOCK_MONOTONIC)

        result = super(amount: amount, currency: currency, source: source)

        duration = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start) * 1000).round(2)
        @logger.info("[Payment] Charge success in #{duration}ms",
                     transaction_id: result[:transaction_id])
        result
      rescue => e
        @logger.error("[Payment] Charge failed: #{e.message}",
                      amount: amount, currency: currency)
        raise
      end

      def refund(transaction_id:, amount: nil)
        @logger.info("[Payment] Refunding #{transaction_id}", amount: amount)
        result = super(transaction_id: transaction_id, amount: amount)
        @logger.info("[Payment] Refund success", result: result)
        result
      rescue => e
        @logger.error("[Payment] Refund failed: #{e.message}")
        raise
      end
    end
  end
end

# Assemblage
service = Payments::StripePaymentService.new
service = Payments::Decorators::LoggingDecorator.new(service)
result  = service.charge(amount: 4999, currency: 'EUR', source: 'tok_...')
# → logs automatiquement sans toucher à StripePaymentService
```

# Laravel

```php
// app/Services/Payments/Decorators/LoggingPaymentDecorator.php
class LoggingPaymentDecorator extends AbstractPaymentDecorator
{
    public function __construct(
        PaymentServiceInterface $wrapped,
        private readonly LoggerInterface $logger,
    ) {
        parent::__construct($wrapped);
    }

    public function charge(int $amount, string $currency, string $source): array
    {
        $this->logger->info('[Payment] Charging', [
            'amount' => $amount, 'currency' => $currency,
        ]);
        $startTime = microtime(true);

        try {
            $result = parent::charge($amount, $currency, $source);
            $this->logger->info('[Payment] Charge success', [
                'duration_ms'    => round((microtime(true) - $startTime) * 1000, 2),
                'transaction_id' => $result['transaction_id'],
            ]);
            return $result;
        } catch (\Throwable $e) {
            $this->logger->error('[Payment] Charge failed', [
                'error'    => $e->getMessage(),
                'amount'   => $amount,
                'currency' => $currency,
            ]);
            throw $e;
        }
    }

    public function refund(string $transactionId, ?int $amount = null): array
    {
        $this->logger->info('[Payment] Refunding', ['transaction_id' => $transactionId]);
        try {
            $result = parent::refund($transactionId, $amount);
            $this->logger->info('[Payment] Refund success');
            return $result;
        } catch (\Throwable $e) {
            $this->logger->error('[Payment] Refund failed', ['error' => $e->getMessage()]);
            throw $e;
        }
    }
}

// app/Providers/AppServiceProvider.php
$this->app->bind(PaymentServiceInterface::class, function () {
    $service = app(StripePaymentService::class);
    return new LoggingPaymentDecorator($service, app(LoggerInterface::class));
});
```

# Symfony

```php
// src/Service/Payment/Decorator/LoggingPaymentService.php
class LoggingPaymentService implements PaymentServiceInterface
{
    public function __construct(
        private readonly PaymentServiceInterface $inner,
        private readonly LoggerInterface         $logger,
    ) {}

    public function charge(int $amount, string $currency, string $source): array
    {
        $this->logger->info('[Payment] Charging', ['amount' => $amount, 'currency' => $currency]);
        $start = microtime(true);

        try {
            $result = $this->inner->charge($amount, $currency, $source);
            $this->logger->info('[Payment] Charge success', [
                'duration_ms' => round((microtime(true) - $start) * 1000, 2),
                'tx_id'       => $result['transaction_id'],
            ]);
            return $result;
        } catch (\Throwable $e) {
            $this->logger->error('[Payment] Charge failed', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function refund(string $transactionId, ?int $amount = null): array
    {
        $this->logger->info('[Payment] Refunding');
        $result = $this->inner->refund($transactionId, $amount);
        $this->logger->info('[Payment] Refund success');
        return $result;
    }
}
```

```yaml
# config/services.yaml
services:
    App\Service\Payment\Decorator\LoggingPaymentService:
        decorates: App\Service\Payment\PaymentServiceInterface
        arguments:
            $inner: '@.inner'
```

# Ce que le Logging Decorator capture systématiquement

- Entrée : paramètres pertinents (montant, devise — jamais le token complet)
- Durée d'exécution en ms
- Succès : identifiant de transaction retourné
- Échec : message d'erreur + paramètres (sans données sensibles)

# Important : données sensibles

Ne jamais logger `$source` (token de carte bancaire) ni `$source` brut —
seulement les métadonnées non sensibles. Dans l'exemple Rails, `source:` est
dans les logs à des fins illustratives — en production, le remplacer par
`source_type: 'card'` ou les 4 derniers chiffres uniquement.