---
type: Example
title: Observer Laravel — exemple Model Observer & Events
tags: [laravel, backend, observer, eloquent, events]
---

# Application du pattern sur un modèle Order

Observer le cycle de vie d'une commande pour déclencher emails,
mise à jour du stock et audit — de façon découplée.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Subject}` | `Order` |
| `{Event}` | `OrderCreated`, `OrderStatusChanged` |
| `{ObserverA}` | `SendOrderConfirmationEmail` (Listener) |
| `{ObserverB}` | `ReserveStock` (Listener) |
| `{ObserverC}` | `LogOrderAudit` (Listener) |

# Approche 1 — Model Observer (cycle de vie Eloquent)

```php
// app/Observers/OrderObserver.php
// php artisan make:observer OrderObserver --model=Order
class OrderObserver
{
    public function created(Order $order): void
    {
        // Déclencher plusieurs Observateurs via des jobs
        SendOrderConfirmationEmail::dispatch($order)->afterCommit();
        ReserveStock::dispatch($order)->afterCommit();
    }

    public function updated(Order $order): void
    {
        if ($order->wasChanged('status')) {
            OrderStatusChanged::dispatch(
                $order,
                $order->getOriginal('status'),
                $order->status
            );
        }
    }

    public function deleted(Order $order): void
    {
        ReleaseStock::dispatch($order)->afterCommit();
    }
}

// app/Providers/AppServiceProvider.php
public function boot(): void
{
    Order::observe(OrderObserver::class);
}
```

# Approche 2 — Events & Listeners (plus découplé, recommandé pour la logique métier)

```php
// app/Events/OrderCreated.php
class OrderCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Order $order,
    ) {}
}

// app/Events/OrderStatusChanged.php
class OrderStatusChanged
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Order  $order,
        public readonly string $oldStatus,
        public readonly string $newStatus,
    ) {}
}

// app/Listeners/SendOrderConfirmationEmail.php
class SendOrderConfirmationEmail implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(OrderCreated $event): void
    {
        Mail::to($event->order->customer->email)
            ->send(new OrderConfirmationMail($event->order));
    }

    // Retry automatique si le mailer échoue
    public int $tries = 3;
}

// app/Listeners/ReserveStock.php
class ReserveStock implements ShouldQueue
{
    public function handle(OrderCreated $event): void
    {
        foreach ($event->order->items as $item) {
            $item->product->decrement('stock', $item->quantity);
        }
    }
}

// app/Listeners/LogOrderAudit.php
class LogOrderAudit
{
    // Synchrone — l'audit doit être immédiat et fiable
    public function handleCreated(OrderCreated $event): void
    {
        AuditLog::create([
            'event'      => 'order.created',
            'record_id'  => $event->order->id,
            'user_id'    => auth()->id(),
            'metadata'   => $event->order->toArray(),
        ]);
    }

    public function handleStatusChanged(OrderStatusChanged $event): void
    {
        AuditLog::create([
            'event'    => 'order.status_changed',
            'record_id' => $event->order->id,
            'metadata' => [
                'old' => $event->oldStatus,
                'new' => $event->newStatus,
            ],
        ]);
    }
}

// app/Providers/EventServiceProvider.php
protected $listen = [
    OrderCreated::class => [
        SendOrderConfirmationEmail::class,
        ReserveStock::class,
        [LogOrderAudit::class, 'handleCreated'],
    ],
    OrderStatusChanged::class => [
        [LogOrderAudit::class, 'handleStatusChanged'],
    ],
];

// Émission depuis le service ou le controller
class OrderService
{
    public function create(array $data): Order
    {
        $order = Order::create($data);
        event(new OrderCreated($order));
        return $order;
    }
}
```

# Tester les Observers

```php
// Tests — désactiver les Observers pour les factories de test
public function test_order_creation(): void
{
    Event::fake([OrderCreated::class]);  // Approche Events/Listeners

    $order = Order::factory()->create();

    Event::assertDispatched(OrderCreated::class, fn($e) => $e->order->is($order));
}

// Pour les Model Observers
public function test_without_observers(): void
{
    Order::withoutObservers(function () {
        $order = Order::factory()->create();
        // Aucun Observer déclenché
    });
}
```