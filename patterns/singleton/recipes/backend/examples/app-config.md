---
type: Example
title: Singleton — exemple Configuration globale
tags: [singleton, config, rails, laravel, symfony]
---

# Application du pattern sur une configuration globale

Un objet de configuration lu depuis les variables d'environnement ou un
fichier de config au démarrage de l'app — immuable, partagé entre tous
les services.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Singleton}` | `AppConfig` |
| `{resource}` | Les paramètres de configuration |

# Rails — `Rails.application.config` (idiomatique)

Rails fournit déjà un singleton de config natif — ne pas réinventer.

```ruby
# config/application.rb — déclarer les paramètres custom
module MyApp
  class Application < Rails::Application
    config.x.payment_provider = ENV.fetch('PAYMENT_PROVIDER', 'stripe')
    config.x.max_upload_size  = ENV.fetch('MAX_UPLOAD_SIZE', '10').to_i.megabytes
    config.x.feature_flags    = {
      new_dashboard: ENV['FEATURE_NEW_DASHBOARD'] == 'true',
      beta_api:      ENV['FEATURE_BETA_API'] == 'true',
    }
  end
end

# Utilisation n'importe où dans l'app
Rails.application.config.x.payment_provider  # → 'stripe'
Rails.application.config.x.max_upload_size   # → 10.megabytes
Rails.application.config.x.feature_flags[:new_dashboard]  # → true/false
```

Pour une config personnalisée avec logique de validation :

```ruby
# lib/app_config.rb
class AppConfig
  REQUIRED_KEYS = %w[PAYMENT_PROVIDER API_SECRET].freeze

  def self.instance
    @instance ||= new
  end
  private_class_method :new

  attr_reader :payment_provider, :api_secret, :feature_flags

  def initialize
    validate_env!
    @payment_provider = ENV.fetch('PAYMENT_PROVIDER')
    @api_secret       = ENV.fetch('API_SECRET')
    @feature_flags    = load_feature_flags
  end

  private

  def validate_env!
    missing = REQUIRED_KEYS.select { |k| ENV[k].blank? }
    raise "Variables d'env manquantes : #{missing.join(', ')}" if missing.any?
  end

  def load_feature_flags
    {
      new_dashboard: ENV['FEATURE_NEW_DASHBOARD'] == 'true',
    }.freeze
  end
end
```

# Laravel — `config()` helper (natif, singleton implicite)

Laravel charge les fichiers de config une seule fois — le helper `config()`
est déjà un singleton implicite. Pour une config custom avec validation :

```php
// config/app_config.php
return [
    'payment_provider' => env('PAYMENT_PROVIDER', 'stripe'),
    'max_upload_size'  => env('MAX_UPLOAD_SIZE', 10),
    'feature_flags'    => [
        'new_dashboard' => env('FEATURE_NEW_DASHBOARD', false),
        'beta_api'      => env('FEATURE_BETA_API', false),
    ],
];

// Utilisation
config('app_config.payment_provider')           // → 'stripe'
config('app_config.feature_flags.new_dashboard') // → false
```

Pour une config avec validation au démarrage :

```php
// app/Services/AppConfig.php
class AppConfig
{
    public readonly string $paymentProvider;
    public readonly int    $maxUploadSize;
    public readonly array  $featureFlags;

    public function __construct()
    {
        $this->validate();
        $this->paymentProvider = config('app_config.payment_provider');
        $this->maxUploadSize   = config('app_config.max_upload_size');
        $this->featureFlags    = config('app_config.feature_flags');
    }

    public function hasFeature(string $flag): bool
    {
        return (bool) ($this->featureFlags[$flag] ?? false);
    }

    private function validate(): void
    {
        throw_if(
            empty(config('app_config.payment_provider')),
            \RuntimeException::class,
            'PAYMENT_PROVIDER non configuré'
        );
    }
}

// app/Providers/AppServiceProvider.php
$this->app->singleton(AppConfig::class);
```

# Symfony — paramètres du conteneur (natif, singleton implicite)

```yaml
# config/services.yaml
parameters:
    payment_provider: '%env(PAYMENT_PROVIDER)%'
    max_upload_size:  '%env(int:MAX_UPLOAD_SIZE)%'
    feature.new_dashboard: '%env(bool:FEATURE_NEW_DASHBOARD)%'
```

```php
// Injection directe dans un service via attribut
class SomeService
{
    public function __construct(
        #[Autowire('%payment_provider%')] private readonly string $paymentProvider,
        #[Autowire('%feature.new_dashboard%')] private readonly bool $newDashboard,
    ) {}
}
```

Pour une config consolidée avec logique :

```php
// src/Config/AppConfig.php
class AppConfig
{
    public function __construct(
        #[Autowire('%env(PAYMENT_PROVIDER)%')] public readonly string $paymentProvider,
        #[Autowire('%env(int:MAX_UPLOAD_SIZE)%')] public readonly int $maxUploadSize,
        #[Autowire('%env(bool:FEATURE_NEW_DASHBOARD)%')] public readonly bool $newDashboard,
    ) {}

    public function hasFeature(string $flag): bool
    {
        return match($flag) {
            'new_dashboard' => $this->newDashboard,
            default         => false,
        };
    }
}
// config/services.yaml : auto-wired, shared: true par défaut
```

# Point commun : validation au démarrage

Les 3 frameworks permettent de valider la config au boot plutôt qu'à
l'exécution — préférer cette approche pour détecter les variables
manquantes avant que l'app ne soit en production (fail-fast).