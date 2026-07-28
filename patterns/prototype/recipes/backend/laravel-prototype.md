---
type: Recipe
title: Prototype Laravel — générique
tags: [laravel, backend, prototype, design-pattern]
---

# Quand utiliser ce pattern

Même cas d'usage que Rails. Exemples concrets :
- [Entité métier](/patterns/prototype/recipes/backend/examples/entity-clone.md)
- [Objet de configuration complexe](/patterns/prototype/recipes/backend/examples/config-clone.md)

# Dépendances

- [Conventions Laravel générales](/frameworks/laravel.md)
- [Laravel 13 — chemins](/frameworks/laravel/v13.md)

# Structure des fichiers

```
app/Contracts/Cloneable.php         ← interface Prototype
app/Traits/CloneableTrait.php       ← trait partagé (helpers)
app/Models/{Prototype}.php          ← implémente Cloneable
```

# Interface Prototype

```php
// app/Contracts/Cloneable.php
interface Cloneable
{
    // Retourne une nouvelle instance indépendante de l'objet courant.
    // Ne persiste PAS le clone — c'est la responsabilité du code appelant.
    public function clonePrototype(): static;
}
```

# Trait partagé (helpers communs)

```php
// app/Traits/CloneableTrait.php
trait CloneableTrait
{
    // Attributs à exclure systématiquement du clone.
    // Surcharger dans le modèle concret pour ajouter des exclusions.
    protected function getExcludedAttributes(): array
    {
        return ['id', 'created_at', 'updated_at'];
    }

    // Valeurs à remplacer dans le clone (champs uniques, statut...).
    // Surcharger dans le modèle concret.
    protected function getCloneOverrides(): array
    {
        return [];
    }

    protected function buildCloneAttributes(): array
    {
        return array_merge(
            collect($this->attributes)
                ->except($this->getExcludedAttributes())
                ->toArray(),
            $this->getCloneOverrides()
        );
    }
}
```

# Prototype concret

```php
// app/Models/{Prototype}.php
class {Prototype} extends Model implements Cloneable
{
    use CloneableTrait;

    protected $fillable = [/* attributs éditables */];

    public function {children}()
    {
        return $this->hasMany({Child}::class);
    }

    public function clonePrototype(): static
    {
        // 1. Cloner l'objet courant avec ses attributs (sans id/timestamps)
        $clone = static::make($this->buildCloneAttributes());

        // 2. Persister le clone pour pouvoir attacher les relations
        //    Note : on utilise saveQuietly() pour éviter les events
        //    (ex: éviter d'envoyer un email de création pour le clone)
        $clone->saveQuietly();

        // 3. Cloner les relations en profondeur
        $this->cloneChildren($clone);

        return $clone;
    }

    protected function getCloneOverrides(): array
    {
        return [
            // 'status' => 'draft',
            // 'title'  => $this->title . ' (copie)',
        ];
    }

    private function cloneChildren({Prototype} $cloneParent): void
    {
        $this->{children}->each(function ({Child} $child) use ($cloneParent) {
            $clonedChild = $child->clonePrototype();
            $cloneParent->{children}()->save($clonedChild);
        });
    }
}
```

# Utilisation dans un controller

```php
class {Prototype}Controller extends Controller
{
    public function duplicate({Prototype} ${prototype}): JsonResponse
    {
        $clone = ${prototype}->clonePrototype();
        return response()->json(new {Prototype}Resource($clone), 201);
    }
}
```

```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::post('{prototype}s/{id}/duplicate',
        [{Prototype}Controller::class, 'duplicate']);
});
```

# Copie profonde vs superficielle en Laravel

```php
// ❌ Copie superficielle — replicate() natif Laravel
$clone = $original->replicate();
// clone->items → même collection référencée, pas de clonage des relations

// ✅ Copie profonde via clonePrototype()
$clone = $original->clonePrototype();
// clone->items → nouvelles instances, indépendantes de l'original
```

# Règles à respecter

- `saveQuietly()` plutôt que `save()` dans `clonePrototype()` pour éviter
  de déclencher les observers/events qui génèrent des effets de bord
  (emails, notifications, webhooks) non désirés à la création d'un clone.
- Exclure systématiquement `id`, `created_at`, `updated_at` et tout champ
  unique (`reference`, `slug`, `uuid`) de `buildCloneAttributes()`.
- Ne pas utiliser `replicate()` natif Laravel pour du clonage profond —
  il ne clone pas les relations, il les ignore.
- Gérer les transactions autour de `clonePrototype()` si la cohérence
  entre parent et enfants est critique :
  `DB::transaction(fn() => $original->clonePrototype())`.