---
type: Recipe
title: Command Laravel — générique
tags: [laravel, backend, command, design-pattern]
---

# Quand utiliser ce pattern

Même cas d'usage que Rails. Laravel dispose d'un bus de commandes natif
via le package `laravel/bus` (inclus dans le framework) — deux variantes
selon le besoin : synchrone (Command Bus) ou asynchrone (Job).

Exemples concrets :
- [Jobs Horizon comme Commands](/patterns/command/recipes/backend/examples/job-queue.md)
- [Action transactionnelle complexe](/patterns/command/recipes/backend/examples/transaction.md)
- [Traitement par lot](/patterns/command/recipes/backend/examples/batch.md)

# Dépendances

- [Conventions Laravel générales](/frameworks/laravel.md)
- [Laravel 13 — chemins](/frameworks/laravel/v13.md)

# Structure des fichiers

```
app/Commands/
├── {Command}.php               ← Command synchrone
app/Jobs/
└── {Command}Job.php            ← Command asynchrone (Job)
app/Handlers/
└── {Command}Handler.php        ← Handler (Receiver)
```

# Approche 1 — Command synchrone (Command Bus Laravel)

```php
// app/Commands/{Command}.php
final class {Command}
{
    public function __construct(
        // Les paramètres font partie de la Command — immutables (readonly)
        public readonly {TypeA} ${paramA},
        public readonly {TypeB} ${paramB},
    ) {}
}

// app/Handlers/{Command}Handler.php
class {Command}Handler
{
    public function __construct(
        private readonly {Receiver} $receiver,
        private readonly LoggerInterface $logger,
    ) {}

    public function handle({Command} $command): {ResultType}
    {
        $this->logger->info('[{Command}] Handling', [
            'param_a' => $command->{paramA},
        ]);

        return $this->receiver->{action}(
            paramA: $command->{paramA},
            paramB: $command->{paramB},
        );
    }
}

// Enregistrement dans AppServiceProvider
$this->app->bind({Command}Handler::class);

// Dispatching via le bus
$result = app(Dispatcher::class)->dispatchSync(
    new {Command}(paramA: $valueA, paramB: $valueB)
);
```

# Approche 2 — Command asynchrone (Job avec ShouldQueue)

```php
// app/Jobs/{Command}Job.php
class {Command}Job implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    // Propriétés de retry/timeout
    public int $tries   = 3;
    public int $timeout = 60;

    public function __construct(
        // Sérialisé automatiquement par SerializesModels
        public readonly {TypeA} ${paramA},
        public readonly int     $userId,  // toujours stocker l'id, pas l'objet complet
    ) {}

    public function handle({Receiver} $receiver, LoggerInterface $logger): void
    {
        $logger->info('[{Command}Job] Handling', ['param_a' => $this->{paramA}]);

        $receiver->{action}(
            paramA: $this->{paramA},
            userId: $this->userId,
        );
    }

    // Gestion de l'échec après tous les retries
    public function failed(\Throwable $exception): void
    {
        Log::error('[{Command}Job] Failed after retries', [
            'error'   => $exception->getMessage(),
            'param_a' => $this->{paramA},
        ]);
        // Notification, compensation, alerting...
    }
}

// Dispatching
{Command}Job::dispatch($valueA, $userId);
{Command}Job::dispatch($valueA, $userId)->delay(now()->addMinutes(5));
{Command}Job::dispatch($valueA, $userId)->onQueue('high');
```

# Choisir entre Command synchrone et Job

| | Command synchrone | Job (asynchrone) |
|---|---|---|
| Résultat immédiat nécessaire | ✅ | ❌ |
| Opération longue / lourde | ❌ | ✅ |
| Retry automatique | ❌ | ✅ |
| Annulable (undo) | ✅ possible | ❌ complexe |
| Traçabilité queue | ❌ | ✅ (Horizon) |

# Règles à respecter

- Toujours utiliser `readonly` sur les propriétés de la Command/Job —
  une Command ne doit pas être muable après création.
- `SerializesModels` sérialise les objets Eloquent par leur id — ne jamais
  stocker un objet Eloquent complet dans un Job, toujours l'id seul.
- `failed()` est obligatoire sur les Jobs critiques — sans ça, les échecs
  silencieux après retry sont impossibles à détecter.
- Un Job doit être **idempotent** — si rejoué deux fois, le résultat doit
  être identique à une seule exécution. Vérifier si l'action a déjà été
  effectuée avant de l'exécuter.