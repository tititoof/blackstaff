---
type: Dependency
title: API Platform (Symfony)
ecosystem: php
check_file: composer.json
check_pattern: "\"api-platform/core\""
install_command: composer require api-platform/core
postinstall_commands: []
min_version: "3.2"
tags: [symfony, crud, api, composer]
---

# API Platform

Framework complet au-dessus de Symfony pour exposer des APIs REST (et
GraphQL) depuis des entités Doctrine. Génère automatiquement les endpoints
CRUD, la documentation OpenAPI, la pagination, la validation et la
sérialisation via un simple attribut PHP sur l'entité.

# Vérification d'installation

Vérifier dans `composer.json` la présence de `"api-platform/core"`.
Vérifier aussi que `config/packages/api_platform.yaml` existe (généré
par Flex à l'installation).

# Utilisation minimale

```php
// src/Entity/{Resource}.php
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Delete;

#[ApiResource(
    operations: [
        new GetCollection(),
        new Post(),
        new Get(),
        new Put(),
        new Patch(),
        new Delete(),
    ]
)]
#[ORM\Entity]
class {Resource}
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $title = '';

    // getters/setters...
}
```

Ce seul attribut `#[ApiResource]` génère automatiquement tous les
endpoints CRUD, la pagination (paramètre `?page=`), la documentation
OpenAPI sur `/api/docs`, et la validation via les contraintes Symfony.

# Alternative sans API Platform (CRUD manuel)

Si le projet n'utilise pas API Platform (trop lourd ou conventions
non souhaitées), voir la recipe
[symfony-crud-api](/patterns/crud/recipes/backend/symfony-crud-api.md)
pour l'approche manuelle avec un controller Symfony classique.

# Pièges

- API Platform expose par défaut TOUS les champs de l'entité — utiliser
  des groupes de sérialisation (`#[Groups(['read'])]` sur les propriétés)
  pour contrôler explicitement ce qui est exposé.
- Désactiver les opérations non souhaitées explicitement plutôt que de
  les laisser actives et de compter sur la sécurité pour les bloquer —
  si `Delete` n'est pas nécessaire, ne pas le déclarer du tout.
- La pagination est active par défaut (30 items/page) — configurable
  dans `config/packages/api_platform.yaml` via `defaults.pagination_items_per_page`.