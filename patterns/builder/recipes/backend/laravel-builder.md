---
type: Recipe
title: Builder Laravel — générique
tags: [laravel, backend, builder, design-pattern]
---

# Quand utiliser ce pattern

Même cas d'usage que Rails. Exemples concrets :
- [Rapport (PDF, CSV)](/patterns/builder/recipes/backend/examples/report-builder.md)
- [Requête complexe](/patterns/builder/recipes/backend/examples/query-builder.md)

# Dépendances

- [Conventions Laravel générales](/frameworks/laravel.md)
- [Laravel 13 — chemins](/frameworks/laravel/v13.md)

# Structure des fichiers

```
app/Builders/{Domain}s/
├── Contracts/
│   └── {Builder}Interface.php    ← Interface Builder
├── {ConcreteA}{Builder}.php      ← ConcreteBuilder A
├── {ConcreteB}{Builder}.php      ← ConcreteBuilder B
└── {Director}.php                ← Director
```

# Interface Builder

```php
// app/Builders/{Domain}s/Contracts/{Builder}Interface.php
interface {Builder}Interface
{
    // Réinitialise le produit en cours de construction.
    public function reset(): static;

    // Étapes de construction — retournent static pour le chaînage fluent.
    public function stepA(array $opts = []): static;
    public function stepB(array $opts = []): static;
    public function stepC(array $opts = []): static;

    // getResult() n'est PAS dans l'interface — les produits peuvent
    // avoir des types différents incompatibles avec un type de retour unique.
}
```

# ConcreteBuilder (à dupliquer par représentation)

```php
// app/Builders/{Domain}s/{ConcreteA}{Builder}.php
class {ConcreteA}{Builder} implements {Builder}Interface
{
    private {ProductA} $product;

    public function __construct()
    {
        $this->reset();
    }

    public function reset(): static
    {
        $this->product = new {ProductA}();
        return $this;
    }

    public function stepA(array $opts = []): static
    {
        $this->product->setPartA($this->buildPartA($opts));
        return $this;
    }

    public function stepB(array $opts = []): static
    {
        $this->product->setPartB($this->buildPartB($opts));
        return $this;
    }

    public function stepC(array $opts = []): static
    {
        $this->product->setPartC($this->buildPartC($opts));
        return $this;
    }

    // Retourne le produit fini et réinitialise le builder.
    public function getResult(): {ProductA}
    {
        $product = $this->product;
        $this->reset();
        return $product;
    }

    private function buildPartA(array $opts): mixed
    {
        // Logique de construction spécifique à {ConcreteA}
    }

    private function buildPartB(array $opts): mixed { ... }
    private function buildPartC(array $opts): mixed { ... }
}
```

# Director

```php
// app/Builders/{Domain}s/{Director}.php
class {Director}
{
    private {Builder}Interface $builder;

    public function __construct({Builder}Interface $builder)
    {
        $this->builder = $builder;
    }

    public function setBuilder({Builder}Interface $builder): void
    {
        $this->builder = $builder;
    }

    // Recette minimale.
    public function buildMinimal(array $opts = []): void
    {
        $this->builder->reset()->stepA($opts);
    }

    // Recette complète.
    public function buildFull(array $opts = []): void
    {
        $this->builder
            ->reset()
            ->stepA($opts)
            ->stepB($opts)
            ->stepC($opts);
    }

    // Recette métier spécifique — ajouter ici les configurations réutilisables.
    public function buildCustom(array $opts = []): void
    {
        $this->builder
            ->reset()
            ->stepA($opts)
            ->stepC($opts);
    }
}
```

# Utilisation dans un service ou controller

```php
// Avec Director
$builder  = app({ConcreteA}{Builder}::class);
$director = new {Director}($builder);

$director->buildFull(['param_a' => 'valeur', 'param_b' => 42]);
$result = $builder->getResult();

// Chaînage direct sans Director (construction unique)
$result = app({ConcreteA}{Builder}::class)
    ->stepA(['param_a' => 'valeur'])
    ->stepC(['param_c' => true])
    ->getResult();

// Changer de représentation avec le même Director
$builderB = app({ConcreteB}{Builder}::class);
$director->setBuilder($builderB);
$director->buildFull(['param_a' => 'valeur', 'param_b' => 42]);
$resultB = $builderB->getResult();
```

# Binding dans le conteneur (recommandé)

```php
// app/Providers/AppServiceProvider.php
$this->app->bind({Builder}Interface::class, {ConcreteA}{Builder}::class);
// Permet d'injecter {Builder}Interface dans les services sans couplage
// à une implémentation concrète.
```

# Règles à respecter

- `reset()` retourne `static` pour permettre le chaînage — appeler avant
  chaque nouvelle construction ou en sortie de `getResult()`.
- `getResult()` hors de l'interface — pas de type de retour commun garanti.
- Toujours utiliser `app()` plutôt que `new` dans le code appelant pour
  que Laravel puisse injecter les dépendances du Builder concret.
- Le Director ne dépend que de l'interface — jamais des classes concrètes.  