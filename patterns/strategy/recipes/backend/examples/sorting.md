---
type: Example
title: Strategy — exemple Tri paramétrable
tags: [strategy, sorting, rails, laravel, symfony]
---

# Application du pattern sur un tri paramétrable

Critère de tri interchangeable au runtime selon la préférence utilisateur,
sans conditionnel dans le controller.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Domain}` | `Product` |
| `{Strategy}` | `SortStrategy` |
| `{Context}` | `ProductList` |
| `{ConcreteA}` | `PriceAsc` |
| `{ConcreteB}` | `PriceDesc` |
| `{ConcreteC}` | `Popularity` |
| `{ConcreteD}` | `Newest` |
| Méthode commune | `execute(scope)` → scope modifié |

# Rails

```ruby
# Stratégies de tri — opèrent sur un scope ActiveRecord
module Products
  class PriceAscSortStrategy
    def execute(scope) = scope.order(price: :asc)
  end

  class PriceDescSortStrategy
    def execute(scope) = scope.order(price: :desc)
  end

  class PopularitySortStrategy
    def execute(scope) = scope.order(orders_count: :desc)
  end

  class NewestSortStrategy
    def execute(scope) = scope.order(created_at: :desc)
  end

  class SortStrategyResolver
    STRATEGIES = {
      'price_asc'   => PriceAscSortStrategy,
      'price_desc'  => PriceDescSortStrategy,
      'popularity'  => PopularitySortStrategy,
      'newest'      => NewestSortStrategy,
    }.freeze

    def self.resolve(sort_param)
      klass = STRATEGIES.fetch(sort_param.to_s, NewestSortStrategy)
      klass.new
    end
  end
end

# Controller
def index
  scope    = Product.published.includes(:category)
  strategy = Products::SortStrategyResolver.resolve(params[:sort])
  @products = strategy.execute(scope).page(params[:page]).per(24)
  render json: @products
end
```

# Laravel

```php
// Stratégies opèrent sur un Builder Eloquent
class PriceAscSortStrategy implements SortStrategyInterface
{
    public function execute(array $args): mixed
    {
        return $args['query']->orderBy('price', 'asc');
    }
}

class PopularitySortStrategy implements SortStrategyInterface
{
    public function execute(array $args): mixed
    {
        return $args['query']->orderByDesc('orders_count');
    }
}

// Controller
public function index(Request $request): JsonResponse
{
    $query    = Product::published()->with('category');
    $strategy = SortStrategyResolver::resolve($request->input('sort', 'newest'));
    $products = $strategy->execute(['query' => $query])->paginate(24);
    return response()->json($products);
}
```

# Symfony

```php
// Stratégies modifient un QueryBuilder Doctrine
class PriceAscSortStrategy implements SortStrategyInterface
{
    public function execute(array $args): mixed
    {
        return $args['qb']->orderBy('p.price', 'ASC');
    }
    public function supports(string $type): bool { return $type === 'price_asc'; }
}

// Controller
#[Route('/api/products')]
public function index(Request $request, SortStrategyResolver $resolver,
                      ProductRepository $repo): JsonResponse
{
    $qb       = $repo->createQueryBuilder('p')->where('p.published = true');
    $strategy = $resolver->resolve($request->query->get('sort', 'newest'));
    $strategy->execute(['qb' => $qb]);
    return $this->json($qb->getQuery()->getResult());
}
```

# Variante fonctionnelle (sans classe, pour un tri simple)

```ruby
# Rails — si les stratégies sont vraiment triviales
SORT_STRATEGIES = {
  'price_asc'  => ->(scope) { scope.order(price: :asc) },
  'price_desc' => ->(scope) { scope.order(price: :desc) },
  'newest'     => ->(scope) { scope.order(created_at: :desc) },
}.freeze

sorter = SORT_STRATEGIES.fetch(params[:sort], SORT_STRATEGIES['newest'])
@products = sorter.call(Product.published)
```

Utiliser des lambdas quand le tri est une simple clause ORDER BY — utiliser
des classes quand le tri implique des jointures, des sous-requêtes ou de
la logique métier.