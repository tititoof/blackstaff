# Exemple appris — thinking-plan (nuxt)

> Fichier d'origine : `thinking-plan`
> Corrigé par Claude suite à une revue automatique.
> Contexte : User Authentication with Persistent Session — Ajoute la possibilité de se connecter et de se déconnecter, avec une session qui persiste.

## Ce qui a été corrigé

Plan approuvé par Claude (score 82/100) — Le plan est globalement cohérent et proportionné pour une auth persistante avec nuxt-auth-utils. Les 4 fichiers couvrent le flux essentiel, mais l'absence de shared/types/user.ts et la description floue du middleware sont des points à clarifier avant génération.

```
TITRE: User Authentication with Persistent Session

## Objectif

Allow users to log in and out, with the session remaining active across multiple interactions until explicitly logged out.

_Choix d'architecture : L'implémentation doit inclure la gestion de l'authentification, qui est un élément essentiel pour cette tâche._

## Fichiers à générer

### Middleware

- app/middleware/auth.ts (Middleware pour protéger les routes liées à l'authentification.)

### Server API

- server/api/auth/login.post.ts (Endpoint POST pour le login de l'utilisateur.)
- server/api/auth/register.post.ts (Endpoint POST pour le registration d'un nouvel utilisateur.)
- server/api/auth/logout.delete.ts (Endpoint DELETE pour se déconnecter de l'utilisateur.)

## Entités principales

User

## Dépendances déclarées

- npm : zod, nuxt-auth-utils, @nuxt/test-utils, vitest, @vue/test-utils, happy-dom, playwright-core, @vitest/coverage-v8
```