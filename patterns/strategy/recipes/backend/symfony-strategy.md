---
type: Recipe
title: Strategy Symfony — générique
tags: [symfony, backend, strategy, design-pattern]
---

# Quand utiliser ce pattern

Même cas d'usage. Symfony offre deux idiomes natifs pour le Strategy :
l'injection directe via DI (une stratégie par binding) ou le **tagged
services** (toutes les stratégies injectées dans un résolveur via tag).

Exemples concrets :
- [Calcul de prix](/patterns/strategy/recipes/backend/examples/pricing.md)
- [Validation](/patterns/strategy/recipes/backend/examples/validation.md)
- [Tri](/patterns/strategy/recipes/backend/examples/sorting.md)

# Dépendances

- [Conventions Symfony générales](/frameworks/symfony.md)
- [Symfony 7.4 LTS — chemins](/frameworks/symfony/v7.md)

# Structure des fichiers

```
src/Strategy/{Domain}/
├── {Strategy}Interface.php
├── {ConcreteA}{Strategy}.php
├── {ConcreteB}{Strategy}.php
└── {Strategy}Resolver.php         ← résolveur via tagged services
src/Service/
└── {Context}.php
```

# Interface Strategy

```php
// src/Strategy/{Domain}/{Strategy}Interface.php
interface {Strategy}Interface
{
    public function execute(array $args): mixed;

    // Clé d'identification — utilisée par le résolveur pour sélectionner
    // la bonne stratégie selon un paramètre runtime.
    public function supports(string $type): bool;
}
```

# Stratégies concrètes

```php
// src/Strategy/{Domain}/{ConcreteA}{Strategy}.php
class {ConcreteA}{Strategy} implements {Strategy}Interface
{
    public function execute(array $args): mixed
    {
        // Implémentation A
    }

    public function supports(string $type): bool
    {
        return $type === '{concrete_a}';
    }
}
```

# Résolveur via tagged services (idiome Symfony recommandé)

```php
// src/Strategy/{Domain}/{Strategy}Resolver.php
class {Strategy}Resolver
{
    /** @param iterable<{Strategy}Interface> $strategies */
    public function __construct(
        private iterable $strategies
    ) {}

    public function resolve(string $type): {Strategy}Interface
    {
        foreach ($this->strategies as $strategy) {
            if ($strategy->supports($type)) {
                return $strategy;
            }
        }
        throw new \InvalidArgumentException("Stratégie inconnue : {$type}");
    }
}
```

```yaml
# config/services.yaml
services:
    # Tagger toutes les implémentations de l'interface
    _instanceof:
        App\Strategy\{Domain}\{Strategy}Interface:
            tags: ['app.{domain}.strategy']

    # Injecter le tagged iterator dans le résolveur
    App\Strategy\{Domain}\{Strategy}Resolver:
        arguments:
            $strategies: !tagged_iterator 'app.{domain}.strategy'
```

# Contexte

```php
// src/Service/{Context}.php
class {Context}
{
    private {Strategy}Interface $strategy;

    public function __construct(
        private {Strategy}Resolver $resolver,
    ) {}

    public function setStrategy(string $type): void
    {
        $this->strategy = $this->resolver->resolve($type);
    }

    public function run(array $args): mixed
    {
        return $this->strategy->execute($args);
    }
}
```

# Utilisation dans un controller

```php
// src/Controller/Api/{Domain}Controller.php
#[Route('/api/{domain}s', methods: ['POST'])]
class {Domain}Controller extends AbstractController
{
    public function __construct(
        private {Context} $context,
    ) {}

    public function handle(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $this->context->setStrategy($data['type'] ?? '{concrete_a}');
        $result = $this->context->run($data);
        return $this->json($result);
    }
}
```

# Ajouter une nouvelle stratégie (OCP — aucune config à modifier)

```php
// 1. Créer la nouvelle stratégie
class {ConcreteD}{Strategy} implements {Strategy}Interface
{
    public function execute(array $args): mixed { ... }
    public function supports(string $type): bool { return $type === '{concrete_d}'; }
}

// 2. C'est tout — le tag _instanceof la détecte automatiquement.
// Le résolveur, le contexte, le controller ne changent pas.
```

C'est l'avantage du tagged services Symfony sur le match/switch du
résolveur Laravel : ajouter une stratégie = ajouter un fichier, rien d'autre.

# Règles à respecter

- `supports()` doit être pur (sans effet de bord) et rapide — le résolveur
  l'appelle sur toutes les stratégies enregistrées.
- Ne jamais injecter directement `{ConcreteA}{Strategy}` dans un service
  qui pourrait en avoir besoin d'une autre — toujours passer par le
  Résolveur ou le Contexte.
- Si l'ordre de priorité entre stratégies ayant le même `supports()` est
  important, utiliser `priority` dans le tag :
  `tags: [{ name: 'app.{domain}.strategy', priority: 10 }]`.