---
type: Example
title: Adapter — exemple Format de données
tags: [adapter, format, snake-case, camel-case, rails, laravel, symfony]
---

# Application du pattern sur la conversion de format

Normaliser des données entre systèmes avec des conventions différentes :
snake_case ↔ camelCase, formats de date, structures imbriquées, unités.

# Cas concrets couverts

1. **snake_case ↔ camelCase** : API externe en camelCase, app en snake_case
2. **Formats de date** : timestamp Unix ↔ ISO 8601 ↔ format localisé
3. **Structures imbriquées** : data.attributes (JSON:API) ↔ objet plat

# Rails — Adapter de format JSON:API

```ruby
# app/adapters/json_api_adapter.rb
# JSON:API retourne { data: { id: '1', type: 'orders', attributes: { total_amount: 1999 } } }
# Notre app attend { id: 1, total_amount: 1999, ... }
class JsonApiAdapter
  def normalize(raw_response)
    data = raw_response[:data] || raw_response['data']
    return nil unless data

    if data.is_a?(Array)
      data.map { |item| flatten_resource(item) }
    else
      flatten_resource(data)
    end
  end

  def denormalize(object, type:)
    {
      data: {
        type:       type,
        attributes: object.except(:id),
        id:         object[:id]&.to_s,
      }
    }
  end

  private

  def flatten_resource(resource)
    attrs = (resource[:attributes] || resource['attributes'] || {})
           .transform_keys(&:to_sym)
    { id: (resource[:id] || resource['id']).to_i }.merge(attrs)
  end
end

# Utilisation dans un composable HTTP
class ExternalOrderClient
  def initialize
    @http    = Faraday.new(url: ENV['EXTERNAL_API_URL'])
    @adapter = JsonApiAdapter.new
  end

  def find_all
    response = @http.get('/orders')
    raw      = JSON.parse(response.body, symbolize_names: true)
    @adapter.normalize(raw)
  end
end
```

# Laravel — Adapter camelCase ↔ snake_case

```php
// app/Adapters/CamelCaseAdapter.php
// API externe retourne camelCase, Laravel utilise snake_case
class CamelCaseAdapter
{
    public function normalize(array $raw): array
    {
        return $this->convertKeys($raw, fn(string $key) => Str::snake($key));
    }

    public function denormalize(array $data): array
    {
        return $this->convertKeys($data, fn(string $key) => Str::camel($key));
    }

    private function convertKeys(array $data, callable $converter): array
    {
        $result = [];
        foreach ($data as $key => $value) {
            $newKey          = $converter((string) $key);
            $result[$newKey] = is_array($value)
                ? $this->convertKeys($value, $converter)
                : $value;
        }
        return $result;
    }
}

// Utilisation dans un service d'intégration
class ExternalCrmService
{
    public function __construct(
        private readonly CamelCaseAdapter $adapter,
        private readonly HttpClientInterface $http,
    ) {}

    public function getCustomers(): array
    {
        $response = $this->http->request('GET', '/api/customers');
        $raw      = json_decode($response->getContent(), true);

        // { "customerId": 1, "firstName": "Alice" }
        // → { "customer_id": 1, "first_name": "Alice" }
        return array_map([$this->adapter, 'normalize'], $raw);
    }

    public function createCustomer(array $data): array
    {
        // { "first_name": "Bob" } → { "firstName": "Bob" }
        $payload  = $this->adapter->denormalize($data);
        $response = $this->http->request('POST', '/api/customers', ['json' => $payload]);
        return $this->adapter->normalize(json_decode($response->getContent(), true));
    }
}
```

# Symfony — Adapter de date (timestamp Unix ↔ DateTimeImmutable)

```php
// src/Adapter/UnixTimestampDateAdapter.php
// API externe envoie des timestamps Unix, notre domaine utilise DateTimeImmutable
class UnixTimestampDateAdapter
{
    public function toDateTime(int|float $timestamp): \DateTimeImmutable
    {
        return \DateTimeImmutable::createFromFormat('U', (string)(int)$timestamp)
            ?: throw new \InvalidArgumentException("Timestamp invalide : {$timestamp}");
    }

    public function toTimestamp(\DateTimeImmutable $dateTime): int
    {
        return $dateTime->getTimestamp();
    }

    public function normalizePayload(array $payload, array $dateFields): array
    {
        foreach ($dateFields as $field) {
            if (isset($payload[$field]) && is_numeric($payload[$field])) {
                $payload[$field] = $this->toDateTime((int) $payload[$field])->format('c');
            }
        }
        return $payload;
    }
}

// Utilisation
$adapter = new UnixTimestampDateAdapter();
$normalized = $adapter->normalizePayload(
    ['created_at' => 1751234567, 'updated_at' => 1751234999, 'title' => 'Test'],
    dateFields: ['created_at', 'updated_at']
);
// → ['created_at' => '2025-06-29T...', 'updated_at' => '...', 'title' => 'Test']
```

# Règle : l'Adapter de format est sans état

Un Adapter de format (camelCase, dates, JSON:API) est sans état — il peut
être une instance singleton ou des fonctions pures. Il ne fait que
transformer des données, sans appel réseau ni effet de bord.