---
type: Example
title: Command — exemple Action transactionnelle complexe
tags: [command, transaction, rails, laravel, symfony]
---

# Application du pattern sur une action métier complexe

Une commande qui encapsule plusieurs étapes métier devant s'exécuter de
façon atomique : créer une commande, réserver le stock, débiter le paiement,
envoyer la confirmation.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Command}` | `PlaceOrderCommand` |
| `{Receiver}` | `OrderService`, `StockService`, `PaymentService` |
| Action | `place_order(cart, user, payment_token)` |

# Rails

```ruby
# app/commands/place_order_command.rb
class PlaceOrderCommand < BaseCommand
  def initialize(cart:, user:, payment_token:)
    @cart          = cart
    @user          = user
    @payment_token = payment_token
  end

  def execute
    validate_preconditions!

    ActiveRecord::Base.transaction do
      # Étape 1 : créer la commande
      order = create_order!

      # Étape 2 : réserver le stock (dans la transaction — rollback si échec)
      reserve_stock!(order)

      # Étape 3 : débiter le paiement (hors transaction — non-rollbackable)
      # → déplacé APRÈS le commit de la transaction
      @order_to_charge = order
    end

    # Exécuté APRÈS le commit — si payment échoue, compensation nécessaire
    charge_payment!(@order_to_charge)

    # Effets de bord asynchrones — JAMAIS dans la transaction
    OrderConfirmationJob.perform_later(order_id: @order_to_charge.id)
    StockSyncJob.perform_later(order_id: @order_to_charge.id)

    success(@order_to_charge)
  rescue ActiveRecord::RecordInvalid => e
    failure(e.record.errors.full_messages)
  rescue InsufficientStockError => e
    failure("Stock insuffisant : #{e.message}")
  rescue PaymentGatewayError => e
    # Paiement échoué après commit DB → compensation
    compensate_order!(@order_to_charge) if @order_to_charge
    failure("Paiement refusé : #{e.message}")
  end

  private

  def validate_preconditions!
    raise ArgumentError, "Panier vide"     if @cart.items.empty?
    raise ArgumentError, "Utilisateur requis" unless @user.present?
  end

  def create_order!
    Order.create!(
      user:   @user,
      total:  @cart.total,
      status: :pending,
      items:  @cart.items.map(&:to_order_item),
    )
  end

  def reserve_stock!(order)
    order.items.each do |item|
      StockService.new.reserve!(product_id: item.product_id, quantity: item.quantity)
    end
  end

  def charge_payment!(order)
    result = PaymentService.new.charge(
      amount: order.total,
      source: @payment_token,
      order:  order,
    )
    order.update!(status: :confirmed, payment_id: result[:id])
  end

  def compensate_order!(order)
    order&.update!(status: :payment_failed)
    StockService.new.release_reservation!(order_id: order.id)
  end
end

# Controller
def create
  result = PlaceOrderCommand.new(
    cart:          current_cart,
    user:          current_user,
    payment_token: params[:payment_token],
  ).execute

  if result.success?
    render json: result.data, status: :created
  else
    render json: { errors: result.errors }, status: :unprocessable_entity
  end
end
```

# Laravel

```php
// app/Commands/PlaceOrderCommand.php
final class PlaceOrderCommand
{
    public function __construct(
        public readonly int    $cartId,
        public readonly int    $userId,
        public readonly string $paymentToken,
    ) {}
}

// app/Handlers/PlaceOrderHandler.php
class PlaceOrderHandler
{
    public function __construct(
        private readonly OrderService   $orderService,
        private readonly StockService   $stockService,
        private readonly PaymentService $paymentService,
    ) {}

    public function handle(PlaceOrderCommand $command): Order
    {
        $cart = Cart::with('items.product')->findOrFail($command->cartId);
        $user = User::findOrFail($command->userId);

        // Transaction pour les étapes DB
        $order = DB::transaction(function () use ($cart, $user) {
            $order = $this->orderService->createFromCart($cart, $user);
            $this->stockService->reserve($order);
            return $order;
        });

        // Paiement hors transaction (non-rollbackable)
        try {
            $this->paymentService->charge($command->paymentToken, $order);
        } catch (PaymentException $e) {
            // Compensation
            $this->stockService->releaseReservation($order);
            $order->update(['status' => 'payment_failed']);
            throw $e;
        }

        // Effets de bord asynchrones
        OrderConfirmationJob::dispatch($order->id)->afterCommit();
        StockSyncJob::dispatch($order->id)->afterCommit();

        return $order;
    }
}
```

# Symfony

```php
// src/Handler/PlaceOrderHandler.php
// Le middleware doctrine_transaction de Messenger wrappe automatiquement
// le handler dans une transaction Doctrine
class PlaceOrderHandler implements MessageHandlerInterface
{
    public function __construct(
        private readonly OrderService          $orderService,
        private readonly StockService          $stockService,
        private readonly PaymentService        $paymentService,
        private readonly MessageBusInterface   $bus,
        private readonly EntityManagerInterface $em,
    ) {}

    public function __invoke(PlaceOrderCommand $command): void
    {
        $order = $this->orderService->createFromCart(
            $command->cartId, $command->userId
        );
        $this->stockService->reserve($order);
        $this->em->flush();  // commit dans la transaction Messenger

        // Paiement post-commit
        try {
            $this->paymentService->charge($command->paymentToken, $order);
        } catch (PaymentException $e) {
            $this->stockService->releaseReservation($order);
            $order->setStatus('payment_failed');
            $this->em->flush();
            throw $e;
        }

        // Dispatching asynchrone des effets de bord
        $this->bus->dispatch(new SendOrderConfirmationMessage($order->getId()));
        $this->bus->dispatch(new SyncStockMessage($order->getId()));
    }
}
```

# Règle clé : paiement hors transaction DB

Le paiement (appel à Stripe/PayPal) est **toujours effectué après le commit**
de la transaction DB, jamais dedans — un appel réseau dans une transaction
prolonge le lock sur les tables et augmente le risque de deadlock. En cas
d'échec du paiement, une compensation explicite (annuler la commande, libérer
le stock) est préférable à un rollback de la transaction.