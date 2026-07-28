---
type: Example
title: Decorator — exemple Cache d'un service
tags: [decorator, caching, rails, laravel, symfony]
---

# Application du pattern sur un service de catalogue décoré avec du cache

Mettre en cache les résultats d'un service coûteux sans modifier son code —
le Decorator intercepte les appels, vérifie le cache, et ne délègue que
sur un cache miss.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Component}` | `ProductCatalogService` |
| `{ConcreteComponent}` | `DatabaseProductCatalogService` |
| `{DecoratorA}` | `Caching` |
| Méthodes décorées | `findAll(filters)`, `findById(id)` |
| Court-circuit | Cache hit → retourne immédiatement, sans appeler le service réel |

# Rails

```ruby
# app/services/catalogs/decorators/caching_decorator.rb
module Catalogs
  module Decorators
    class CachingDecorator < BaseDecorator
      TTL = 15.minutes

      def find_all(filters: {})
        cache_key = "catalog:all:#{filters.sort.to_h.to_json}"
        Rails.cache.fetch(cache_key, expires_in: TTL) do
          @wrapped.find_all(filters: filters)
          # Appelé UNIQUEMENT sur cache miss — court-circuit si hit
        end
      end

      def find_by_id(id)
        Rails.cache.fetch("catalog:#{id}", expires_in: TTL) do
          @wrapped.find_by_id(id)
        end
      end

      def invalidate(id: nil)
        if id
          Rails.cache.delete("catalog:#{id}")
        else
          Rails.cache.delete_matched('catalog:*')
        end
        # Déléguer l'invalidation au service réel si nécessaire
        @wrapped.respond_to?(:invalidate) ? @wrapped.invalidate(id: id) : nil
      end
    end
  end
end

# Empilement : logging autour du cache (logge les hits ET les miss)
service = Catalogs::DatabaseProductCatalogService.new
service = Catalogs::Decorators::CachingDecorator.new(service)
service = Catalogs::Decorators::LoggingDecorator.new(service)
# LoggingDecorator logge → CachingDecorator vérifie le cache → si miss, DatabaseService
```

# Laravel

```php
// app/Services/Catalogs/Decorators/CachingProductCatalogDecorator.php
class CachingProductCatalogDecorator extends AbstractProductCatalogDecorator
{
    private const TTL = 900; // 15 minutes

    public function __construct(
        ProductCatalogInterface $wrapped,
        private readonly CacheManager $cache,
    ) {
        parent::__construct($wrapped);
    }

    public function findAll(array $filters = []): Collection
    {
        $cacheKey = 'catalog:all:' . md5(json_encode(ksort($filters) ? $filters : $filters));

        return $this->cache->remember($cacheKey, self::TTL, function () use ($filters) {
            return parent::findAll($filters);
            // Appelé UNIQUEMENT sur cache miss
        });
    }

    public function findById(int $id): ?Product
    {
        return $this->cache->remember("catalog:{$id}", self::TTL, function () use ($id) {
            return parent::findById($id);
        });
    }

    public function invalidate(?int $id = null): void
    {
        if ($id !== null) {
            $this->cache->forget("catalog:{$id}");
        } else {
            $this->cache->flush();  // ou cache:tags si Redis avec tags
        }
        parent::invalidate($id);
    }
}

// Empilement dans AppServiceProvider
$this->app->bind(ProductCatalogInterface::class, function () {
    $service = app(DatabaseProductCatalogService::class);
    $service = new CachingProductCatalogDecorator($service, app(CacheManager::class));
    $service = new LoggingProductCatalogDecorator($service, app(LoggerInterface::class));
    return $service;
});
```

# Symfony

```php
// src/Service/Catalog/Decorator/CachingProductCatalogService.php
class CachingProductCatalogService implements ProductCatalogInterface
{
    private const TTL = 900;

    public function __construct(
        private readonly ProductCatalogInterface $inner,
        private readonly CacheInterface          $cache,
    ) {}

    public function findAll(array $filters = []): array
    {
        $cacheKey = 'catalog_all_' . md5(json_encode($filters));

        return $this->cache->get($cacheKey, function (ItemInterface $item) use ($filters) {
            $item->expiresAfter(self::TTL);
            return $this->inner->findAll($filters);
        });
    }

    public function findById(int $id): ?Product
    {
        return $this->cache->get("catalog_{$id}", function (ItemInterface $item) use ($id) {
            $item->expiresAfter(self::TTL);
            return $this->inner->findById($id);
        });
    }

    public function invalidate(?int $id = null): void
    {
        if ($id !== null) {
            $this->cache->delete("catalog_{$id}");
        } else {
            $this->cache->clear();
        }
        $this->inner->invalidate($id);
    }
}
```

```yaml
# config/services.yaml
services:
    # Couche cache (intérieure)
    App\Service\Catalog\Decorator\CachingProductCatalogService:
        decorates: App\Service\Catalog\ProductCatalogInterface
        decoration_priority: 5
        arguments: { $inner: '@.inner' }

    # Couche logging (extérieure — exécutée en premier)
    App\Service\Catalog\Decorator\LoggingProductCatalogService:
        decorates: App\Service\Catalog\ProductCatalogInterface
        decoration_priority: 10
        arguments: { $inner: '@.inner' }
```

# Ordre des couches : logging autour du cache vs cache autour du logging

```
LoggingDecorator(CachingDecorator(DatabaseService))
→ Log "appel findAll"
→ Vérifie le cache → HIT → retourne sans appeler DatabaseService
→ Log "findAll retourné" (même sur un cache hit)

CachingDecorator(LoggingDecorator(DatabaseService))
→ Vérifie le cache → HIT → retourne SANS logger (le logging n'est pas appelé sur hit)
→ Vérifie le cache → MISS → Log "appel findAll" → DatabaseService → Log "retourné"
```

Choisir selon le besoin : logger tous les appels (y compris les hits) →
Logging extérieur. Logger uniquement les appels effectifs à la base → Cache
extérieur.