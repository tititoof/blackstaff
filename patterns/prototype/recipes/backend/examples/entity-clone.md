---
type: Example
title: Prototype — exemple Entité métier (commande dupliquée)
tags: [prototype, entity, order, rails, laravel, symfony]
---

# Application du pattern sur une commande

Dupliquer une commande existante (avec ses lignes de commande) pour
créer une nouvelle commande pré-remplie — cas d'usage courant en B2B
("commander à nouveau").

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Prototype}` | `Order` |
| `{Child}` | `OrderItem` |
| Attributs scalaires | `customer_id`, `shipping_address`, `notes` |
| Attributs exclus | `id`, `created_at`, `updated_at`, `reference`, `status`, `paid_at` |
| Overrides | `status: 'draft'`, `reference: auto-généré`, `paid_at: nil` |
| Relation | `has_many :order_items` |

# Rails — implémentation concrète

```ruby
# app/models/order.rb
class Order < ApplicationRecord
  include Cloneable

  has_many :order_items, dependent: :destroy

  enum :status, { draft: 0, confirmed: 1, shipped: 2, cancelled: 3 }

  def clone_prototype
    clone = self.class.new(clone_attributes)
    clone_children(clone)
    clone
  end

  private

  def clone_attributes
    attributes.except('id', 'created_at', 'updated_at', 'reference', 'paid_at')
  end

  def clone_overrides
    {
      'status'    => 'draft',
      'reference' => generate_reference,
      'paid_at'   => nil,
    }
  end

  def clone_children(clone_order)
    order_items.each do |item|
      clone_order.order_items << item.clone_prototype
    end
  end

  def generate_reference
    "CMD-#{SecureRandom.hex(4).upcase}"
  end
end

# app/models/order_item.rb
class OrderItem < ApplicationRecord
  include Cloneable
  belongs_to :order

  def clone_prototype
    self.class.new(
      attributes.except('id', 'created_at', 'updated_at', 'order_id')
    )
    # Les order_items n'ont pas d'enfants — clonage simple
  end
end
```

```ruby
# app/controllers/api/v1/orders_controller.rb
def duplicate
  original = Order.find(params[:id])
  cloned   = original.clone_prototype

  if cloned.save
    render json: OrderSerializer.new(cloned).serializable_hash, status: :created
  else
    render json: { errors: cloned.errors.full_messages }, status: :unprocessable_entity
  end
end
```

# Laravel — implémentation concrète

```php
// app/Models/Order.php
class Order extends Model implements Cloneable
{
    use CloneableTrait;

    protected $fillable = ['customer_id', 'shipping_address', 'notes', 'status', 'reference'];

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function clonePrototype(): static
    {
        $clone = static::make($this->buildCloneAttributes());
        $clone->saveQuietly();

        $this->orderItems->each(function (OrderItem $item) use ($clone) {
            $clone->orderItems()->save($item->clonePrototype());
        });

        return $clone;
    }

    protected function getExcludedAttributes(): array
    {
        return ['id', 'created_at', 'updated_at', 'reference', 'paid_at'];
    }

    protected function getCloneOverrides(): array
    {
        return [
            'status'    => 'draft',
            'reference' => 'CMD-' . strtoupper(bin2hex(random_bytes(4))),
            'paid_at'   => null,
        ];
    }
}

// app/Models/OrderItem.php
class OrderItem extends Model implements Cloneable
{
    use CloneableTrait;

    protected $fillable = ['product_id', 'quantity', 'unit_price'];

    public function clonePrototype(): static
    {
        return static::make($this->buildCloneAttributes());
    }

    protected function getExcludedAttributes(): array
    {
        return ['id', 'created_at', 'updated_at', 'order_id'];
    }
}
```

```php
// app/Http/Controllers/Api/OrderController.php
public function duplicate(Order $order): JsonResponse
{
    $clone = DB::transaction(fn() => $order->clonePrototype());
    return response()->json(new OrderResource($clone), 201);
}
```

# Symfony — implémentation concrète

```php
// src/Entity/Order.php
#[ORM\Entity]
class Order implements CloneableInterface
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 50)]
    private string $status = 'draft';

    #[ORM\Column(length: 30, unique: true)]
    private string $reference = '';

    #[ORM\OneToMany(targetEntity: OrderItem::class, mappedBy: 'order',
                    cascade: ['persist'], orphanRemoval: true)]
    private Collection $orderItems;

    public function __construct()
    {
        $this->orderItems = new ArrayCollection();
        $this->reference  = 'CMD-' . strtoupper(bin2hex(random_bytes(4)));
    }

    public function clonePrototype(): static
    {
        $clone = new static();
        $clone->status    = 'draft';
        $clone->customerId = $this->customerId;
        $clone->shippingAddress = $this->shippingAddress;
        $clone->notes     = $this->notes;
        // id reste null → nouvelle entité Doctrine

        foreach ($this->orderItems as $item) {
            $clone->addOrderItem($item->clonePrototype());
        }

        return $clone;
    }
}

// src/Entity/OrderItem.php
#[ORM\Entity]
class OrderItem implements CloneableInterface
{
    public function clonePrototype(): static
    {
        $clone = new static();
        $clone->productId  = $this->productId;
        $clone->quantity   = $this->quantity;
        $clone->unitPrice  = $this->unitPrice;
        return $clone;
    }
}
```

```php
// src/Controller/Api/OrderController.php
#[Route('/api/orders/{id}/duplicate', methods: ['POST'])]
public function duplicate(Order $order, OrderCloner $cloner): JsonResponse
{
    $clone = $cloner->clone($order);
    return $this->json($clone, 201);
}
```

# Points communs aux 3 backends

- La `reference` est **toujours régénérée** dans le clone — c'est un champ
  unique, copier celui de l'original provoquerait une violation de contrainte.
- Le `status` est **toujours remis à `draft`** dans le clone — une commande
  dupliquée ne doit jamais hériter du statut `shipped` ou `paid` de l'original.
- Les `OrderItem` sont clonés **individuellement** — chacun est une nouvelle
  ligne indépendante avec son propre id, pas une référence partagée.