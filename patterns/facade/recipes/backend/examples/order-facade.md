---
type: Example
title: Facade — exemple Commande (Stock + Paiement + Email)
tags: [facade, order, rails, laravel, symfony]
---

# Application du pattern sur la création d'une commande

Coordonner 4 services distincts (validation, stock, paiement, notification)
derrière une seule méthode `place(cart, user, token)` — le controller
n'appelle qu'une ligne.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Facade}` | `OrderFacade` |
| `{SubsystemA}` | `CartValidationService` |
| `{SubsystemB}` | `StockService` |
| `{SubsystemC}` | `PaymentService` |
| `{SubsystemD}` | `OrderNotificationService` |
| Méthode simplifiée | `place(cart, user, token)` |

# Rails

```ruby
# app/facades/order_facade.rb
class OrderFacade
  def initialize(
    cart_validator:   CartValidationService.new,
    stock_service:    StockService.new,
    payment_service:  PaymentService.new,
    notifier:         OrderNotificationService.new,
    order_service:    OrderService.new
  )
    @cart_validator  = cart_validator
    @stock_service   = stock_service
    @payment_service = payment_service
    @notifier        = notifier
    @order_service   = order_service
  end

  # Une seule méthode pour tout le processus de commande
  def place(cart:, user:, payment_token:)
    # 1. Valider le panier
    @cart_validator.validate!(cart)

    # 2. Créer la commande en base
    order = @order_service.create_from_cart(cart: cart, user: user)

    # 3. Réserver le stock (dans la transaction implicite)
    @stock_service.reserve!(order: order)

    # 4. Débiter le paiement
    payment = @payment_service.charge(
      amount:   order.total,
      currency: 'EUR',
      source:   payment_token,
      order:    order,
    )
    order.update!(payment_id: payment[:id], status: :confirmed)

    # 5. Envoyer les notifications (asynchrone)
    @notifier.notify_placed(order: order, payment: payment)

    order
  rescue CartInvalidError => e
    raise OrderPlacementError, "Panier invalide : #{e.message}"
  rescue InsufficientStockError => e
    raise OrderPlacementError, "Stock insuffisant : #{e.message}"
  rescue PaymentDeclinedError => e
    # Compensation : libérer le stock réservé
    @stock_service.release!(order: order) if order
    raise OrderPlacementError, "Paiement refusé : #{e.message}"
  end
end

# Controller — une seule ligne
def create
  order = OrderFacade.new.place(
    cart:          current_cart,
    user:          current_user,
    payment_token: params[:payment_token],
  )
  render json: order, status: :created
rescue OrderPlacementError => e
  render json: { error: e.message }, status: :unprocessable_entity
end
```

# Laravel

```php
// app/Services/OrderManager.php
// (nommé "Manager" en Laravel pour éviter la confusion avec les Facades natives)
class OrderManager
{
    public function __construct(
        private readonly CartValidationService    $cartValidator,
        private readonly StockService             $stockService,
        private readonly PaymentService           $paymentService,
        private readonly OrderNotificationService $notifier,
        private readonly OrderService             $orderService,
    ) {}

    public function place(array $params): Order
    {
        ['cart_id' => $cartId, 'user_id' => $userId, 'payment_token' => $token] = $params;

        $cart = Cart::with('items.product')->findOrFail($cartId);
        $user = User::findOrFail($userId);

        $this->cartValidator->validate($cart);

        $order = DB::transaction(function () use ($cart, $user) {
            $order = $this->orderService->createFromCart($cart, $user);
            $this->stockService->reserve($order);
            return $order;
        });

        try {
            $payment = $this->paymentService->charge([
                'amount'   => $order->total,
                'currency' => 'EUR',
                'source'   => $token,
            ]);
            $order->update(['payment_id' => $payment['id'], 'status' => 'confirmed']);
        } catch (PaymentDeclinedException $e) {
            $this->stockService->release($order);
            throw new OrderPlacementException('Paiement refusé : ' . $e->getMessage());
        }

        $this->notifier->notifyPlaced($order);
        return $order;
    }
}

// Controller
class OrderController extends Controller
{
    public function __construct(private readonly OrderManager $orderManager) {}

    public function store(PlaceOrderRequest $request): JsonResponse
    {
        try {
            $order = $this->orderManager->place($request->validated());
            return response()->json(new OrderResource($order), 201);
        } catch (OrderPlacementException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }
}
```

# Symfony

```php
// src/Facade/OrderFacade.php
class OrderFacade
{
    public function __construct(
        private readonly CartValidationService    $cartValidator,
        private readonly StockService             $stockService,
        private readonly PaymentService           $paymentService,
        private readonly OrderNotificationService $notifier,
        private readonly OrderService             $orderService,
        private readonly EntityManagerInterface   $em,
        private readonly LoggerInterface          $logger,
    ) {}

    public function place(array $params): Order
    {
        $this->logger->info('[OrderFacade] Placing order', ['cart_id' => $params['cart_id']]);

        $cart = $this->cartValidator->validate($params['cart_id']);
        $order = $this->orderService->createFromCart($cart, $params['user_id']);

        $this->stockService->reserve($order);
        $this->em->flush();  // commit avant le paiement

        try {
            $payment = $this->paymentService->charge([
                'amount'   => $order->getTotal(),
                'currency' => 'EUR',
                'source'   => $params['payment_token'],
            ]);
            $order->setPaymentId($payment['id'])->setStatus('confirmed');
            $this->em->flush();
        } catch (PaymentDeclinedException $e) {
            $this->stockService->release($order);
            $this->em->flush();
            throw new OrderPlacementException('Paiement refusé : ' . $e->getMessage(), previous: $e);
        }

        $this->notifier->notifyPlaced($order);
        $this->logger->info('[OrderFacade] Order placed', ['order_id' => $order->getId()]);

        return $order;
    }
}
```

# Ce que la Facade résout

Sans Facade, le controller doit connaître et orchestrer 5 services.
Chaque controller qui crée une commande (API, CLI, webhook) duplique
cette orchestration. Avec la Facade, un seul `OrderFacade::place()`
suffit partout — et la logique de compensation (libérer le stock si le
paiement échoue) est centralisée, jamais dupliquée.