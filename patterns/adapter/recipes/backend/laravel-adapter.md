---
type: Recipe
title: Adapter Laravel — générique
tags: [laravel, backend, adapter, design-pattern]
---

# Quand utiliser ce pattern

Même cas d'usage que Rails. Exemples concrets :
- [SDK tiers](/patterns/adapter/recipes/backend/examples/sdk-adapter.md)
- [Système legacy](/patterns/adapter/recipes/backend/examples/legacy-adapter.md)
- [Adaptateur de format](/patterns/adapter/recipes/backend/examples/format-adapter.md)

# Dépendances

- [Conventions Laravel générales](/frameworks/laravel.md)
- [Laravel 13 — chemins](/frameworks/laravel/v13.md)

# Structure des fichiers

```
app/Contracts/{Target}Interface.php
app/Adapters/{Adapter}.php
```

# Interface Target

```php
// app/Contracts/{Target}Interface.php
interface {Target}Interface
{
    public function {methodA}(array $args): array;
    public function {methodB}(array $args): array;
}
```

# Adapter par composition

```php
// app/Adapters/{Adapter}.php
class {Adapter} implements {Target}Interface
{
    private readonly {Adaptee} $adaptee;

    public function __construct(?{Adaptee} $adaptee = null)
    {
        $this->adaptee = $adaptee ?? $this->buildAdaptee();
    }

    public function {methodA}(array $args): array
    {
        $adapteeArgs = $this->translateArgsToAdaptee($args);

        try {
            $raw = $this->adaptee->{adapteeMethod}($adapteeArgs);
        } catch ({AdapteeException} $e) {
            // Normaliser les exceptions propriétaires
            throw new {DomainException}($e->getMessage(), previous: $e);
        }

        return $this->translateResultToTarget($raw);
    }

    public function {methodB}(array $args): array
    {
        try {
            $raw = $this->adaptee->{otherAdapteeMethod}($args);
        } catch ({AdapteeException} $e) {
            throw new {DomainException}($e->getMessage(), previous: $e);
        }

        return $this->translateResultToTarget($raw);
    }

    private function buildAdaptee(): {Adaptee}
    {
        return new {Adaptee}(config('{adaptee}.api_key'));
    }

    private function translateArgsToAdaptee(array $args): array
    {
        // Convertir du format Target vers le format Adaptee
        return [
            // ex: 'amount' => $args['amount'] * 100,  // Target en euros, Adaptee en centimes
        ];
    }

    private function translateResultToTarget(mixed $raw): array
    {
        // Convertir du format Adaptee vers le format Target normalisé
        return [
            'id'     => $raw->id ?? $raw['id'],
            'status' => $raw->status ?? $raw['status'],
        ];
    }
}
```

# Binding dans le conteneur

```php
// app/Providers/AppServiceProvider.php
$this->app->bind({Target}Interface::class, {Adapter}::class);

// Ou avec injection de l'Adaptee pour permettre le swap en test
$this->app->bind({Target}Interface::class, function () {
    return new {Adapter}(app({Adaptee}::class));
});
```

# Test avec mock de l'Adaptee

```php
// tests/Unit/Adapters/{Adapter}Test.php
public function test_translates_args_correctly(): void
{
    $mockAdaptee = Mockery::mock({Adaptee}::class);
    $mockAdaptee->shouldReceive('{adapteeMethod}')
                ->once()
                ->with(['expected_format' => 'value'])
                ->andReturn((object)['id' => 'test_123', 'status' => 'succeeded']);

    $adapter = new {Adapter}($mockAdaptee);
    $result  = $adapter->{methodA}(['original_format' => 'value']);

    $this->assertEquals('test_123', $result['id']);
}
```

# Règles à respecter

- Toujours normaliser les exceptions de l'Adaptee — ne jamais laisser
  fuir une `{AdapteeException}` hors de l'Adapter, ça couple le code
  appelant à l'Adaptee.
- Utiliser `app()` pour instancier l'Adaptee dans `buildAdaptee()` —
  bénéficie de l'injection de dépendances Laravel sur l'Adaptee si nécessaire.
- Tester l'Adapter avec un mock de l'Adaptee — pas avec le vrai SDK
  (appels réseau en test = lents, non reproductibles, coûteux).