---
type: Recipe
title: Observer Symfony — générique
tags: [symfony, backend, observer, design-pattern]
---

# Quand utiliser ce pattern

Réagir à des événements applicatifs via le système d'événements natif
Symfony (EventDispatcher). C'est l'implémentation Observer la plus
explicite et la plus découplée des trois backends.

Exemples concrets :
- [EventSubscriber Symfony](/patterns/observer/recipes/backend/examples/event-subscriber.md)

# Dépendances

- [Conventions Symfony générales](/frameworks/symfony.md)
- [Symfony 7.4 LTS — chemins](/frameworks/symfony/v7.md)

# Deux variantes d'Observateurs en Symfony

## EventListener vs EventSubscriber

| | EventListener | EventSubscriber |
|---|---|---|
| Configuration | `services.yaml` (tag `kernel.event_listener`) | `getSubscribedEvents()` dans la classe |
| Réutilisabilité | Un Listener = un événement | Un Subscriber = plusieurs événements |
| Quand utiliser | Listener simple et ciblé | Observer qui réagit à plusieurs événements liés |

## L'Événement (payload)

```php
// src/Event/{Event}.php
class {Event}
{
    public function __construct(
        private readonly {Subject} $subject,
        private readonly array $metadata = [],
    ) {}

    public function getSubject(): {Subject} { return $this->subject; }
    public function getMetadata(): array    { return $this->metadata; }
}
```

## EventListener (un événement)

```php
// src/EventListener/{Observer}Listener.php
class {Observer}Listener
{
    public function __construct(
        private readonly LoggerInterface $logger,
        // Autres dépendances auto-wired
    ) {}

    public function __invoke({Event} $event): void
    {
        // Réagir à l'événement
        $this->logger->info('[{Observer}] {Event} reçu', [
            'subject_id' => $event->getSubject()->getId(),
        ]);
    }
}
```

```yaml
# config/services.yaml
services:
    App\EventListener\{Observer}Listener:
        tags:
            - name: kernel.event_listener
              event: App\Event\{Event}
              # method: '__invoke'  # optionnel si la classe est invokable
```

## EventSubscriber (plusieurs événements)

```php
// src/EventSubscriber/{Observer}Subscriber.php
class {Observer}Subscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly LoggerInterface $logger,
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [
            {EventA}::class => 'onEventA',
            {EventB}::class => ['onEventB', 10],  // priorité 10 (défaut: 0, plus haut = plus tôt)
        ];
    }

    public function onEventA({EventA} $event): void
    {
        // Réagir à EventA
    }

    public function onEventB({EventB} $event): void
    {
        // Réagir à EventB
    }
}
// EventSubscriber auto-détecté par Symfony Flex — pas de config services.yaml nécessaire
```

## Émission de l'événement (Sujet)

```php
// Dans n'importe quel service — injection du EventDispatcherInterface
class {SubjectService}
{
    public function __construct(
        private readonly EventDispatcherInterface $dispatcher,
        private readonly EntityManagerInterface $em,
    ) {}

    public function performAction({Subject} $subject): void
    {
        // Logique métier...
        $this->em->flush();

        // Notification de tous les Observateurs
        $this->dispatcher->dispatch(new {Event}($subject, ['extra' => 'data']));
    }
}
```

## Observateur asynchrone (via Messenger)

Pour rendre un Observateur asynchrone sans bloquer la requête :

```php
// src/EventListener/{Observer}Listener.php
// Implémenter AsMessageHandler et dispatcher via Messenger
class {Observer}Listener implements MessageHandlerInterface
{
    public function __invoke({Event} $event): void { /* ... */ }
}
```

```yaml
# config/packages/messenger.yaml
routing:
    'App\Event\{Event}': async   # → file de messages asynchrone
```

# Règles à respecter

- Dispatcher l'événement **après** le `flush()` de Doctrine — sinon les
  Observateurs reçoivent un événement pour une entité pas encore persistée.
- Utiliser les priorités (`['onEvent', 10]`) si l'ordre de notification
  entre Subscribers est important — sans priorité explicite, l'ordre est
  indéterminé.
- Préférer Messenger pour les Observateurs lourds (emails, API externes)
  plutôt que des appels synchrones dans le Listener — la requête HTTP n'attend
  pas et l'utilisateur obtient sa réponse immédiatement.