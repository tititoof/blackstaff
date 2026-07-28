---
type: Recipe
title: Factory Method Symfony — générique
tags: [symfony, backend, factory-method, design-pattern]
---

# Quand utiliser ce pattern

Même cas d'usage que Rails et Laravel. Exemples concrets :
- [Paiement](/patterns/factory-method/recipes/backend/examples/payment.md)
- [Export](/patterns/factory-method/recipes/backend/examples/export.md)
- [Notification](/patterns/factory-method/recipes/backend/examples/notification.md)

# Dépendances

- [Conventions Symfony générales](/frameworks/symfony.md)
- [Symfony 7.4 LTS — chemins](/frameworks/symfony/v7.md)

# Structure des fichiers

```
src/Service/{Domain}/
├── Product/
│   ├── {Product}Interface.php      ← Produit abstrait
│   ├── {ConcreteA}{Product}.php
│   └── {ConcreteB}{Product}.php
└── Creator/
    ├── Abstract{Creator}.php       ← Créateur abstrait
    ├── {ConcreteA}{Creator}.php
    └── {ConcreteB}{Creator}.php
```

# Produit abstrait (interface)

```php
// src/Service/{Domain}/Product/{Product}Interface.php
interface {Product}Interface
{
    public function perform(array $args): mixed;
}
```

# Produit concret (à dupliquer par implémentation)

```php
// src/Service/{Domain}/Product/{ConcreteA}{Product}.php
class {ConcreteA}{Product} implements {Product}Interface
{
    // Injecter les dépendances nécessaires via le constructeur.
    // Symfony les auto-wire.
    public function __construct(
        // ex: private HttpClientInterface $httpClient,
    ) {}

    public function perform(array $args): mixed
    {
        // Implémentation spécifique à {ConcreteA}
    }
}
```

# Créateur abstrait

```php
// src/Service/{Domain}/Creator/Abstract{Creator}.php
abstract class Abstract{Creator}
{
    public function __construct(
        private LoggerInterface $logger,
        // Injecter ici les dépendances communes à tous les Créateurs.
        // Symfony les auto-wire dans les sous-classes si le constructeur
        // des sous-classes appelle parent::__construct().
    ) {}

    // Méthode fabrique — abstraite.
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

    protected function validate(array $args): void
    {
        // Validation commune — surcharger si nécessaire.
    }

    protected function afterExecute(mixed $result, array $args): void
    {
        $this->logger->info('[{Domain}] executed', ['result' => $result]);
    }
}
```

# Créateur concret (à dupliquer par implémentation)

```php
// src/Service/{Domain}/Creator/{ConcreteA}{Creator}.php
class {ConcreteA}{Creator} extends Abstract{Creator}
{
    public function __construct(
        private {ConcreteA}{Product} $product,  // auto-wired par Symfony
        LoggerInterface $logger,
    ) {
        parent::__construct($logger);
        // Ne pas oublier parent::__construct() — Symfony ne le fait pas.
    }

    protected function create{Product}(): {Product}Interface
    {
        return $this->product;
        // Le Produit est injecté dans le constructeur plutôt que
        // d'être instancié dans create{Product}() — Symfony peut ainsi
        // injecter ses propres dépendances dans le Produit concret.
    }
}
```

# Configuration DI — résolution via alias paramétrique

```yaml
# config/services.yaml
parameters:
    {domain}_provider: '%env({DOMAIN}_PROVIDER)%'

services:
    # Produits concrets — auto-wired
    App\Service\{Domain}\Product\{ConcreteA}{Product}: ~
    App\Service\{Domain}\Product\{ConcreteB}{Product}: ~

    # Créateurs concrets — auto-wired
    App\Service\{Domain}\Creator\{ConcreteA}{Creator}: ~
    App\Service\{Domain}\Creator\{ConcreteB}{Creator}: ~

    # Alias paramétrique : résout le bon Créateur selon la config
    App\Service\{Domain}\Creator\Abstract{Creator}:
        alias: 'App\Service\{Domain}\Creator\%{domain}_provider%{Creator}'
```

Avec `{DOMAIN}_PROVIDER={ConcreteA}` en variable d'environnement, Symfony
résout `Abstract{Creator}` vers `{ConcreteA}{Creator}` automatiquement
au démarrage du conteneur.

# Utilisation dans un controller

```php
// src/Controller/Api/{Domain}Controller.php
#[Route('/api/{domain}s', methods: ['POST'])]
class {Domain}Controller extends AbstractController
{
    public function __construct(
        private Abstract{Creator} $creator  // résolu par l'alias DI
    ) {}

    public function handle(Request $request): JsonResponse
    {
        $data   = json_decode($request->getContent(), true);
        $result = $this->creator->execute($data);
        return $this->json($result, 201);
    }
}
```

# Ajouter une nouvelle implémentation (OCP)

```php
// 1. Nouveau Produit
class {ConcreteC}{Product} implements {Product}Interface { ... }

// 2. Nouveau Créateur
class {ConcreteC}{Creator} extends Abstract{Creator}
{
    public function __construct(
        private {ConcreteC}{Product} $product,
        LoggerInterface $logger,
    ) { parent::__construct($logger); }

    protected function create{Product}(): {Product}Interface
    {
        return $this->product;
    }
}
```

```yaml
# config/services.yaml — ajouter seulement ces deux lignes
App\Service\{Domain}\Product\{ConcreteC}{Product}: ~
App\Service\{Domain}\Creator\{ConcreteC}{Creator}: ~
# Puis changer {DOMAIN}_PROVIDER={ConcreteC} dans .env
```

Aucun controller, aucun Créateur existant, aucune classe abstraite
ne sont modifiés.

# Limite de l'alias paramétrique

L'alias DI de Symfony est résolu **au démarrage du conteneur** (pas à la
requête). Il ne supporte donc pas un changement de provider à chaud selon
le contexte de la requête (ex: utilisateur A → Stripe, utilisateur B →
PayPal). Pour ce cas, utiliser un `ServiceLocator` ou un résolveur manuel
similaire à la version Laravel.

# Règles à respecter

- `create{Product}()` est `protected` — jamais appelée depuis l'extérieur.
- Toujours appeler `parent::__construct()` dans chaque Créateur concret —
  Symfony n'auto-wire pas le constructeur parent.
- Le Produit est injecté dans le constructeur du Créateur concret (pas
  `new` dans `create{Product}()`) pour permettre l'auto-wiring de ses
  propres dépendances.
- Ne jamais injecter un Créateur concret dans un controller — toujours
  via le type-hint `Abstract{Creator}`.