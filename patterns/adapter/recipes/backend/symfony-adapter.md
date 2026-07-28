---
type: Recipe
title: Adapter Symfony — générique
tags: [symfony, backend, adapter, design-pattern]
---

# Quand utiliser ce pattern

Même cas d'usage. Exemples concrets :
- [SDK tiers](/patterns/adapter/recipes/backend/examples/sdk-adapter.md)
- [Système legacy](/patterns/adapter/recipes/backend/examples/legacy-adapter.md)
- [Adaptateur de format](/patterns/adapter/recipes/backend/examples/format-adapter.md)

# Dépendances

- [Conventions Symfony générales](/frameworks/symfony.md)
- [Symfony 7.4 LTS — chemins](/frameworks/symfony/v7.md)

# Structure des fichiers

```
src/Port/{Target}Interface.php       ← interface Target (port hexagonal)
src/Adapter/{Adapter}.php            ← Adapter (adaptateur)
```

# Interface Target (Port)

```php
// src/Port/{Target}Interface.php
// Nommée "Port" par convention de l'architecture hexagonale —
// l'Adapter est l'implémentation du port.
interface {Target}Interface
{
    public function {methodA}(array $args): array;
    public function {methodB}(array $args): array;
}
```

# Adapter par composition

```php
// src/Adapter/{Adapter}.php
class {Adapter} implements {Target}Interface
{
    public function __construct(
        private readonly {Adaptee} $adaptee,   // auto-wired par Symfony
        private readonly LoggerInterface $logger,
    ) {}

    public function {methodA}(array $args): array
    {
        $this->logger->debug('[{Adapter}] {methodA}', ['args' => $args]);

        $adapteeArgs = $this->translateArgsToAdaptee($args);

        try {
            $raw = $this->adaptee->{adapteeMethod}($adapteeArgs);
        } catch (\{AdapteeException} $e) {
            $this->logger->error('[{Adapter}] {adapteeMethod} failed', [
                'error' => $e->getMessage(),
            ]);
            throw new \{DomainException}($e->getMessage(), previous: $e);
        }

        return $this->translateResultToTarget($raw);
    }

    public function {methodB}(array $args): array
    {
        try {
            $raw = $this->adaptee->{otherAdapteeMethod}($args);
        } catch (\{AdapteeException} $e) {
            throw new \{DomainException}($e->getMessage(), previous: $e);
        }

        return $this->translateResultToTarget($raw);
    }

    private function translateArgsToAdaptee(array $args): array
    {
        // Convertir du format Target vers le format Adaptee
        return [];
    }

    private function translateResultToTarget(mixed $raw): array
    {
        // Convertir du format Adaptee vers le format Target normalisé
        return [
            'id'     => is_object($raw) ? $raw->getId() : $raw['id'],
            'status' => is_object($raw) ? $raw->getStatus() : $raw['status'],
        ];
    }
}
```

# Configuration DI

```yaml
# config/services.yaml
services:
    # L'Adaptee est configuré avec ses propres paramètres
    {Adaptee}:
        arguments:
            $apiKey: '%env({ADAPTEE}_API_KEY)%'

    # L'Adapter implémente l'interface Target
    App\Port\{Target}Interface:
        alias: App\Adapter\{Adapter}

    # L'Adapter est auto-wired — Symfony injecte l'Adaptee automatiquement
    App\Adapter\{Adapter}: ~
```

# Architecture hexagonale avec Adapter

```
src/
├── Domain/          ← cœur métier — ne connaît que les interfaces (Ports)
│   └── Service/
│       └── {DomainService}.php  → dépend de {Target}Interface
├── Port/            ← interfaces que le domaine expose/consomme
│   └── {Target}Interface.php
└── Adapter/         ← implémentations des ports (SDK, DB, HTTP...)
    └── {Adapter}.php            → implémente {Target}Interface, contient l'Adaptee
```

Cette structure correspond à l'architecture ports & adapters (hexagonale)
— le domaine ne connaît que les ports, les adapters sont des détails
d'infrastructure.

# Règles à respecter

- Placer les Adapters dans `src/Adapter/` et les interfaces dans `src/Port/`
  — sépare clairement le domaine de l'infrastructure.
- L'Adaptee (SDK tiers) est injecté dans le constructeur, jamais instancié
  manuellement dans l'Adapter — Symfony gère son cycle de vie.
- Normaliser les exceptions comme pour Rails et Laravel — ne pas laisser
  fuir les exceptions propriétaires de l'Adaptee dans le domaine.