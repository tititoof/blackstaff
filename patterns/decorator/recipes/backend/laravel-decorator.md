---
type: Recipe
title: Decorator Laravel — générique
tags: [laravel, backend, decorator, design-pattern]
---

# Quand utiliser ce pattern

Même cas d'usage que Rails. Exemples concrets :
- [Logging d'un service](/patterns/decorator/recipes/backend/examples/logging.md)
- [Cache d'un service](/patterns/decorator/recipes/backend/examples/caching.md)
- [Middlewares comme Decorators](/patterns/decorator/recipes/backend/examples/middleware.md)

# Dépendances

- [Conventions Laravel générales](/frameworks/laravel.md)
- [Laravel 13 — chemins](/frameworks/laravel/v13.md)

# Structure des fichiers

```
app/Services/{Domain}s/
├── Contracts/{Component}Interface.php
├── {ConcreteComponent}.php
└── Decorators/
    ├── Abstract{Decorator}.php
    ├── {DecoratorA}{Decorator}.php
    └── {DecoratorB}{Decorator}.php
```

# Interface

```php
// app/Services/{Domain}s/Contracts/{Component}Interface.php
interface {Component}Interface
{
    public function {operation}(array $args): mixed;
}
```

# Composant concret

```php
// app/Services/{Domain}s/{ConcreteComponent}.php
class {ConcreteComponent} implements {Component}Interface
{
    public function {operation}(array $args): mixed
    {
        // Implémentation réelle
    }
}
```

# Base Decorator

```php
// app/Services/{Domain}s/Decorators/Abstract{Decorator}.php
abstract class Abstract{Decorator} implements {Component}Interface
{
    public function __construct(
        protected readonly {Component}Interface $wrapped,
    ) {}

    // Délégation par défaut — surcharger uniquement ce qu'on enrichit
    public function {operation}(array $args): mixed
    {
        return $this->wrapped->{operation}($args);
    }
}
```

# Decorator concret

```php
// app/Services/{Domain}s/Decorators/{DecoratorA}{Decorator}.php
class {DecoratorA}{Decorator} extends Abstract{Decorator}
{
    public function __construct(
        {Component}Interface $wrapped,
        // Injecter les dépendances spécifiques à ce Decorator
        private readonly LoggerInterface $logger,
    ) {
        parent::__construct($wrapped);
    }

    public function {operation}(array $args): mixed
    {
        $this->before($args);
        $result = parent::{operation}($args);   // délégation
        $this->after($result, $args);
        return $result;
    }

    private function before(array $args): void
    {
        // Pré-traitement
    }

    private function after(mixed $result, array $args): void
    {
        // Post-traitement
    }
}
```

# Assemblage via le conteneur Laravel (recommandé)

```php
// app/Providers/AppServiceProvider.php
$this->app->bind({Component}Interface::class, function (Application $app) {
    // Empiler les Decorators depuis l'intérieur vers l'extérieur
    $service = app({ConcreteComponent}::class);
    $service = new {DecoratorA}{Decorator}($service, app(LoggerInterface::class));
    $service = new {DecoratorB}{Decorator}($service, app(CacheManager::class));
    return $service;
});

// Le code client injecte toujours l'interface — jamais la classe concrète
class {Consumer}Controller extends Controller
{
    public function __construct(
        private readonly {Component}Interface $service
    ) {}
}
```

# Règles à respecter

- Lier `{Component}Interface` dans le conteneur, pas `{ConcreteComponent}` —
  le consumer ne doit jamais savoir combien de couches il y a.
- Utiliser `app()` pour les dépendances injectées dans les Decorators,
  pas `new` — bénéficie de l'injection de dépendances Laravel.
- Tester chaque Decorator isolément avec un mock du composant enveloppé,
  puis tester l'empilement complet en intégration.