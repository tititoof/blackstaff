---
type: Example
title: Singleton — exemple Client API partagé
tags: [singleton, api-client, rails, laravel, symfony]
---

# Application du pattern sur un client API externe

Un client vers une API externe (Stripe, Twilio, SendGrid, OpenAI...)
doit être instancié une seule fois — l'initialisation est coûteuse
(handshake TLS, configuration du pool de connexions) et les credentials
sont fixes pour toute la durée de vie de l'app.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Singleton}` | `ExternalApiClient` (ex: `StripeClient`, `TwilioClient`) |
| `{resource}` | La connexion / instance du SDK externe |
| `{DOMAIN}_API_KEY` | `STRIPE_API_KEY`, `TWILIO_AUTH_TOKEN`... |

# Rails — approche `||=` (idiomatique)

```ruby
# lib/external_api_client.rb
module ExternalApi
  class Client
    def self.instance
      @instance ||= begin
        ExternalSdk::Client.new(
          api_key: ENV.fetch('EXTERNAL_API_KEY'),
          timeout: ENV.fetch('EXTERNAL_API_TIMEOUT', 30).to_i
        )
      end
    end
    private_class_method :new
  end
end

# Utilisation dans un service
class PaymentService
  def process(amount, currency)
    ExternalApi::Client.instance.charge(amount: amount, currency: currency)
  end
end
```

```ruby
# config/initializers/external_api.rb
# Pré-chauffer l'instance au démarrage (évite le lazy-init en première requête)
Rails.application.config.after_initialize do
  ExternalApi::Client.instance
end
```

# Laravel — binding singleton dans le conteneur (recommandé)

```php
// app/Providers/AppServiceProvider.php
$this->app->singleton(ExternalApiClient::class, function () {
    return new ExternalApiClient(
        apiKey:  config('services.external_api.key'),
        timeout: config('services.external_api.timeout', 30),
    );
});

// config/services.php
'external_api' => [
    'key'     => env('EXTERNAL_API_KEY'),
    'timeout' => env('EXTERNAL_API_TIMEOUT', 30),
],
```

```php
// app/Services/ExternalApiClient.php
class ExternalApiClient
{
    private SdkClient $sdk;

    public function __construct(string $apiKey, int $timeout)
    {
        $this->sdk = new SdkClient(['api_key' => $apiKey, 'timeout' => $timeout]);
    }

    public function charge(int $amount, string $currency): array
    {
        return $this->sdk->charge(['amount' => $amount, 'currency' => $currency]);
    }
}

// Utilisation — injection automatique
class PaymentController extends Controller
{
    public function __construct(private ExternalApiClient $client) {}
}
```

# Symfony — service auto-wired (shared: true par défaut)

```php
// src/Service/ExternalApiClient.php
class ExternalApiClient
{
    private SdkClient $sdk;

    public function __construct(
        #[Autowire('%env(EXTERNAL_API_KEY)%')] string $apiKey,
        #[Autowire('%env(int:EXTERNAL_API_TIMEOUT)%')] int $timeout = 30,
    ) {
        $this->sdk = new SdkClient(['api_key' => $apiKey, 'timeout' => $timeout]);
    }

    public function charge(int $amount, string $currency): array
    {
        return $this->sdk->charge(['amount' => $amount, 'currency' => $currency]);
    }
}
```

```yaml
# config/services.yaml — auto-wired, shared: true (singleton) automatique
services:
    App\Service\ExternalApiClient: ~
```

```php
// Utilisation — injection dans n'importe quel service/controller
class PaymentController extends AbstractController
{
    public function __construct(private ExternalApiClient $client) {}
}
```

# Points communs aux 3 backends

- L'instance du SDK externe est créée **une seule fois** — pas de re-handshake
  TLS, pas de re-lecture des credentials à chaque requête.
- Les credentials viennent **toujours des variables d'environnement** — jamais
  codés en dur dans la classe.
- Rails utilise `||=` (lazy init idiomatique), Laravel et Symfony délèguent
  au conteneur (singleton implicite ou binding explicite).