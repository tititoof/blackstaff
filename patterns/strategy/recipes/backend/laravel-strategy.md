---
type: Recipe
title: Strategy Laravel — générique
tags: [laravel, backend, strategy, design-pattern]
---

# Quand utiliser ce pattern

Même cas d'usage que Rails. Exemples concrets :
- [Calcul de prix](/patterns/strategy/recipes/backend/examples/pricing.md)
- [Validation](/patterns/strategy/recipes/backend/examples/validation.md)
- [Tri](/patterns/strategy/recipes/backend/examples/sorting.md)

# Dépendances

- [Conventions Laravel générales](/frameworks/laravel.md)
- [Laravel 13 — chemins](/frameworks/laravel/v13.md)

# Structure des fichiers

```
app/Strategies/{Domain}s/
├── Contracts/{Strategy}Interface.php   ← interface Strategy
├── {ConcreteA}{Strategy}.php
├── {ConcreteB}{Strategy}.php
└── {ConcreteC}{Strategy}.php
app/Services/
└── {Context}.php                       ← contexte
```

# Interface Strategy

```php
// app/Strategies/{Domain}s/Contracts/{Strategy}Interface.php
interface {Strategy}Interface
{
    // Toutes les stratégies concrètes implémentent cette méthode.
    // Mêmes paramètres, même type de retour pour toutes.
    public function execute(array $args): mixed;
}
```

# Stratégies concrètes

```php
// app/Strategies/{Domain}s/{ConcreteA}{Strategy}.php
class {ConcreteA}{Strategy} implements {Strategy}Interface
{
    public function execute(array $args): mixed
    {
        // Implémentation de l'algorithme A
    }
}

// app/Strategies/{Domain}s/{ConcreteB}{Strategy}.php
class {ConcreteB}{Strategy} implements {Strategy}Interface
{
    public function execute(array $args): mixed
    {
        // Implémentation de l'algorithme B
    }
}
```

# Contexte

```php
// app/Services/{Context}.php
class {Context}
{
    private {Strategy}Interface $strategy;

    public function __construct({Strategy}Interface $strategy)
    {
        $this->strategy = $strategy;
    }

    // Changer la stratégie au runtime si nécessaire
    public function setStrategy({Strategy}Interface $strategy): void
    {
        $this->strategy = $strategy;
    }

    // Délègue sans connaître l'implémentation
    public function run(array $args): mixed
    {
        return $this->strategy->execute($args);
    }
}
```

# Binding dans le conteneur + résolveur

```php
// app/Providers/AppServiceProvider.php
$this->app->bind({Strategy}Interface::class, function () {
    $type = config('{domain}.strategy', '{concrete_a}');
    return match($type) {
        '{concrete_a}' => app({ConcreteA}{Strategy}::class),
        '{concrete_b}' => app({ConcreteB}{Strategy}::class),
        '{concrete_c}' => app({ConcreteC}{Strategy}::class),
        default        => throw new \InvalidArgumentException("Stratégie inconnue : {$type}"),
    };
});
```

```php
// Résolveur dédié (alternative au binding direct)
class {Strategy}Resolver
{
    private static array $strategies = [
        '{concrete_a}' => {ConcreteA}{Strategy}::class,
        '{concrete_b}' => {ConcreteB}{Strategy}::class,
        '{concrete_c}' => {ConcreteC}{Strategy}::class,
    ];

    public static function resolve(string $type): {Strategy}Interface
    {
        if (! isset(static::$strategies[$type])) {
            throw new \InvalidArgumentException("Stratégie inconnue : {$type}");
        }
        return app(static::$strategies[$type]);
    }
}
```

# Utilisation dans un controller

```php
class {Domain}Controller extends Controller
{
    // Injection via type-hint — résolu par le binding AppServiceProvider
    public function __construct(private {Context} $context) {}

    public function handle(Request $request): JsonResponse
    {
        $result = $this->context->run($request->validated());
        return response()->json($result);
    }
}

// Ou résolution manuelle selon un paramètre de la requête
public function handle(Request $request): JsonResponse
{
    $strategy = {Strategy}Resolver::resolve($request->input('type'));
    $context  = new {Context}($strategy);
    return response()->json($context->run($request->validated()));
}
```

# Règles à respecter

- Toujours typer le paramètre du Contexte avec `{Strategy}Interface`,
  jamais avec une classe concrète — c'est ce qui garantit l'interchangeabilité.
- Utiliser `app()` dans le résolveur pour bénéficier de l'injection de
  dépendances Laravel dans les stratégies concrètes.
- Ne jamais mettre de `if ($strategy instanceof {ConcreteA}{Strategy})`
  dans le Contexte — cela revient à annuler le pattern.