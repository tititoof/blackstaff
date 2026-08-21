# Exemple appris — thinking-plan (nuxt)

> Fichier d'origine : `thinking-plan`
> Corrigé par Claude suite à une revue automatique.
> Contexte : Inscription utilisateur — Créer un formulaire d'inscription qui vérifie les données de l'utilisateur (nom, email, mot de passe) et les stocke en base de données après avoir confirmé qu'ils sont valides.

## Ce qui a été corrigé

Plan approuvé par Claude (score 88/100) — Le plan est solide et cohérent avec le gabarit auth : 8 fichiers bien répartis, endpoints REST corrects, validation Zod déclarée. Trois points mineurs à clarifier (source de vérité user.ts, champ name manquant, middleware sans page protégée cible) mais rien de bloquant.

```
TITRE: Inscription utilisateur

## Objectif

Permettre à un utilisateur de s'inscrire en fournissant son nom, son email et son mot de passe, puis de stocker ces informations dans un système persistant

_Choix d'architecture : La tâche implique des opérations d'inscription et connexion, nécessitant une gestion d'authentification._

## Fichiers à générer

### Types

- shared/types/auth.ts (loginSchema + registerSchema en Zod, types dérivés via z.infer — champs adaptés au besoin réel de la tâche (email: string (format email), password: string (min 8)))
- shared/types/user.ts (interface utilisateur retournée par le backend/la source d'authentification — énumère les champs réels (id: number, email: string))

### Pages

- app/pages/login.vue (formulaire de connexion — email + mot de passe, validation, redirection vers la page principale après succès)
- app/pages/register.vue (formulaire d'inscription — champs adaptés au besoin réel, redirection vers la page principale après succès)

### Middleware

- app/middleware/auth.ts (garde de route — TOUJOURS présent si des pages doivent être protégées)

### Server API

- server/api/auth/login.post.ts (endpoint pour la connexion utilisateur — vérifie les données, crée une session)
- server/api/auth/register.post.ts (endpoint pour l'inscription utilisateur — vérifie les données, crée une session)
- server/api/auth/logout.delete.ts (endpoint pour la déconnexion utilisateur — vérifie la session et la supprime)

## Dépendances déclarées

- npm : zod, nuxt-auth-utils, @nuxt/test-utils, vitest, @vue/test-utils, happy-dom, playwright-core, @vitest/coverage-v8
```