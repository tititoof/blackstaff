---
type: Recipe
title: Builder Symfony — générique
tags: [symfony, backend, builder, design-pattern]
---

# Quand utiliser ce pattern

Même cas d'usage que Rails et Laravel. Exemples concrets :
- [Rapport (PDF, CSV)](/patterns/builder/recipes/backend/examples/report-builder.md)
- [Requête complexe](/patterns/builder/recipes/backend/examples/query-builder.md)

# Dépendances

- [Conventions Symfony générales](/frameworks/symfony.md)
- [Symfony 7.4 LTS — chemins](/frameworks/symfony/v7.md)

# Structure des fichiers

```
src/Builder/{Domain}/
├── {Builder}Interface.php        ← Interface Builder
├── {ConcreteA}{Builder}.php      ← ConcreteBuilder A
├── {ConcreteB}{Builder}.php      ← ConcreteBuilder B
└── {Director}.php                ← Director
```

# Interface Builder

```php
// src/Builder/{Domain}/{Builder}Interface.php
interface {Builder}Interface
{
    public function reset(): static;
    public function stepA(array $opts = []): static;
    public function stepB(array $opts = []): static;
    public function stepC(array $opts = []): static;
    // getResult() délibérément absent — types de produits hétérogènes.
}
```

# ConcreteBuilder (à dupliquer par représentation)

```php
// src/Builder/{Domain}/{ConcreteA}{Builder}.php
class {ConcreteA}{Builder} implements {Builder}Interface
{
    private {ProductA} $product;

    // Symfony auto-wire les dépendances nécessaires à la construction.
    public function __construct(
        // ex: private LoggerInterface $logger,
        // ex: private SomeService $service,
    ) {
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

    public function getResult(): {ProductA}
    {
        $product = $this->product;
        $this->reset();
        return $product;
    }

    private function buildPartA(array $opts): mixed { ... }
    private function buildPartB(array $opts): mixed { ... }
    private function buildPartC(array $opts): mixed { ... }
}
```

# Director

```php
// src/Builder/{Domain}/{Director}.php
class {Director}
{
    public function __construct(
        private {Builder}Interface $builder
        // Symfony injecte le builder via DI (voir config/services.yaml)
    ) {}

    public function setBuilder({Builder}Interface $builder): void
    {
        $this->builder = $builder;
    }

    public function buildMinimal(array $opts = []): void
    {
        $this->builder->reset()->stepA($opts);
    }

    public function buildFull(array $opts = []): void
    {
        $this->builder
            ->reset()
            ->stepA($opts)
            ->stepB($opts)
            ->stepC($opts);
    }

    public function buildCustom(array $opts = []): void
    {
        $this->builder
            ->reset()
            ->stepA($opts)
            ->stepC($opts);
    }
}
```

# Configuration DI

```yaml
# config/services.yaml
services:
    # ConcreteBuilders — auto-wired
    App\Builder\{Domain}\{ConcreteA}{Builder}: ~
    App\Builder\{Domain}\{ConcreteB}{Builder}: ~

    # Binding de l'interface vers le ConcreteBuilder par défaut
    App\Builder\{Domain}\{Builder}Interface:
        alias: App\Builder\{Domain}\{ConcreteA}{Builder}

    # Director — auto-wired, reçoit le ConcreteBuilder par défaut
    App\Builder\{Domain}\{Director}: ~
```

# Utilisation dans un service ou controller

```php
// src/Service/{Domain}Service.php
class {Domain}Service
{
    public function __construct(
        private {Director} $director,
        private {ConcreteA}{Builder} $builderA,
        private {ConcreteB}{Builder} $builderB,
    ) {}

    public function buildFull(array $opts): {ProductA}
    {
        $this->director->buildFull($opts);
        return $this->builderA->getResult();
    }

    public function buildAlternative(array $opts): {ProductB}
    {
        $this->director->setBuilder($this->builderB);
        $this->director->buildFull($opts);
        return $this->builderB->getResult();
    }
}
```

# Chaînage direct sans Director (construction unique)

```php
$result = $this->builderA
    ->reset()
    ->stepA(['param_a' => 'valeur'])
    ->stepC(['param_c' => true])
    ->getResult();
```

# Règles à respecter

- `reset()` retourne `static` pour le chaînage — appelé automatiquement
  dans `getResult()`, mais aussi disponible explicitement.
- Symfony injecte les dépendances dans le constructeur du ConcreteBuilder —
  ne jamais instancier un ConcreteBuilder avec `new` dans le code applicatif.
- Le Director reçoit `{Builder}Interface` — jamais un ConcreteBuilder
  directement, pour rester découplé des représentations concrètes.
- `getResult()` hors de l'interface : le client récupère le résultat
  directement depuis le Builder, pas depuis le Director.