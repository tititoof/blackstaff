---
type: Dependency
title: Laravel API Resources (natif)
ecosystem: php
check_file: composer.json
check_pattern: "\"laravel/framework\""
install_command: php artisan make:resource {Resource}Resource
postinstall_commands:
  - php artisan make:resource {Resource}Collection
min_version: "laravel/framework 11.0"
tags: [laravel, crud, serializer]
---

# Laravel API Resources

Mécanisme natif Laravel (pas de dépendance externe) pour transformer des
modèles Eloquent en réponses JSON structurées. Équivalent des serializers
Rails mais intégré au framework.

# Vérification d'installation

Toujours disponible si Laravel est installé — pas de vérification de
package spécifique. Vérifier simplement l'existence du fichier
`app/Http/Resources/{Resource}Resource.php` pour savoir si la resource
a déjà été générée pour cette entité.

# Commande de génération

`install_command` et `postinstall_commands` utilisent `{Resource}` comme
placeholder — le résolveur n8n doit substituer le vrai nom avant d'appeler
l'agent.

# Structure

```php
// app/Http/Resources/{Resource}Resource.php
class {Resource}Resource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'title'      => $this->title,
            // N'exposer que les champs nécessaires — jamais $this->toArray()
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}

// app/Http/Resources/{Resource}Collection.php
class {Resource}Collection extends ResourceCollection
{
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'meta' => [
                'total'        => $this->total(),
                'per_page'     => $this->perPage(),
                'current_page' => $this->currentPage(),
                'last_page'    => $this->lastPage(),
            ],
        ];
    }
}
```

# Pièges

- Ne jamais utiliser `$this->toArray()` ou `$this->resource->toArray()`
  à l'intérieur du toArray de la Resource — ça expose tous les attributs
  du modèle, y compris les colonnes sensibles (`password`, `remember_token`).
- Les métadonnées de pagination (`total`, `per_page`...) ne sont
  disponibles que si la collection passée est un résultat paginé
  (Eloquent `paginate()`), pas un `get()` simple.