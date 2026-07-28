---
type: Example
title: Adapter — exemple Système legacy
tags: [adapter, legacy, rails, laravel, symfony]
---

# Application du pattern sur un système legacy

Exposer un code ancien avec une API non standard (procédural, SQL brut,
SOAP, format propriétaire) derrière une interface moderne — sans réécrire
le système legacy.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Target}` | `OrderRepositoryInterface` |
| `{Adapter}` | `LegacyOrderAdapter` |
| `{Adaptee}` | `LegacyOrderSystem` (code ancien non modifiable) |
| Méthode Target | `findById(id)`, `save(order)` |
| Méthode Adaptee | `getOrder($id)` (retourne un tableau non structuré) |

# Rails

```ruby
# Le système legacy (non modifiable) — exemple
# app/legacy/legacy_order_system.rb
class LegacyOrderSystem
  def get_order(order_id)
    # Retourne un Hash avec des clés inconsistantes et des types mixtes
    {
      'ORDER_ID'     => order_id.to_s,
      'CUST_NUM'     => '12345',
      'TOTAL_AMT'    => '1999.00',   # string, pas float
      'ORD_DATE'     => '20260101',  # format YYYYMMDD non standard
      'STATUS_CODE'  => 'C',         # 'C'=confirmed, 'P'=pending, 'X'=cancelled
      'ITEMS'        => [{ 'PROD_ID' => '789', 'QTY' => '2', 'UNIT_PRC' => '999.50' }]
    }
  end

  def save_order(order_hash)
    # Attend le même format propriétaire
  end
end

# app/adapters/legacy_order_adapter.rb
class LegacyOrderAdapter
  include OrderRepositoryInterface

  STATUS_MAP = { 'C' => 'confirmed', 'P' => 'pending', 'X' => 'cancelled' }.freeze

  def initialize(legacy_system = nil)
    @legacy = legacy_system || LegacyOrderSystem.new
  end

  def find_by_id(id)
    raw = @legacy.get_order(id)
    return nil if raw.nil?
    translate_to_order(raw)
  end

  def save(order)
    legacy_hash = translate_to_legacy(order)
    @legacy.save_order(legacy_hash)
  end

  private

  def translate_to_order(raw)
    Order.new(
      id:          raw['ORDER_ID'].to_i,
      customer_id: raw['CUST_NUM'].to_i,
      total:       raw['TOTAL_AMT'].to_f,
      created_at:  parse_legacy_date(raw['ORD_DATE']),
      status:      STATUS_MAP.fetch(raw['STATUS_CODE'], 'unknown'),
      items:       (raw['ITEMS'] || []).map { |i| translate_item(i) },
    )
  end

  def translate_to_legacy(order)
    {
      'ORDER_ID'    => order.id.to_s,
      'CUST_NUM'    => order.customer_id.to_s,
      'TOTAL_AMT'   => format('%.2f', order.total),
      'ORD_DATE'    => order.created_at.strftime('%Y%m%d'),
      'STATUS_CODE' => STATUS_MAP.invert.fetch(order.status, 'P'),
    }
  end

  def parse_legacy_date(date_str)
    Date.strptime(date_str, '%Y%m%d').to_time
  rescue Date::Error
    Time.current
  end

  def translate_item(raw_item)
    OrderItem.new(
      product_id: raw_item['PROD_ID'].to_i,
      quantity:   raw_item['QTY'].to_i,
      unit_price: raw_item['UNIT_PRC'].to_f,
    )
  end
end
```

# Laravel

```php
// app/Adapters/LegacyOrderAdapter.php
class LegacyOrderAdapter implements OrderRepositoryInterface
{
    private const STATUS_MAP = ['C' => 'confirmed', 'P' => 'pending', 'X' => 'cancelled'];

    public function __construct(
        private readonly LegacyOrderSystem $legacy,
    ) {}

    public function findById(int $id): ?Order
    {
        $raw = $this->legacy->getOrder($id);
        return $raw ? $this->translateToOrder($raw) : null;
    }

    public function save(Order $order): void
    {
        $this->legacy->saveOrder($this->translateToLegacy($order));
    }

    private function translateToOrder(array $raw): Order
    {
        $order = new Order();
        $order->id          = (int) $raw['ORDER_ID'];
        $order->customer_id = (int) $raw['CUST_NUM'];
        $order->total       = (float) $raw['TOTAL_AMT'];
        $order->created_at  = Carbon::createFromFormat('Ymd', $raw['ORD_DATE']);
        $order->status      = self::STATUS_MAP[$raw['STATUS_CODE']] ?? 'unknown';
        $order->items       = array_map([$this, 'translateItem'], $raw['ITEMS'] ?? []);
        return $order;
    }

    private function translateItem(array $raw): OrderItem
    {
        return new OrderItem(
            productId: (int)   $raw['PROD_ID'],
            quantity:  (int)   $raw['QTY'],
            unitPrice: (float) $raw['UNIT_PRC'],
        );
    }
}
```

# Symfony

```php
// src/Adapter/LegacyOrderAdapter.php
class LegacyOrderAdapter implements OrderRepositoryInterface
{
    private const STATUS_MAP = ['C' => 'confirmed', 'P' => 'pending', 'X' => 'cancelled'];

    public function __construct(
        private readonly LegacyOrderSystem $legacy,
    ) {}

    public function findById(int $id): ?Order
    {
        $raw = $this->legacy->getOrder($id);
        return $raw ? $this->toOrder($raw) : null;
    }

    public function save(Order $order): void
    {
        $this->legacy->saveOrder($this->toLegacy($order));
    }

    private function toOrder(array $raw): Order
    {
        $order = new Order();
        $order->setId((int) $raw['ORDER_ID'])
              ->setTotal((float) $raw['TOTAL_AMT'])
              ->setStatus(self::STATUS_MAP[$raw['STATUS_CODE']] ?? 'unknown')
              ->setCreatedAt(\DateTimeImmutable::createFromFormat('Ymd', $raw['ORD_DATE']));
        return $order;
    }
}
```

# Valeur clé de l'Adapter sur du legacy

Sans l'Adapter, chaque service qui accède au système legacy doit :
- Connaître le format propriétaire (`ORDER_ID`, `TOTAL_AMT`, `STATUS_CODE`)
- Faire ses propres conversions de types (string → float, string → date)
- Mapper ses propres codes de statut

Avec l'Adapter, ce mapping est fait **une seule fois** — et quand le legacy
est finalement remplacé, seul l'Adapter change, pas les services métier.