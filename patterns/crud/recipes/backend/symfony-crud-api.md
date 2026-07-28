---
type: Recipe
title: CRUD API Symfony ({Resource})
tags: [symfony, backend, api, crud]
---

# Quand utiliser ce pattern

Resource métier exposant un CRUD complet via une API Symfony, consommée
par un frontend séparé (Nuxt) ou un client tiers.

# Deux approches disponibles — choisir en début de projet

| | API Platform | Controller manuel |
|---|---|---|
| Setup | `#[ApiResource]` sur l'entité, zéro controller | Controller + Serializer + routes manuels |
| Quand | API standard, besoins peu spécifiques, rapidité | Logique métier complexe, contrôle total du format de réponse |
| Dépendance | [API Platform](/patterns/crud/dependencies/symfony-api-platform.md) | Natif Symfony |

Ne pas mélanger les deux dans un même projet sans raison explicite.

# Dépendances

- [Conventions Symfony générales](/frameworks/symfony.md)
- Selon l'approche choisie :
  - **API Platform** : [symfony-api-platform](/patterns/crud/dependencies/symfony-api-platform.md)
  - **Manuel** : natif, pas de dépendance supplémentaire

# Fichiers à générer

Chemins détaillés dans [Symfony 7.4 LTS — chemins](/frameworks/symfony/v7.md).

| Fichier | Rôle |
|---|---|
| `src/Entity/{Resource}.php` | Entité Doctrine |
| `src/Controller/Api/{Resource}Controller.php` | Controller (approche manuelle) |
| `migrations/VersionXXXX.php` | Migration Doctrine |

# Entité (commune aux deux approches)

```php
// src/Entity/{Resource}.php
#[ORM\Entity]
// Ajouter #[ApiResource(...)] ici si approche API Platform
class {Resource}
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 255)]
    private string $title = '';

    // Getters/setters — obligatoires pour Doctrine et le Serializer

    public function getId(): ?int { return $this->id; }
    public function getTitle(): string { return $this->title; }
    public function setTitle(string $title): static
    {
        $this->title = $title;
        return $this;
    }
}
```

# Approche 1 — API Platform (voir dependency pour le détail)

Ajouter uniquement `#[ApiResource]` sur l'entité — API Platform génère
les endpoints, la pagination, la doc OpenAPI et la validation
automatiquement via les contraintes `#[Assert\*]` de l'entité.

# Approche 2 — Controller manuel

```php
// src/Controller/Api/{Resource}Controller.php
#[Route('/api/{resource}s', name: 'api_{resource}_')]
class {Resource}Controller extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private SerializerInterface $serializer,
        private ValidatorInterface $validator,
    ) {}

    #[Route('', methods: ['GET'])]
    public function index(Request $request, {Resource}Repository $repo): JsonResponse
    {
        $page    = max(1, (int) $request->query->get('page', 1));
        $perPage = 25;
        $items   = $repo->findBy([], null, $perPage, ($page - 1) * $perPage);
        $total   = $repo->count([]);

        return $this->json([
            'data' => $items,
            'meta' => [
                'total'        => $total,
                'per_page'     => $perPage,
                'current_page' => $page,
                'last_page'    => (int) ceil($total / $perPage),
            ],
        ]);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show({Resource} ${resource}): JsonResponse
    {
        return $this->json(${resource});
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        ${resource} = $this->serializer->deserialize(
            $request->getContent(), {Resource}::class, 'json'
        );
        $errors = $this->validator->validate(${resource});
        if (count($errors) > 0) {
            return $this->json(['errors' => (string) $errors], 422);
        }
        $this->em->persist(${resource});
        $this->em->flush();
        return $this->json(${resource}, 201);
    }

    #[Route('/{id}', methods: ['PATCH'])]
    public function update(Request $request, {Resource} ${resource}): JsonResponse
    {
        $this->serializer->deserialize(
            $request->getContent(), {Resource}::class, 'json',
            ['object_to_populate' => ${resource}]
        );
        $errors = $this->validator->validate(${resource});
        if (count($errors) > 0) {
            return $this->json(['errors' => (string) $errors], 422);
        }
        $this->em->flush();
        return $this->json(${resource});
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function destroy({Resource} ${resource}): JsonResponse
    {
        $this->em->remove(${resource});
        $this->em->flush();
        return $this->json(null, 204);
    }
}
```

# Commande de migration

```bash
php bin/console make:entity {Resource}
php bin/console make:migration
php bin/console doctrine:migrations:migrate
```

# Pièges à éviter

- Toujours valider avant de persister — `$this->validator->validate()` ne
  lève pas d'exception automatiquement, il faut vérifier le résultat et
  retourner une erreur 422 explicitement.
- L'option `object_to_populate` dans `deserialize` est indispensable pour
  le PATCH — sans elle, le désérialiseur crée un nouveau objet au lieu de
  modifier l'entité existante, et Doctrine perd la référence à l'objet
  managé.
- Ne jamais oublier `$this->em->flush()` après `persist()` ou `remove()`
  — Doctrine accumule les changements en mémoire jusqu'au flush, pas
  d'écriture en base sans ça.