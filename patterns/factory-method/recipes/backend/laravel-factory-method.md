---
type: Recipe
title: Factory Method Laravel — générique
tags: [laravel, backend, factory-method, design-pattern]
---

# Quand utiliser ce pattern

Même cas d'usage que Rails. Exemples concrets :
- [Paiement](/patterns/factory-method/recipes/backend/examples/payment.md)
- [Export](/patterns/factory-method/recipes/backend/examples/export.md)
- [Notification](/patterns/factory-method/recipes/backend/examples/notification.md)

# Dépendances

- [Conventions Laravel générales](/frameworks/laravel.md)
- [Laravel 13 — chemins](/frameworks/laravel/v13.md)

# Structure des fichiers

```
app/Services/{Domain}s/
├── Contracts/
│   ├── {Product}Interface.php      ← Produit abstrait (interface PHP)
│   └── {Creator}Interface.php      ← Créateur abstrait (interface)
├── Products/
│   ├── {ConcreteA}{Product}.php
│   └── {ConcreteB}{Product}.php
├── Creators/
│   ├── Abstract{Creator}.php       ← Créateur abstrait (classe)
│   ├── {ConcreteA}{Creator}.php
│   └── {ConcreteB}{Creator}.php
└── {Creator}Factory.php            ← Résolveur
```

# Produit abstrait (interface)

```php
// app/Services/{Domain}s/Contracts/{Product}Interface.php
interface {Product}Interface
{
    // Déclarer ici les méthodes communes à tous les produits.
    // Le type de retour doit être assez générique pour couvrir
    // toutes les implémentations.
    public function perform(array $args): mixed;
}
```

# Produit concret (à dupliquer par implémentation)

```php
// app/Services/{Domain}s/Products/{ConcreteA}{Product}.php
class {ConcreteA}{Product} implements {Product}Interface
{
    public function perform(array $args): mixed
    {
        // Implémentation spécifique à {ConcreteA}
    }
}
```

# Créateur abstrait

```php
// app/Services/{Domain}s/Creators/Abstract{Creator}.php
abstract class Abstract{Creator}
{
    // Méthode fabrique — abstraite, redéfinie dans chaque sous-classe.
    // Retourne l'interface Produit, pas une classe concrète.
    abstract protected function create{Product}(): {Product}Interface;

    // Logique métier commune.
    public function execute(array $args): mixed
    {
        $product = $this->create{Product}();  // ← méthode fabrique

        $this->validate($args);
        $result = $product->perform($args);
        $this->afterExecute($result, $args);

        return $result;
    }

    // Validation commune — surcharger dans le Créateur concret
    // pour des règles spécifiques à l'implémentation.
    protected function validate(array $args): void
    {
        // ex: throw_if(empty($args['key']), \InvalidArgumentException::class, '...');
    }

    // Hook post-exécution — surcharger si nécessaire.
    protected function afterExecute(mixed $result, array $args): void
    {
        \Log::info('[{Domain}] executed', ['result' => $result]);
    }
}
```

# Créateur concret (à dupliquer par implémentation)

```php
// app/Services/{Domain}s/Creators/{ConcreteA}{Creator}.php
class {ConcreteA}{Creator} extends Abstract{Creator}
{
    // Redéfinit UNIQUEMENT la méthode fabrique.
    protected function create{Product}(): {Product}Interface
    {
        return app({ConcreteA}{Product}::class);
        // app() permet à Laravel d'injecter les dépendances
        // du Produit concret si nécessaire.
    }

    // Surcharger execute() uniquement si cette implémentation
    // a un pré/post-traitement spécifique.
    // public function execute(array $args): mixed
    // {
    //     return parent::execute(array_merge($args, ['extra' => $this->compute()]));
    // }
}
```

# Résolveur + binding dans le conteneur Laravel

```php
// app/Services/{Domain}s/{Creator}Factory.php
class {Creator}Factory
{
    private static array $creators = [
        '{concrete_a}' => {ConcreteA}{Creator}::class,
        '{concrete_b}' => {ConcreteB}{Creator}::class,
    ];

    public static function create(?string $type = null): Abstract{Creator}
    {
        $type ??= config('{domain}s.provider', '{concrete_a}');

        if (! isset(static::$creators[$type])) {
            throw new \InvalidArgumentException("Implémentation inconnue : {$type}");
        }

        return app(static::$creators[$type]);
    }
}
```

```php
// config/{domain}s.php
return ['provider' => env('{DOMAIN}_PROVIDER', '{concrete_a}')];
```

```php
// app/Providers/AppServiceProvider.php — binding recommandé
$this->app->bind(Abstract{Creator}::class, fn() => {Creator}Factory::create());
```

# Utilisation dans un controller

```php
class {Domain}Controller extends Controller
{
    // Injection via type-hint — Laravel résout via le binding AppServiceProvider
    public function __construct(private Abstract{Creator} $creator) {}

    public function handle(Request $request): JsonResponse
    {
        $result = $this->creator->execute($request->validated());
        return response()->json($result);
    }
}
```

# Ajouter une nouvelle implémentation (OCP)

```php
// 1. Nouveau Produit
class {ConcreteC}{Product} implements {Product}Interface {
    public function perform(array $args): mixed { ... }
}

// 2. Nouveau Créateur
class {ConcreteC}{Creator} extends Abstract{Creator} {
    protected function create{Product}(): {Product}Interface {
        return app({ConcreteC}{Product}::class);
    }
}

// 3. Enregistrer (seul fichier à modifier)
private static array $creators = [
    ...,
    '{concrete_c}' => {ConcreteC}{Creator}::class,
];
```

# Règles à respecter

- `create{Product}()` est `protected` — appelée uniquement par
  `Abstract{Creator}::execute()`, jamais depuis l'extérieur.
- Toujours utiliser `app()` plutôt que `new` dans `create{Product}()`
  pour bénéficier de l'injection de dépendances Laravel sur le Produit.
- Le binding dans `AppServiceProvider` est recommandé (pas obligatoire)
  pour permettre le mock des Créateurs dans les tests.
- Ne jamais injecter un Créateur concret directement dans un controller
  — toujours via le type-hint `Abstract{Creator}`.