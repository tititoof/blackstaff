---
type: Recipe
title: Singleton Symfony — générique
tags: [symfony, backend, singleton, design-pattern]
---

# Contexte Symfony : le conteneur DI est le singleton par défaut

Symfony auto-wire les services en scope **singleton par défaut** — chaque
service est instancié une seule fois par le conteneur et réutilisé pour
toute la requête. Il n'y a **aucune raison** d'implémenter le Singleton GoF
dans une application Symfony standard.

```yaml
# config/services.yaml
# Par défaut, TOUS les services sont en scope singleton dans Symfony :
services:
    _defaults:
        shared: true   # ← valeur par défaut, une instance par conteneur
```

Le Singleton GoF classique n'est utile que pour : du code hors contexte
Symfony (commandes standalone, bibliothèques autonomes sans DI).

Exemples concrets :
- [Client API partagé](/patterns/singleton/recipes/backend/examples/api-client.md)
- [Configuration globale](/patterns/singleton/recipes/backend/examples/app-config.md)
- [Service formateur (sans état)](/patterns/singleton/recipes/backend/examples/formatter.md)

# Dépendances

- [Conventions Symfony générales](/frameworks/symfony.md)
- [Symfony 7.4 LTS — chemins](/frameworks/symfony/v7.md)

# Approche recommandée — service Symfony normal (singleton automatique)

```php
// src/Service/{Singleton}.php — classe normale, PAS de constructeur privé
class {Singleton}
{
    public function __construct(
        private readonly string $apiKey,
        private readonly int    $timeout,
        private readonly LoggerInterface $logger,
    ) {}

    public function doSomething(): mixed
    {
        // Logique métier
        $this->logger->info('[{Singleton}] doSomething called');
    }
}
```

```yaml
# config/services.yaml — auto-wired, shared: true par défaut
services:
    App\Service\{Singleton}:
        arguments:
            $apiKey:  '%env({DOMAIN}_API_KEY)%'
            $timeout: '%env(int:{DOMAIN}_TIMEOUT)%'
        # shared: true  ← implicite, une seule instance par conteneur
```

```php
// Utilisation dans un controller — injection via type-hint
class {Consumer}Controller extends AbstractController
{
    public function __construct(private {Singleton} $service) {}

    #[Route('/api/{domain}', methods: ['POST'])]
    public function handle(Request $request): JsonResponse
    {
        $result = $this->service->doSomething();
        return $this->json($result);
    }
}
```

# Cas non-partagé (shared: false) — nouvelle instance à chaque injection

```yaml
# Utile si le service a un état interne qui ne doit pas être partagé
# entre deux injections dans la même requête
services:
    App\Service\{Singleton}:
        shared: false
```

# Singleton GoF classique (hors conteneur — rarement nécessaire)

```php
// src/Service/{Singleton}.php
class {Singleton}
{
    private static ?self $instance = null;

    private function __construct(
        private readonly string $apiKey,
    ) {}

    private function __clone() {}

    public static function getInstance(string $apiKey = ''): static
    {
        if (static::$instance === null) {
            static::$instance = new static($apiKey ?: $_ENV['{DOMAIN}_API_KEY'] ?? '');
        }
        return static::$instance;
    }

    public function doSomething(): mixed { /* ... */ }
}
```

# Choisir la bonne approche

| Situation | Approche recommandée |
|---|---|
| Service dans une app Symfony | Service auto-wired (`shared: true` par défaut) |
| État interne non partageable | `shared: false` |
| Tests unitaires | Service normal + mock via l'interface |
| Hors conteneur (script CLI autonome) | Singleton GoF classique |

# Règles à respecter

- Ne jamais implémenter le Singleton GoF dans un service Symfony
  standard — le conteneur gère déjà l'unicité, le pattern est redondant
  et nuit à la testabilité.
- Avec Symfony Runtime (Swoole, RoadRunner), les services `shared: true`
  persistent entre les requêtes — ne jamais stocker un état lié à la
  requête courante dans un service partagé.
- Toujours passer les paramètres via le conteneur (env vars, paramètres)
  plutôt que via `$_ENV` directement dans le service.