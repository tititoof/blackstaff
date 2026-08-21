---
type: Recipe
title: Stratégie devise_token_auth
tags: [rails, devise, devise_token_auth, auth]
---

# Stratégie devise_token_auth

Dépend de [/integrations/nuxt-auth-utils/bff-proxy-pattern.md](/integrations/nuxt-auth-utils/bff-proxy-pattern.md).

`devise_token_auth` retourne trois headers distincts à chaque réponse
authentifiée : `access-token`, `client`, `uid`. Les trois sont nécessaires
pour authentifier l'appel suivant — ce n'est pas un token unique.

## Ce que la route Nuxt de login doit faire

1. Appeler Rails, lire les trois headers de la réponse.
2. `setUserSession(event, { user: {...}, railsAuth: { accessToken, client, uid } })`.

## Ce que les routes protégées doivent faire

1. Lire `session.railsAuth`.
2. Forwarder les trois valeurs en headers vers Rails à chaque appel.
3. `devise_token_auth` fait tourner le `access-token` à chaque requête —
   la réponse Rails contient de nouveaux headers à re-stocker via
   `setUserSession` (pas `replaceUserSession`, pour ne pas perdre le
   reste de la session).

# Pièges à éviter

- Oublier de re-stocker les headers renouvelés est l'erreur la plus
  fréquente avec cette stratégie — elle invalide la session au bout d'un
  seul appel supplémentaire.
