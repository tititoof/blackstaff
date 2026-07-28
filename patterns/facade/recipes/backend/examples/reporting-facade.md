---
type: Example
title: Facade — exemple Reporting (agrégation multi-sources)
tags: [facade, reporting, rails, laravel, symfony]
---

# Application du pattern sur un rapport agrégé

Assembler un rapport depuis plusieurs sources de données (base de données,
service externe, cache) derrière une seule méthode `generate(period, filters)`.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Facade}` | `SalesDashboardFacade` |
| `{SubsystemA}` | `OrderStatsRepository` |
| `{SubsystemB}` | `CustomerAnalyticsService` |
| `{SubsystemC}` | `ProductPerformanceRepository` |
| Méthode simplifiée | `generate(period, filters)` |

# Rails

```ruby
# app/facades/sales_dashboard_facade.rb
class SalesDashboardFacade
  def initialize(
    order_stats:    OrderStatsRepository.new,
    customer_stats: CustomerAnalyticsService.new,
    product_stats:  ProductPerformanceRepository.new
  )
    @order_stats    = order_stats
    @customer_stats = customer_stats
    @product_stats  = product_stats
  end

  def generate(period:, filters: {})
    # Les appels peuvent être parallélisés si indépendants
    orders   = @order_stats.for_period(period, **filters)
    customers = @customer_stats.for_period(period, **filters)
    products  = @product_stats.top_sellers(period: period, limit: 10, **filters)

    {
      period:    period,
      generated_at: Time.current.iso8601,
      summary: {
        total_revenue:  orders[:total_revenue],
        order_count:    orders[:count],
        average_basket: orders[:average_basket],
        new_customers:  customers[:new_count],
        returning_rate: customers[:returning_rate],
      },
      top_products: products,
      revenue_by_day: orders[:daily_breakdown],
    }
  end

  # Rapport simplifié pour export CSV
  def generate_csv(period:, filters: {})
    orders = @order_stats.for_period(period, **filters)
    orders[:daily_breakdown].map do |day|
      { date: day[:date], revenue: day[:revenue], orders: day[:order_count] }
    end
  end
end

# Controller
def index
  report = SalesDashboardFacade.new.generate(
    period:  Date.parse(params[:from])..Date.parse(params[:to]),
    filters: { category_id: params[:category_id] }.compact,
  )
  render json: report
end
```

# Laravel

```php
// app/Services/SalesDashboardService.php
class SalesDashboardService
{
    public function __construct(
        private readonly OrderStatsRepository        $orderStats,
        private readonly CustomerAnalyticsService    $customerStats,
        private readonly ProductPerformanceRepository $productStats,
    ) {}

    public function generate(array $params): array
    {
        $period  = [$params['from'], $params['to']];
        $filters = $params['filters'] ?? [];

        // Appels parallèles avec Laravel Concurrency (Laravel 11+)
        [$orders, $customers, $products] = Concurrency::run([
            fn() => $this->orderStats->forPeriod(...$period, filters: $filters),
            fn() => $this->customerStats->forPeriod(...$period, filters: $filters),
            fn() => $this->productStats->topSellers(period: $period, limit: 10),
        ]);

        return [
            'period'       => ['from' => $params['from'], 'to' => $params['to']],
            'generated_at' => now()->toISOString(),
            'summary'      => [
                'total_revenue'  => $orders['total_revenue'],
                'order_count'    => $orders['count'],
                'new_customers'  => $customers['new_count'],
                'returning_rate' => $customers['returning_rate'],
            ],
            'top_products'    => $products,
            'revenue_by_day'  => $orders['daily_breakdown'],
        ];
    }
}
```

# Symfony

```php
// src/Facade/SalesDashboardFacade.php
class SalesDashboardFacade
{
    public function __construct(
        private readonly OrderStatsRepository        $orderStats,
        private readonly CustomerAnalyticsService    $customerStats,
        private readonly ProductPerformanceRepository $productStats,
        private readonly CacheInterface              $cache,
    ) {}

    public function generate(array $params): array
    {
        $cacheKey = 'dashboard_' . md5(json_encode($params));

        return $this->cache->get($cacheKey, function (ItemInterface $item) use ($params) {
            $item->expiresAfter(300);  // 5 min — rapport mis en cache

            $period  = [$params['from'], $params['to']];
            $filters = $params['filters'] ?? [];

            $orders    = $this->orderStats->forPeriod(...$period, filters: $filters);
            $customers = $this->customerStats->forPeriod(...$period, filters: $filters);
            $products  = $this->productStats->topSellers($period, 10);

            return [
                'period'          => $params,
                'generated_at'    => (new \DateTimeImmutable())->format('c'),
                'summary'         => [
                    'total_revenue'  => $orders['total_revenue'],
                    'order_count'    => $orders['count'],
                    'new_customers'  => $customers['new_count'],
                    'returning_rate' => $customers['returning_rate'],
                ],
                'top_products'    => $products,
                'revenue_by_day'  => $orders['daily_breakdown'],
            ];
        });
    }
}
```

# Valeur de la Facade ici

Sans Facade, chaque endpoint de rapport (dashboard, export CSV, API mobile)
réplique la même logique d'agrégation. La Facade centralise l'assemblage —
et peut mettre en cache le résultat consolidé plutôt que les résultats
individuels de chaque sous-système.