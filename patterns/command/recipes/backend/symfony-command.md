---
type: Recipe
title: Command Symfony — générique
tags: [symfony, backend, command, design-pattern]
---

# Quand utiliser ce pattern

Même cas d'usage. Symfony Messenger implémente nativement le pattern
Command avec un bus de messages et des handlers auto-wired.

Exemples concrets :
- [Jobs Messenger comme Commands](/patterns/command/recipes/backend/examples/job-queue.md)
- [Action transactionnelle complexe](/patterns/command/recipes/backend/examples/transaction.md)
- [Traitement par lot](/patterns/command/recipes/backend/examples/batch.md)

# Dépendances

- [Conventions Symfony générales](/frameworks/symfony.md)
- [Symfony 7.4 LTS — chemins](/frameworks/symfony/v7.md)

# Structure des fichiers

```
src/Command/
└── {Command}.php               ← Message (Command = objet de données immutable)
src/Handler/
└── {Command}Handler.php        ← Handler (Receiver)
```

# La Command (Message Messenger)

```php
// src/Command/{Command}.php
final class {Command}
{
    public function __construct(
        // Immutable — tous les paramètres en readonly
        public readonly {TypeA} ${paramA},
        public readonly {TypeB} ${paramB},
        public readonly \DateTimeImmutable $dispatchedAt = new \DateTimeImmutable(),
    ) {}
}
```

# Le Handler (Receiver)

```php
// src/Handler/{Command}Handler.php
class {Command}Handler implements MessageHandlerInterface
{
    public function __construct(
        private readonly {Receiver} $receiver,
        private readonly LoggerInterface $logger,
    ) {}

    // __invoke = méthode standard pour les handlers Messenger
    public function __invoke({Command} $command): void
    {
        $this->logger->info('[{Command}] Handling', [
            'param_a'      => $command->{paramA},
            'dispatched_at' => $command->dispatchedAt->format('c'),
        ]);

        $this->receiver->{action}(
            paramA: $command->{paramA},
            paramB: $command->{paramB},
        );
    }
}
// Handler auto-détecté par Symfony via MessageHandlerInterface
```

# Configuration Messenger

```yaml
# config/packages/messenger.yaml
framework:
    messenger:
        buses:
            command.bus:           # Bus dédié aux Commands (synchrone par défaut)
                middleware:
                    - doctrine_transaction  # wrappe chaque handler dans une transaction

        routing:
            # Synchrone (par défaut si non routé)
            # App\Command\{SyncCommand}: sync

            # Asynchrone via file
            'App\Command\{Command}': async
```

# Dispatching

```php
// Injection du bus dans un controller ou service
class {Consumer}Controller extends AbstractController
{
    public function __construct(
        private readonly MessageBusInterface $commandBus,
    ) {}

    #[Route('/api/{domain}s', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $this->commandBus->dispatch(new {Command}(
            paramA: $data['param_a'],
            paramB: $data['param_b'],
        ));

        return $this->json(['status' => 'accepted'], 202);
    }
}
```

# Récupérer un résultat depuis un handler synchrone

```php
// Via les Stamps Messenger
use Symfony\Component\Messenger\Stamp\HandledStamp;

$envelope = $this->commandBus->dispatch(new {Command}(...));
$result   = $envelope->last(HandledStamp::class)?->getResult();
```

# Middleware de transaction (recommandé pour les Commands)

Le middleware `doctrine_transaction` dans la config Messenger wrappe
automatiquement chaque handler dans une transaction Doctrine — si le
handler lève une exception, le rollback est automatique. C'est l'équivalent
de `DB::transaction()` en Laravel, sans avoir à l'écrire dans chaque handler.

# Règles à respecter

- La Command est un **objet de données pur** — pas de logique métier, pas
  de dépendances injectées. Toutes les propriétés en `readonly`.
- Le Handler fait **une seule chose** — si la logique est complexe, déléguer
  à un service (`{Receiver}`) et garder le Handler fin.
- Nommer la Command au **passé pour les événements**, à **l'impératif pour
  les commands** : `CreateOrder` (Command) vs `OrderCreated` (Event). Ne
  pas mélanger les deux dans le même bus.
- Toujours définir un `routing` explicite dans `messenger.yaml` — sans ça,
  toutes les Commands sont synchrones par défaut, ce qui peut bloquer les
  requêtes HTTP sur des opérations longues.