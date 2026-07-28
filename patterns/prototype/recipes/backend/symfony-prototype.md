---
type: Recipe
title: Prototype Symfony — générique
tags: [symfony, backend, prototype, design-pattern]
---

# Quand utiliser ce pattern

Même cas d'usage que Rails et Laravel. Exemples concrets :
- [Entité métier](/patterns/prototype/recipes/backend/examples/entity-clone.md)
- [Objet de configuration complexe](/patterns/prototype/recipes/backend/examples/config-clone.md)

# Dépendances

- [Conventions Symfony générales](/frameworks/symfony.md)
- [Symfony 7.4 LTS — chemins](/frameworks/symfony/v7.md)

# Structure des fichiers

```
src/Contract/CloneableInterface.php  ← interface Prototype
src/Entity/{Prototype}.php           ← implémente CloneableInterface
src/Service/{Prototype}Cloner.php    ← service de clonage (recommandé)
```

# Interface Prototype

```php
// src/Contract/CloneableInterface.php
interface CloneableInterface
{
    // Retourne une nouvelle entité indépendante.
    // Ne flush PAS — c'est la responsabilité du code appelant.
    public function clonePrototype(): static;
}
```

# Entité Prototype concrète

```php
// src/Entity/{Prototype}.php
#[ORM\Entity]
class {Prototype} implements CloneableInterface
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $title = '';

    #[ORM\OneToMany(targetEntity: {Child}::class, mappedBy: 'parent',
                    cascade: ['persist'], orphanRemoval: true)]
    private Collection $children;

    public function __construct()
    {
        $this->children = new ArrayCollection();
    }

    public function clonePrototype(): static
    {
        $clone = new static();

        // Copier les attributs scalaires — pas l'id (null = nouvelle entité)
        $clone->title = $this->title;
        // Copier tous les autres attributs scalaires ici

        // Cloner chaque enfant en profondeur
        foreach ($this->children as $child) {
            $clonedChild = $child->clonePrototype();
            $clone->addChild($clonedChild);
        }

        return $clone;
    }

    // Getters/setters
    public function getId(): ?int { return $this->id; }
    public function getTitle(): string { return $this->title; }
    public function setTitle(string $title): static { $this->title = $title; return $this; }
    public function getChildren(): Collection { return $this->children; }

    public function addChild({Child} $child): static
    {
        if (! $this->children->contains($child)) {
            $this->children->add($child);
            $child->setParent($this);
        }
        return $this;
    }
}
```

# Service de clonage (recommandé pour les entités complexes)

```php
// src/Service/{Prototype}Cloner.php
// Séparer le clonage dans un service permet d'injecter des dépendances
// (logger, générateur de slug, etc.) sans polluer l'entité elle-même.
class {Prototype}Cloner
{
    public function __construct(
        private EntityManagerInterface $em,
        private LoggerInterface $logger,
    ) {}

    public function clone({Prototype} $original): {Prototype}
    {
        return $this->em->wrapInTransaction(function () use ($original) {
            $clone = $original->clonePrototype();

            // Post-traitement spécifique au domaine
            $clone->setTitle($original->getTitle() . ' (copie)');

            $this->em->persist($clone);
            $this->logger->info('[Prototype] Cloned', [
                'original_id' => $original->getId(),
            ]);

            return $clone;
        });
    }
}
```

# Utilisation dans un controller

```php
// src/Controller/Api/{Prototype}Controller.php
#[Route('/api/{prototype}s/{id}/duplicate', methods: ['POST'])]
public function duplicate(
    {Prototype} ${prototype},              // ParamConverter Doctrine
    {Prototype}Cloner $cloner,
): JsonResponse {
    $clone = $cloner->clone(${prototype});
    return $this->json($clone, 201);
}
```

# PHP natif `clone` vs `clonePrototype()`

```php
// ❌ clone natif PHP — copie superficielle
$clone = clone $original;
// Les objets imbriqués (Collection Doctrine) sont copiés par référence
// → modifier $clone->children modifie aussi $original->children

// ✅ clonePrototype() — copie profonde explicite
$clone = $original->clonePrototype();
// Chaque enfant est une nouvelle entité, l'id est null (non persistée)
```

# Règles à respecter

- L'`id` du clone doit être `null` après `clonePrototype()` — c'est ce
  qui indique à Doctrine que c'est une nouvelle entité (INSERT, pas UPDATE).
- Ne jamais appeler `flush()` dans `clonePrototype()` — laisser le service
  ou le controller décider quand persister.
- Utiliser `wrapInTransaction()` dans le service de clonage pour garantir
  la cohérence si le clone + ses enfants doivent être persistés ensemble.
- Les Collections Doctrine (`ArrayCollection`) ne sont pas clonées par
  `clone` natif PHP — toujours recréer une nouvelle `ArrayCollection`
  dans `clonePrototype()`.
- Ne pas implémenter `__clone()` PHP magique dans les entités Doctrine —
  cela interfère avec l'UnitOfWork et peut provoquer des comportements
  imprévisibles.