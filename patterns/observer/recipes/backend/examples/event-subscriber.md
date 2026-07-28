---
type: Example
title: Observer Symfony — exemple EventSubscriber
tags: [symfony, backend, observer, event-subscriber, messenger]
---

# Application du pattern sur un EventSubscriber

Observer les événements applicatifs d'une commande via le système
EventDispatcher de Symfony, avec Messenger pour l'async.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Subject}` | `Order` |
| `{SubjectService}` | `OrderService` |
| `{Event}` | `OrderCreatedEvent`, `OrderStatusChangedEvent` |
| `{Observer}` | `OrderNotificationSubscriber` |

# L'événement

```php
// src/Event/OrderCreatedEvent.php
final class OrderCreatedEvent
{
    public function __construct(
        public readonly Order  $order,
        public readonly \DateTimeImmutable $occurredAt = new \DateTimeImmutable(),
    ) {}
}

// src/Event/OrderStatusChangedEvent.php
final class OrderStatusChangedEvent
{
    public function __construct(
        public readonly Order  $order,
        public readonly string $previousStatus,
        public readonly string $newStatus,
    ) {}
}
```

# L'EventSubscriber (Observateur)

```php
// src/EventSubscriber/OrderNotificationSubscriber.php
class OrderNotificationSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly MailerInterface        $mailer,
        private readonly MessageBusInterface    $bus,
        private readonly LoggerInterface        $logger,
        private readonly EntityManagerInterface $em,
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [
            OrderCreatedEvent::class        => [
                ['onOrderCreated', 10],        // priorité 10 = exécuté en premier
            ],
            OrderStatusChangedEvent::class  => 'onOrderStatusChanged',
        ];
    }

    public function onOrderCreated(OrderCreatedEvent $event): void
    {
        $order = $event->order;

        // Email de confirmation — via Messenger pour ne pas bloquer la requête
        $this->bus->dispatch(
            new SendOrderConfirmationEmailMessage($order->getId())
        );

        // Audit synchrone — doit être immédiat
        $this->logAudit('order.created', $order->getId(), [
            'total'    => $order->getTotal(),
            'customer' => $order->getCustomer()->getEmail(),
        ]);

        $this->logger->info('[Order] Created', ['order_id' => $order->getId()]);
    }

    public function onOrderStatusChanged(OrderStatusChangedEvent $event): void
    {
        // Réagir uniquement aux transitions significatives
        $transition = "{$event->previousStatus} → {$event->newStatus}";

        match($transition) {
            'draft → confirmed' => $this->bus->dispatch(
                new ReserveStockMessage($event->order->getId())
            ),
            'confirmed → shipped' => $this->bus->dispatch(
                new SendShippingNotificationMessage($event->order->getId())
            ),
            'confirmed → cancelled' => $this->bus->dispatch(
                new ReleaseStockMessage($event->order->getId())
            ),
            default => null,
        };

        $this->logAudit('order.status_changed', $event->order->getId(), [
            'from' => $event->previousStatus,
            'to'   => $event->newStatus,
        ]);
    }

    private function logAudit(string $event, int $orderId, array $metadata): void
    {
        $log = new AuditLog();
        $log->setEvent($event)
            ->setRecordId($orderId)
            ->setMetadata($metadata)
            ->setOccurredAt(new \DateTimeImmutable());
        $this->em->persist($log);
        $this->em->flush();
    }
}
// EventSubscriber auto-détecté par Symfony grâce à _instanceof
```

# Le Sujet — OrderService qui dispatche les événements

```php
// src/Service/OrderService.php
class OrderService
{
    public function __construct(
        private readonly EntityManagerInterface  $em,
        private readonly EventDispatcherInterface $dispatcher,
    ) {}

    public function create(CreateOrderDto $dto): Order
    {
        $order = new Order();
        // ... construction de la commande

        $this->em->persist($order);
        $this->em->flush();  // persister AVANT de dispatcher

        // Notifier tous les Observateurs
        $this->dispatcher->dispatch(new OrderCreatedEvent($order));

        return $order;
    }

    public function changeStatus(Order $order, string $newStatus): void
    {
        $previousStatus = $order->getStatus();
        $order->setStatus($newStatus);
        $this->em->flush();

        $this->dispatcher->dispatch(
            new OrderStatusChangedEvent($order, $previousStatus, $newStatus)
        );
    }
}
```

# Message Messenger (Observateur asynchrone)

```php
// src/Message/SendOrderConfirmationEmailMessage.php
final class SendOrderConfirmationEmailMessage
{
    public function __construct(public readonly int $orderId) {}
}

// src/MessageHandler/SendOrderConfirmationEmailMessageHandler.php
class SendOrderConfirmationEmailMessageHandler implements MessageHandlerInterface
{
    public function __construct(
        private readonly OrderRepository $orderRepository,
        private readonly MailerInterface $mailer,
    ) {}

    public function __invoke(SendOrderConfirmationEmailMessage $message): void
    {
        $order = $this->orderRepository->find($message->orderId);
        if (!$order) return;  // commande supprimée entre-temps

        $this->mailer->send(
            (new TemplatedEmail())
                ->to($order->getCustomer()->getEmail())
                ->subject('Confirmation de commande #'.$order->getReference())
                ->htmlTemplate('emails/order_confirmation.html.twig')
                ->context(['order' => $order])
        );
    }
}
```

```yaml
# config/packages/messenger.yaml — router vers la file async
framework:
    messenger:
        routing:
            'App\Message\SendOrderConfirmationEmailMessage': async
            'App\Message\ReserveStockMessage': async
            'App\Message\SendShippingNotificationMessage': async
```

# Tester l'EventSubscriber

```php
// tests/EventSubscriber/OrderNotificationSubscriberTest.php
class OrderNotificationSubscriberTest extends KernelTestCase
{
    public function test_order_created_dispatches_email_message(): void
    {
        $transport = self::getContainer()->get('messenger.transport.async');
        $order     = OrderFactory::createOne()->object();

        self::getContainer()->get(EventDispatcherInterface::class)
            ->dispatch(new OrderCreatedEvent($order));

        $this->assertCount(1, $transport->getSent());
        $this->assertInstanceOf(
            SendOrderConfirmationEmailMessage::class,
            $transport->getSent()[0]->getMessage()
        );
    }
}
```