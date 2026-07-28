---
type: Recipe
title: Facade Symfony — générique
tags: [symfony, backend, facade, design-pattern]
---

# Quand utiliser ce pattern

Même cas d'usage que Rails et Laravel. Exemples concrets :
- [Facade de commande](/patterns/facade/recipes/backend/examples/order-facade.md)
- [Facade de notification](/patterns/facade/recipes/backend/examples/notification-facade.md)
- [Facade de reporting](/patterns/facade/recipes/backend/examples/reporting-facade.md)

# Dépendances

- [Conventions Symfony générales](/frameworks/symfony.md)
- [Symfony 7.4 LTS — chemins](/frameworks/symfony/v7.md)

# Structure des fichiers

```
src/Facade/
└── {Facade}.php              ← la Facade (suffixe Facade explicite, pas de confusion Symfony)
src/Service/
├── {SubsystemA}Service.php   ← composants du sous-système
├── {SubsystemB}Service.php
└── {SubsystemC}Service.php
```

# La Facade

```php
// src/Facade/{Facade}.php
class {Facade}
{
    public function __construct(
        private readonly {SubsystemA}Service $subsystemA,
        private readonly {SubsystemB}Service $subsystemB,
        private readonly {SubsystemC}Service $subsystemC,
        private readonly LoggerInterface     $logger,
    ) {}

    // Interface simplifiée — une méthode pour le cas d'usage complet
    public function {operation}(array $params): array
    {
        $this->logger->info('[{Facade}] {operation} started', ['params' => $params]);

        $resultA = $this->subsystemA->{methodA}($params);
        $resultB = $this->subsystemB->{methodB}(array_merge($params, ['result_a' => $resultA]));
        $resultC = $this->subsystemC->{methodC}(array_merge($params, ['result_b' => $resultB]));

        $this->logger->info('[{Facade}] {operation} completed');

        return [
            '{result_key_a}' => $resultA,
            '{result_key_b}' => $resultB,
            '{result_key_c}' => $resultC,
        ];
    }

    // Deuxième opération de haut niveau — même sous-système, cas d'usage différent
    public function {otherOperation}(array $params): mixed
    {
        return $this->subsystemA->{otherMethod}($params);
    }
}
```

# Configuration DI (auto-wire natif)

```yaml
# config/services.yaml — rien à configurer si les sous-systèmes sont auto-wirés
# Symfony auto-wire automatiquement tous les services dans src/
services:
    App\Facade\{Facade}: ~   # auto-wired par défaut
```

Si les sous-systèmes ont des interfaces, lier via `_instanceof` ou alias :

```yaml
services:
    App\Service\{SubsystemA}Interface:
        alias: App\Service\{ConcreteSubsystemA}Service
```

# Utilisation dans un controller

```php
// src/Controller/Api/{Domain}Controller.php
#[Route('/api/{domain}s', methods: ['POST'])]
class {Domain}Controller extends AbstractController
{
    public function __construct(
        private readonly {Facade} $facade,
    ) {}

    public function create(Request $request): JsonResponse
    {
        $params = json_decode($request->getContent(), true);
        $result = $this->facade->{operation}($params);
        return $this->json($result, 201);
    }
}
```

# Avant / Après

```php
// ❌ Sans Facade — controller connaît tous les sous-systèmes
public function create(Request $request): JsonResponse
{
    $resultA = $this->subsystemA->{methodA}($params);
    $resultB = $this->subsystemB->{methodB}($params);
    $resultC = $this->subsystemC->{methodC}($params);
    $this->mailer->send(...);
    return $this->json([...], 201);
}

// ✅ Avec Facade — une ligne
public function create(Request $request): JsonResponse
{
    $result = $this->facade->{operation}(json_decode($request->getContent(), true));
    return $this->json($result, 201);
}
```

# Règles à respecter

- Nommer la classe `{Facade}` sans ambiguïté sur le terme — en Symfony
  contrairement à Laravel, le mot "Facade" ne crée pas de confusion
  avec une convention du framework.
- Placer dans `src/Facade/` pour distinguer clairement de `src/Service/`
  (sous-systèmes) et `src/Controller/`.
- Le logging dans la Facade est le bon endroit pour tracer les opérations
  de haut niveau — les logs de détail restent dans les sous-systèmes.
- Tester la Facade en intégration (vrais sous-systèmes ou stubs légers)
  plutôt qu'en unitaire avec 5 mocks — la valeur de la Facade est dans
  l'orchestration, pas dans la logique individuelle de chaque étape.