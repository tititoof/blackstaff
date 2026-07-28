---
type: Recipe
title: Observer Laravel — générique
tags: [laravel, backend, observer, design-pattern]
---

# Quand utiliser ce pattern

Réagir aux événements du cycle de vie d'un modèle Eloquent ou d'un
événement applicatif personnalisé. Laravel implémente nativement les
deux variantes du pattern.

Exemples concrets :
- [Laravel Model Observers](/patterns/observer/recipes/backend/examples/model-observer.md)
- [EventSubscriber Symfony équivalent](/patterns/observer/recipes/backend/examples/event-subscriber.md)

# Dépendances

- [Conventions Laravel générales](/frameworks/laravel.md)
- [Laravel 13 — chemins](/frameworks/laravel/v13.md)

# Deux mécanismes Observer natifs Laravel

## Mécanisme 1 — Model Observers (Observer GoF natif Eloquent)

```php
// app/Observers/{Subject}Observer.php
// Générer avec : php artisan make:observer {Subject}Observer --model={Subject}
class {Subject}Observer
{
    public function created({Subject} $subject): void
    {
        // Notifié après chaque création
        {ObserverA}::dispatch($subject);
    }

    public function updated({Subject} $subject): void
    {
        // Notifié après chaque mise à jour
        if ($subject->wasChanged('{field}')) {
            {ObserverB}::dispatch($subject);
        }
    }

    public function deleted({Subject} $subject): void
    {
        // Notifié après chaque suppression
    }
}

// Enregistrement dans un ServiceProvider
// app/Providers/AppServiceProvider.php
public function boot(): void
{
    {Subject}::observe({Subject}Observer::class);
}
```

## Mécanisme 2 — Events & Listeners (Observer GoF explicite)

Plus flexible que les Model Observers — découple complètement le Sujet
des Observateurs, supporte les événements sur n'importe quel objet.

```php
// Événement (le payload de la notification)
// app/Events/{Event}.php
// php artisan make:event {Event}
class {Event}
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly {Subject} $subject,
        public readonly array $metadata = [],
    ) {}
}

// Listener (l'Observateur)
// app/Listeners/{Observer}.php
// php artisan make:listener {Observer} --event={Event}
class {Observer}
{
    // Injection de dépendances dans le Listener
    public function __construct(
        private readonly LoggerInterface $logger,
    ) {}

    // Rendre le Listener asynchrone (file de jobs) en implémentant ShouldQueue
    // implements ShouldQueue

    public function handle({Event} $event): void
    {
        // Réagir à l'événement
        $this->logger->info('[{Observer}] Handling {Event}', [
            'subject_id' => $event->subject->id,
        ]);
    }
}

// Enregistrement dans EventServiceProvider
// app/Providers/EventServiceProvider.php
protected $listen = [
    {Event}::class => [
        {ObserverA}::class,
        {ObserverB}::class,
    ],
];

// Emission de l'événement (Sujet)
{Event}::dispatch($subject, ['extra' => 'data']);
// ou
event(new {Event}($subject));
```

# Choisir entre Model Observer et Events/Listeners

| | Model Observer | Events / Listeners |
|---|---|---|
| Sujet | Modèle Eloquent uniquement | N'importe quel objet |
| Découplage | Moyen (lié au modèle) | Fort (Event comme interface) |
| Async (ShouldQueue) | Non natif | ✅ natif |
| Test | Mocké via `{Subject}::withoutObservers()` | Mocké via `Event::fake()` |
| Quand utiliser | Logique liée au cycle de vie du modèle | Événements métier transverses |

# Règles à respecter

- Toujours implémenter `ShouldQueue` sur les Listeners qui font des
  opérations lentes (emails, appels API, notifications) — un Listener
  synchrone bloque la requête HTTP.
- Utiliser `{Subject}::withoutObservers(fn() => ...)` dans les seeds et
  les tests qui créent des enregistrements de masse — évite de déclencher
  des emails en masse ou des jobs inutiles.
- `$subject->wasChanged('{field}')` dans `updated()` pour ne réagir qu'aux
  changements de champs pertinents — sans ce filtre, l'Observer se déclenche
  pour toute mise à jour même sans rapport.