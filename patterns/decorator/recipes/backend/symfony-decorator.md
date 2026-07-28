---
type: Recipe
title: Decorator Symfony — générique
tags: [symfony, backend, decorator, design-pattern]
---

# Quand utiliser ce pattern

Même cas d'usage. Symfony supporte le Decorator nativement via la
configuration DI avec `decorates:` — l'approche la plus élégante des
trois backends, sans factory manuelle.

Exemples concrets :
- [Logging d'un service](/patterns/decorator/recipes/backend/examples/logging.md)
- [Cache d'un service](/patterns/decorator/recipes/backend/examples/caching.md)
- [Middlewares comme Decorators](/patterns/decorator/recipes/backend/examples/middleware.md)

# Dépendances

- [Conventions Symfony générales](/frameworks/symfony.md)
- [Symfony 7.4 LTS — chemins](/frameworks/symfony/v7.md)

# Structure des fichiers

```
src/Service/{Domain}/
├── {Component}Interface.php
├── {ConcreteComponent}.php
└── Decorator/
    ├── {DecoratorA}{Component}.php
    └── {DecoratorB}{Component}.php
```

# Interface

```php
// src/Service/{Domain}/{Component}Interface.php
interface {Component}Interface
{
    public function {operation}(array $args): mixed;
}
```

# Composant concret

```php
// src/Service/{Domain}/{ConcreteComponent}.php
class {ConcreteComponent} implements {Component}Interface
{
    public function {operation}(array $args): mixed
    {
        // Implémentation réelle
    }
}
```

# Decorator concret

```php
// src/Service/{Domain}/Decorator/{DecoratorA}{Component}.php
class {DecoratorA}{Component} implements {Component}Interface
{
    public function __construct(
        private readonly {Component}Interface $inner,
        private readonly LoggerInterface      $logger,
    ) {}

    public function {operation}(array $args): mixed
    {
        $this->before($args);
        $result = $this->inner->{operation}($args);  // délégation
        $this->after($result, $args);
        return $result;
    }

    private function before(array $args): void { /* pré-traitement */ }
    private function after(mixed $result, array $args): void { /* post-traitement */ }
}
```

# Configuration DI — `decorates:` (idiome natif Symfony)

```yaml
# config/services.yaml
services:
    # Composant concret (service de base)
    App\Service\{Domain}\{ConcreteComponent}: ~

    # Decorator A enveloppe le ConcreteComponent
    App\Service\{Domain}\Decorator\{DecoratorA}{Component}:
        decorates: App\Service\{Domain}\{Component}Interface
        arguments:
            $inner: '@.inner'   # référence automatique au service décoré
            # autres arguments auto-wired

    # Decorator B enveloppe Decorator A
    App\Service\{Domain}\Decorator\{DecoratorB}{Component}:
        decorates: App\Service\{Domain}\{Component}Interface
        arguments:
            $inner: '@.inner'
```

Symfony résout automatiquement la chaîne : `{DecoratorB}` enveloppe
`{DecoratorA}` qui enveloppe `{ConcreteComponent}`. L'ordre est déterminé
par la priorité de décoration (`decoration_priority`, défaut: 0, plus haut
= couche extérieure).

# Injection dans un service — transparent

```php
// Symfony injecte automatiquement le service entièrement décoré
class {Consumer}
{
    public function __construct(
        private readonly {Component}Interface $service  // reçoit la chaîne complète
    ) {}
}
```

# Contrôler l'ordre des couches avec `decoration_priority`

```yaml
services:
    # Logging en couche extérieure (exécuté en premier)
    App\...\{LoggingDecorator}:
        decorates: App\...\{Component}Interface
        decoration_priority: 10   # plus haut = plus extérieur

    # Cache en couche intérieure (exécuté après le logging)
    App\...\{CachingDecorator}:
        decorates: App\...\{Component}Interface
        decoration_priority: 5
```

# Règles à respecter

- Symfony résout `@.inner` vers le service **que ce Decorator décore
  directement** — pas vers le service original. Avec deux Decorators,
  le Decorator B reçoit le Decorator A, pas le ConcreteComponent.
- Nommer le paramètre constructeur `$inner` par convention — Symfony
  le résout via `@.inner` dans la config. Nommer différemment nécessite
  d'ajuster le `arguments:` en conséquence.
- `decoration_inner_name` peut être utilisé pour nommer explicitement
  le service inner si plusieurs Decorators s'enchaînent et que la config
  devient ambiguë.