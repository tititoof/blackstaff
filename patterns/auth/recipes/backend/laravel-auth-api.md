---
type: Recipe
title: Auth API Laravel (Sanctum)
tags: [laravel, backend, api, auth]
---

# Quand utiliser ce pattern

Backend Laravel consommé par un frontend Nuxt sur le même domaine racine
(mode SPA cookie) ou par un client mobile/tiers (mode token Bearer).

# Dépendances

- [Conventions Laravel générales](/frameworks/laravel.md)
- [Laravel Sanctum](/patterns/auth/dependencies/laravel-sanctum.md)

# Fichiers à générer

Chemins détaillés dans [Laravel 13 — chemins](/frameworks/laravel/v13.md).

# Modèle User

```php
// app/Models/User.php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;
    // ...
}
```

# Configuration CORS (mode SPA)

```php
// config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')],
    'allowed_headers' => ['*'],
    'supports_credentials' => true, // obligatoire pour le mode cookie
];
```

# Variables d'environnement

```
SESSION_DOMAIN=.monsite.fr
SANCTUM_STATEFUL_DOMAINS=app.monsite.fr,localhost:3000
FRONTEND_URL=https://app.monsite.fr
```

# Controller d'authentification

```php
// app/Http/Controllers/Api/AuthController.php
class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate(['email' => 'required|email', 'password' => 'required']);

        if (! Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Identifiants invalides'], 401);
        }

        $request->session()->regenerate();

        return response()->json(['user' => Auth::user()]);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(null, 204);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
```

# Routes

```php
// routes/api.php
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [RegisteredUserController::class, 'store']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
});
```

# Pièges à éviter

- Le frontend doit appeler `GET /sanctum/csrf-cookie` avant le premier
  `POST /login` — sans ça, Laravel répond 419 (CSRF token mismatch).
- `supports_credentials: true` dans `cors.php` ET `credentials: 'include'`
  côté client Nuxt sont les deux faces de la même pièce — l'un sans
  l'autre ne fonctionne pas.
- Si frontend et backend sont sur des domaines complètement différents
  (pas de domaine racine commun), le mode cookie SPA ne fonctionne pas —
  basculer en mode token Bearer (`$user->createToken(...)`) dans ce cas.