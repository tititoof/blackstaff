---
type: Recipe
title: CRUD API Laravel ({Resource})
tags: [laravel, backend, api, crud]
---

# Quand utiliser ce pattern

Resource métier exposant un CRUD complet via une API Laravel, consommée
par un frontend séparé (Nuxt) ou un client tiers.

# Dépendances

- [Conventions Laravel générales](/frameworks/laravel.md)
- [Laravel API Resources](/patterns/crud/dependencies/laravel-api-resources.md)

# Fichiers à générer

Chemins détaillés dans [Laravel 13 — chemins](/frameworks/laravel/v13.md).

| Fichier | Rôle |
|---|---|
| `app/Models/{Resource}.php` | Modèle Eloquent |
| `app/Http/Controllers/Api/{Resource}Controller.php` | Controller CRUD |
| `app/Http/Requests/Store{Resource}Request.php` | Validation création |
| `app/Http/Requests/Update{Resource}Request.php` | Validation mise à jour |
| `app/Http/Resources/{Resource}Resource.php` | Sérialisation unitaire |
| `app/Http/Resources/{Resource}Collection.php` | Sérialisation liste |
| `database/migrations/xxxx_create_{resource}s_table.php` | Migration |
| `routes/api.php` | Route à ajouter |

# Modèle

```php
// app/Models/{Resource}.php
class {Resource} extends Model
{
    protected $fillable = ['title']; // compléter selon la spec
    // Ne jamais utiliser $guarded = [] — toujours lister explicitement
}
```

# Migration

```php
Schema::create('{resource}s', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    // Ajouter les colonnes selon la spec
    $table->timestamps();
});
```

# Form Requests

```php
// app/Http/Requests/Store{Resource}Request.php
class Store{Resource}Request extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            // Compléter selon la spec
        ];
    }
}

// app/Http/Requests/Update{Resource}Request.php
class Update{Resource}Request extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            // 'sometimes' = valider uniquement si présent (PATCH)
        ];
    }
}
```

# Controller

```php
// app/Http/Controllers/Api/{Resource}Controller.php
class {Resource}Controller extends Controller
{
    public function index(): {Resource}Collection
    {
        return new {Resource}Collection(
            {Resource}::latest()->paginate(25)
        );
    }

    public function show({Resource} ${resource}): {Resource}Resource
    {
        return new {Resource}Resource(${resource});
    }

    public function store(Store{Resource}Request $request): {Resource}Resource
    {
        ${resource} = {Resource}::create($request->validated());
        return new {Resource}Resource(${resource});
    }

    public function update(Update{Resource}Request $request, {Resource} ${resource}): {Resource}Resource
    {
        ${resource}->update($request->validated());
        return new {Resource}Resource(${resource});
    }

    public function destroy({Resource} ${resource}): Response
    {
        ${resource}->delete();
        return response()->noContent();
    }
}
```

# Routes

```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('{resource}s', {Resource}Controller::class);
});
```

`apiResource` génère les 5 routes CRUD sans les routes `create`/`edit`
(formulaires HTML non pertinents pour une API pure).

# Pièges à éviter

- Toujours utiliser `$request->validated()` dans `create()`/`update()`,
  jamais `$request->all()` — validated() ne retourne que les champs
  ayant passé les règles du Form Request.
- `Route::apiResource` sans middleware `auth:sanctum` expose le CRUD
  entièrement en public — toujours wrapper dans un groupe authentifié.
- Ne pas oublier `'sometimes'` dans `Update{Resource}Request` pour les
  champs optionnels en PATCH — sans ça une mise à jour partielle
  déclenche une erreur de validation sur les champs non envoyés.