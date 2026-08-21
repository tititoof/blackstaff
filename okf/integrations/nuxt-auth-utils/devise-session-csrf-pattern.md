---
type: Recipe
title: Stratégie session Rails classique + CSRF
tags: [rails, devise, csrf, auth]
---

# Stratégie session Rails classique + CSRF

Dépend de [/integrations/nuxt-auth-utils/bff-proxy-pattern.md](/integrations/nuxt-auth-utils/bff-proxy-pattern.md).

Rails maintient sa propre session (cookie `_session_id`) et exige un
token CSRF sur les requêtes mutatives. Cette stratégie suppose que le
serveur Nitro maintient une session HTTP persistante vers Rails (via un
client HTTP avec jar de cookies) — plus lourde à opérer qu'un token.

## Ce que la route Nuxt de login doit faire

1. Récupérer un token CSRF Rails (`GET /rails/csrf_token` ou équivalent
   exposé par le backend).
2. Poster les identifiants avec ce token, conserver le cookie de session
   Rails.
3. Stocker dans `setUserSession` uniquement un identifiant opaque de
   session interne — jamais le cookie Rails brut dans le cookie Nuxt.

# Pièges à éviter

- Cette stratégie ne convient pas à un déploiement multi-instance sans
  session store partagé côté Rails — le signaler explicitement si le
  contrat indique un backend scalé horizontalement.
- Ne pas confondre le cookie de session Nuxt (chiffré, côté client) et le
  cookie de session Rails (doit rester côté serveur Nitro uniquement).
