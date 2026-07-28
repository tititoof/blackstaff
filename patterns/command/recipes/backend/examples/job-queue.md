---
type: Example
title: Command — exemple Jobs (Sidekiq, Horizon, Messenger)
tags: [command, jobs, sidekiq, horizon, messenger, rails, laravel, symfony]
---

# Les jobs SONT des Commands

Un job est exactement une Command GoF sérialisée : il encapsule une action
(`execute`/`perform`/`__invoke`) avec ses paramètres, est mis en file,
et exécuté par un worker plus tard.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Command}` | `ProcessOrderJob` / `ProcessOrderJob` / `ProcessOrderMessage` |
| `{Receiver}` | `OrderService` |
| Action | `processPayment(orderId)` |

# Rails — Sidekiq (via ActiveJob)

```ruby
# app/jobs/process_order_job.rb
class ProcessOrderJob < ApplicationJob
  queue_as :default

  # Paramètres de la Command — sérialisés dans Redis
  # Toujours passer des ids scalaires, jamais des objets ActiveRecord entiers
  def perform(order_id:, user_id:)
    order = Order.find(order_id)
    user  = User.find(user_id)

    OrderService.new.process_payment(order: order, user: user)
  rescue ActiveRecord::RecordNotFound => e
    # L'enregistrement a été supprimé entre la mise en file et l'exécution
    logger.warn("[ProcessOrderJob] Record not found: #{e.message}")
    # Ne pas rejouer — lever une exception non-retriable
    raise ActiveJob::DeserializationError
  rescue PaymentGatewayError => e
    # Erreur réseau/gateway — rejouer automatiquement
    logger.error("[ProcessOrderJob] Payment failed: #{e.message}")
    raise  # Sidekiq retente automatiquement
  end

  # Appelé après tous les retries épuisés
  def self.discard_on(exception)
    logger.error("[ProcessOrderJob] Discarded after retries: #{exception.message}")
    # Alerting, notification admin...
  end
end

# Dispatching
ProcessOrderJob.perform_later(order_id: order.id, user_id: current_user.id)
ProcessOrderJob.set(wait: 5.minutes).perform_later(order_id: order.id, user_id: user.id)
ProcessOrderJob.set(queue: 'critical').perform_later(order_id: order.id, user_id: user.id)
```

# Laravel — Horizon/Queue (Job comme Command)

```php
// app/Jobs/ProcessOrderJob.php
class ProcessOrderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 120;
    public int $backoff = 60;   // secondes entre les retries

    public function __construct(
        // SerializesModels : stocke l'id, recharge depuis la DB à l'exécution
        public readonly int $orderId,
        public readonly int $userId,
    ) {}

    public function handle(OrderService $orderService): void
    {
        $order = Order::findOrFail($this->orderId);
        $user  = User::findOrFail($this->userId);

        $orderService->processPayment(order: $order, user: $user);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('[ProcessOrderJob] Failed', [
            'order_id' => $this->orderId,
            'error'    => $exception->getMessage(),
        ]);
        // Notification, compensation, annulation...
        Order::find($this->orderId)?->update(['status' => 'payment_failed']);
    }

    // Idempotence — ne pas retraiter une commande déjà payée
    public function middleware(): array
    {
        return [new WithoutOverlapping($this->orderId)];
    }
}

// Dispatching
ProcessOrderJob::dispatch($order->id, $user->id);
ProcessOrderJob::dispatch($order->id, $user->id)->delay(now()->addMinutes(5));
ProcessOrderJob::dispatch($order->id, $user->id)->onQueue('payments');
```

# Symfony — Messenger (Message comme Command)

```php
// src/Message/ProcessOrderMessage.php
final class ProcessOrderMessage
{
    public function __construct(
        public readonly int $orderId,
        public readonly int $userId,
        public readonly \DateTimeImmutable $dispatchedAt = new \DateTimeImmutable(),
    ) {}
}

// src/Handler/ProcessOrderMessageHandler.php
class ProcessOrderMessageHandler implements MessageHandlerInterface
{
    public function __construct(
        private readonly OrderService      $orderService,
        private readonly OrderRepository   $orderRepository,
        private readonly LoggerInterface   $logger,
    ) {}

    public function __invoke(ProcessOrderMessage $message): void
    {
        $order = $this->orderRepository->find($message->orderId);
        if (!$order) {
            $this->logger->warning('[ProcessOrderHandler] Order not found', [
                'order_id' => $message->orderId,
            ]);
            return;  // Silencieux — l'ordre a été supprimé, pas une erreur
        }

        $this->orderService->processPayment($order, $message->userId);
    }
}

// config/packages/messenger.yaml
// routing:
//   'App\Message\ProcessOrderMessage': async

// Dispatching
$this->commandBus->dispatch(new ProcessOrderMessage(
    orderId: $order->getId(),
    userId:  $this->getUser()->getId(),
));
```

# Idempotence — règle critique pour tous les jobs

Un job peut être rejoué plusieurs fois (retry, redémarrage du worker).
Vérifier systématiquement si l'action a déjà été effectuée avant de l'exécuter :

```ruby
# Rails — vérification d'idempotence
def perform(order_id:, **)
  order = Order.find(order_id)
  return if order.payment_processed?   # déjà traité — sortir silencieusement
  order.process_payment!
end
```

```php
// Laravel — WithoutOverlapping évite les exécutions concurrentes
// Pour une idempotence stricte :
public function handle(OrderService $orderService): void
{
    $order = Order::findOrFail($this->orderId);
    if ($order->payment_processed) return;  // idempotent
    $orderService->processPayment(order: $order);
}
```