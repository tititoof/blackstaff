---
type: Example
title: Decorator — exemple Middlewares
tags: [decorator, middleware, rails, laravel, symfony]
---

# Les middlewares SONT des Decorators

Les middlewares HTTP de Rails/Laravel/Symfony implémentent exactement le
pattern Decorator : chaque middleware enveloppe la requête/réponse, ajoute
son comportement, puis passe la main au middleware suivant (ou au controller).

```
Request → [AuthMiddleware → LogMiddleware → RateLimitMiddleware → Controller] → Response
           Decorator A        Decorator B      Decorator C          ConcreteComponent
```

Comprendre ce lien aide à créer des middlewares idiomatiques et à savoir
quand préférer un Decorator GoF explicite à un middleware.

# Quand middleware vs Decorator GoF

| | Middleware | Decorator GoF |
|---|---|---|
| Portée | Toutes les requêtes HTTP (ou filtrées par route) | Un service précis |
| Sujet | Requête/réponse HTTP | N'importe quel objet |
| Contexte | Couche HTTP uniquement | Couche service/domaine |
| Quand utiliser | Auth, logging HTTP, CORS, rate limiting | Cache service, logging métier, retry |

# Rails — middleware Rack (Decorator sur la stack HTTP)

```ruby
# lib/middleware/request_logging_middleware.rb
class RequestLoggingMiddleware
  def initialize(app)  # ← reçoit le "wrapped" (app = prochain middleware ou controller)
    @app = app
    @logger = Rails.logger
  end

  def call(env)  # ← la méthode commune de tous les middlewares Rack
    request = Rack::Request.new(env)
    start   = Process.clock_gettime(Process::CLOCK_MONOTONIC)

    @logger.info("[HTTP] #{request.request_method} #{request.path}")

    status, headers, body = @app.call(env)  # ← délégation au middleware suivant

    duration = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start) * 1000).round(2)
    @logger.info("[HTTP] #{status} in #{duration}ms")

    [status, headers, body]  # ← retourne la réponse (peut la modifier)
  end
end

# config/application.rb — enregistrement (empilement)
config.middleware.insert_before ActionDispatch::Logger, RequestLoggingMiddleware
```

# Laravel — middleware HTTP (Decorator sur Request/Response)

```php
// app/Http/Middleware/RequestLoggingMiddleware.php
class RequestLoggingMiddleware
{
    public function __construct(private readonly LoggerInterface $logger) {}

    public function handle(Request $request, Closure $next): Response
    {
        // Pré-traitement (avant la délégation)
        $start = microtime(true);
        $this->logger->info('[HTTP] '.$request->method().' '.$request->path());

        $response = $next($request);  // ← délégation au middleware suivant / controller

        // Post-traitement (après la délégation)
        $this->logger->info('[HTTP] '.$response->status().' in '.
            round((microtime(true) - $start) * 1000, 2).'ms');

        return $response;  // ← peut modifier la réponse avant de la retourner
    }
}

// app/Http/Kernel.php — enregistrement dans la pile de middlewares
protected $middleware = [
    RequestLoggingMiddleware::class,
    // autres middlewares...
];
```

# Symfony — EventSubscriber sur les événements kernel (équivalent middleware)

```php
// src/EventSubscriber/RequestLoggingSubscriber.php
class RequestLoggingSubscriber implements EventSubscriberInterface
{
    private array $startTimes = [];

    public function __construct(private readonly LoggerInterface $logger) {}

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST  => ['onRequest', 20],   // priorité haute = exécuté tôt
            KernelEvents::RESPONSE => ['onResponse', -20], // priorité basse = exécuté tard
        ];
    }

    public function onRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();
        $this->startTimes[$request->getPathInfo()] = microtime(true);
        $this->logger->info('[HTTP] '.$request->getMethod().' '.$request->getPathInfo());
    }

    public function onResponse(ResponseEvent $event): void
    {
        $path     = $event->getRequest()->getPathInfo();
        $duration = round((microtime(true) - ($this->startTimes[$path] ?? 0)) * 1000, 2);
        $this->logger->info('[HTTP] '.$event->getResponse()->getStatusCode().' in '.$duration.'ms');
        unset($this->startTimes[$path]);
    }
}
```

# Créer un middleware custom : les trois vérifications GoF

Pour qu'un middleware soit un bon Decorator, vérifier :

1. **Interface commune** — Rack (`call(env)`), Laravel (`handle(Request, Closure)`),
   Symfony (`EventSubscriberInterface`) définissent chacun l'interface commune.
2. **Délégation obligatoire** — `@app.call(env)` / `$next($request)` / event propagation.
   Un middleware qui ne délègue pas interrompt la chaîne (cas intentionnel : auth failed,
   rate limit exceeded).
3. **Comportement ajouté sans modifier le controller** — le controller ne sait pas
   quels middlewares l'enveloppent, il ne reçoit que la requête déjà traitée.