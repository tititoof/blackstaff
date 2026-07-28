---
type: Recipe
title: Facade Laravel — générique
tags: [laravel, backend, facade, design-pattern]
---

# Contexte Laravel : Facade GoF vs Facades Laravel

Laravel utilise le terme "Facade" pour ses proxies statiques (`Auth::check()`,
`Cache::get()`, `Mail::send()`). Ce sont des **proxies statiques vers des
services du conteneur**, pas des Facades GoF au sens strict.

Cette recipe couvre le **pattern GoF** (orchestration de sous-systèmes),
pas les Facades Laravel natives.

Exemples concrets :
- [Facade de commande](/patterns/facade/recipes/backend/examples/order-facade.md)
- [Facade de notification](/patterns/facade/recipes/backend/examples/notification-facade.md)
- [Facade de reporting](/patterns/facade/recipes/backend/examples/reporting-facade.md)

# Dépendances

- [Conventions Laravel générales](/frameworks/laravel.md)
- [Laravel 13 — chemins](/frameworks/laravel/v13.md)

# Structure des fichiers

```
app/Services/{Domain}/{Facade}Service.php   ← la Facade (nommée "Service" par convention Laravel)
app/Services/{Domain}/{SubsystemA}Service.php
app/Services/{Domain}/{SubsystemB}Service.php
```

# La Facade (nommée "...Service" en Laravel par convention)

```php
// app/Services/{Domain}/{Facade}Service.php
// En Laravel, ce pattern s'appelle souvent "Service" ou "Manager" —
// le nommage "Facade" est réservé aux proxies statiques natifs du framework.
class {Facade}Service
{
    public function __construct(
        private readonly {SubsystemA}Service $subsystemA,
        private readonly {SubsystemB}Service $subsystemB,
        private readonly {SubsystemC}Service $subsystemC,
    ) {}

    // Interface simplifiée — une méthode pour le cas d'usage complet
    public function {operation}(array $params): array
    {
        $resultA = $this->subsystemA->{methodA}($params);
        $resultB = $this->subsystemB->{methodB}(array_merge($params, ['result_a' => $resultA]));
        $resultC = $this->subsystemC->{methodC}(array_merge($params, ['result_b' => $resultB]));

        return [
            '{result_key_a}' => $resultA,
            '{result_key_b}' => $resultB,
            '{result_key_c}' => $resultC,
        ];
    }

    public function {otherOperation}(array $params): mixed
    {
        return $this->subsystemA->{otherMethod}($params);
    }
}
```

# Binding dans le conteneur (auto-wire)

```php
// Laravel auto-wire par défaut via le constructeur — aucune config nécessaire
// si les dépendances sont des classes concrètes.

// Si les sous-systèmes ont des interfaces :
// app/Providers/AppServiceProvider.php
$this->app->bind({SubsystemA}Interface::class, {SubsystemA}Service::class);
```

# Utilisation dans un controller

```php
class {Domain}Controller extends Controller
{
    public function __construct(
        private readonly {Facade}Service $facade,
    ) {}

    public function store(StoreRequest $request): JsonResponse
    {
        $result = $this->facade->{operation}($request->validated());
        return response()->json($result, 201);
    }
}
```

# Différence avec les Facades Laravel natives

```php
// Facade Laravel native (proxy statique) — ne pas confondre avec le GoF
Cache::get('key');         // proxy statique vers CacheManager
Auth::check();             // proxy statique vers Guard

// Facade GoF — orchestration de services via injection
$this->facade->{operation}($params);  // instance injectée, orchestration
```

# Règles à respecter

- Nommer la classe `{Domain}Manager` ou `{Domain}Service` (pas `{Domain}Facade`)
  en Laravel pour éviter la confusion avec les Facades Laravel natives.
- Laisser l'auto-wire Laravel gérer l'injection des sous-systèmes —
  ne pas instancier manuellement dans le constructeur sauf pour des
  dépendances non-injectables (valeurs scalaires, config).
- Écrire des tests d'intégration de la Facade avec les vrais sous-systèmes
  (pas uniquement des mocks) — la valeur de la Facade est dans
  l'orchestration correcte.