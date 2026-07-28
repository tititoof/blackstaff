---
type: Recipe
title: Singleton Laravel — générique
tags: [laravel, backend, singleton, design-pattern]
---

# Contexte Laravel : le conteneur DI remplace le Singleton GoF

Laravel dispose d'un conteneur de services qui gère nativement l'unicité
des instances via `singleton()` et `scoped()`. C'est l'approche recommandée
— elle offre la testabilité (mockable), l'injection de dépendances, et la
gestion du cycle de vie sans instance statique globale.

Le Singleton GoF classique (instance statique + constructeur privé) n'est
utile que pour : des classes utilitaires **hors contexte Laravel** (helpers
purs, bibliothèques autonomes) ou des scripts sans conteneur de services.

Exemples concrets :
- [Client API partagé](/patterns/singleton/recipes/backend/examples/api-client.md)
- [Configuration globale](/patterns/singleton/recipes/backend/examples/app-config.md)
- [Service formateur (sans état)](/patterns/singleton/recipes/backend/examples/formatter.md)

# Dépendances

- [Conventions Laravel générales](/frameworks/laravel.md)
- [Laravel 13 — chemins](/frameworks/laravel/v13.md)

# Approche recommandée — binding `singleton` dans le conteneur

```php
// app/Providers/AppServiceProvider.php
use App\Services\{Singleton};

public function register(): void
{
    // Une seule instance pour toute la durée de vie de la requête.
    // Le conteneur résout et met en cache automatiquement.
    $this->app->singleton({Singleton}::class, function (Application $app) {
        return new {Singleton}(
            apiKey:  config('{domain}.api_key'),
            timeout: config('{domain}.timeout', 30),
        );
    });
}
```

```php
// app/Services/{Singleton}.php — classe normale, PAS de constructeur privé
class {Singleton}
{
    public function __construct(
        private readonly string $apiKey,
        private readonly int    $timeout,
    ) {}

    public function doSomething(): mixed
    {
        // Logique métier
    }
}
```

```php
// Utilisation — injection via type-hint (recommandé)
class {Consumer}Controller extends Controller
{
    public function __construct(private {Singleton} $service) {}

    public function handle(): JsonResponse
    {
        $result = $this->service->doSomething();
        return response()->json($result);
    }
}

// Ou résolution manuelle (scripts, factories)
$service = app({Singleton}::class);
```

# Scopes disponibles dans Laravel

```php
// singleton() — une instance par requête HTTP (ou par processus CLI)
$this->app->singleton({Singleton}::class, fn() => new {Singleton}(...));

// scoped()    — une instance par "scope" (utile avec Octane)
$this->app->scoped({Singleton}::class, fn() => new {Singleton}(...));

// bind()      — nouvelle instance à chaque résolution (pas un singleton)
$this->app->bind({Singleton}::class, fn() => new {Singleton}(...));
```

# Singleton GoF classique (hors conteneur — rarement nécessaire)

```php
// app/Services/{Singleton}.php
class {Singleton}
{
    private static ?self $instance = null;

    // Constructeur privé
    private function __construct(
        private readonly string $apiKey,
    ) {}

    // Empêcher le clonage
    private function __clone() {}

    public static function getInstance(): static
    {
        if (static::$instance === null) {
            static::$instance = new static(
                apiKey: config('{domain}.api_key'),
            );
        }
        return static::$instance;
    }

    public function doSomething(): mixed { /* ... */ }
}

// Utilisation
{Singleton}::getInstance()->doSomething();
```

# Choisir la bonne approche

| Situation | Approche recommandée |
|---|---|
| Service dans une app Laravel | `singleton()` dans le conteneur DI |
| Tests unitaires nécessaires | `singleton()` + interface mockable |
| Octane / multi-requêtes | `scoped()` |
| Hors conteneur (script pur, lib) | Singleton GoF classique |

# Règles à respecter

- Toujours préférer `singleton()` du conteneur au Singleton GoF — le
  premier est testable (swap via `$this->app->instance(...)`), le second non.
- Ne jamais stocker dans une instance singleton un état lié à la requête
  courante (utilisateur, tenant) — avec Octane, une instance singleton
  survit entre plusieurs requêtes.
- Si `scoped()` est utilisé avec Octane, s'assurer que le scope est
  réinitialisé entre les requêtes (Octane le fait automatiquement pour les
  bindings `scoped`).