---
type: Recipe
title: Auth API Symfony (LexikJWTAuthenticationBundle)
tags: [symfony, backend, api, auth]
---

# Quand utiliser ce pattern

Backend Symfony en API stateless, consommé par un frontend séparé (Nuxt
ou autre SPA), authentification par JWT Bearer.

# Dépendances

- [Conventions Symfony générales](/frameworks/symfony.md)
- [Symfony Security Bundle](/patterns/auth/dependencies/symfony-security-bundle.md)
- [LexikJWTAuthenticationBundle](/patterns/auth/dependencies/symfony-jwt.md)

# Fichiers à générer

Chemins détaillés dans [Symfony 7.4 LTS — chemins](/frameworks/symfony/v7.md)
(référence par défaut — voir [Symfony 8.1](/frameworks/symfony/v8.md) si le
projet a besoin de la dernière version standard plutôt que la LTS).

# Configuration sécurité

```yaml
# config/packages/security.yaml
security:
    password_hashers:
        App\Entity\User: auto
    providers:
        app_user_provider:
            entity:
                class: App\Entity\User
                property: email
    firewalls:
        login:
            pattern: ^/api/login
            stateless: true
            json_login:
                check_path: /api/login_check
                success_handler: lexik_jwt_authentication.handler.authentication_success
                failure_handler: lexik_jwt_authentication.handler.authentication_failure
        api:
            pattern: ^/api
            stateless: true
            jwt: ~
    access_control:
        - { path: ^/api/login, roles: PUBLIC_ACCESS }
        - { path: ^/api/register, roles: PUBLIC_ACCESS }
        - { path: ^/api, roles: IS_AUTHENTICATED_FULLY }
```

# Configuration JWT

```yaml
# config/packages/lexik_jwt_authentication.yaml
lexik_jwt_authentication:
    secret_key: '%env(resolve:JWT_SECRET_KEY)%'
    public_key: '%env(resolve:JWT_PUBLIC_KEY)%'
    pass_phrase: '%env(JWT_PASSPHRASE)%'
    token_ttl: 3600
```

# Entité User

```php
// src/Entity/User.php
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    public function getUserIdentifier(): string { return $this->email; }
    public function getPassword(): ?string { return $this->password; }
    public function getRoles(): array { return ['ROLE_USER']; }
    public function eraseCredentials(): void {}
}
```

# Controller (route /api/me uniquement — login géré par Lexik)

```php
// src/Controller/Api/AuthController.php
#[Route('/api/me', methods: ['GET'])]
public function me(#[CurrentUser] User $user): JsonResponse
{
    return $this->json(['email' => $user->getUserIdentifier()]);
}
```

# CORS

```yaml
# config/packages/nelmio_cors.yaml (nécessite nelmio/cors-bundle)
nelmio_cors:
    defaults:
        origin_regex: true
        allow_origin: ['%env(FRONTEND_URL)%']
        allow_headers: ['*']
        allow_methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
        expose_headers: ['Authorization']
    paths:
        '^/api/': ~
```

# Pièges à éviter

- Le firewall `login` doit être déclaré **avant** `api` dans
  `security.yaml` — l'ordre des firewalls est significatif, Symfony
  applique le premier qui matche le pattern de l'URL.
- `access_control` doit explicitement autoriser `PUBLIC_ACCESS` sur
  `/api/login` et `/api/register` — sinon ces routes elles-mêmes exigent
  un JWT déjà valide, ce qui est un paradoxe bloquant pour la connexion.
- Le bundle `nelmio/cors-bundle` n'est pas inclus par défaut avec
  `lexik/jwt-authentication-bundle` — à ajouter séparément si CORS est
  nécessaire (cas systématique avec un frontend Nuxt séparé).