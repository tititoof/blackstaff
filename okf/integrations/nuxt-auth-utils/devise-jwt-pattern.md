---
type: Recipe
title: Stratégie devise-jwt
tags: [rails, devise, jwt, auth]
---

# Stratégie devise-jwt

Dépend de [/integrations/nuxt-auth-utils/bff-proxy-pattern.md](/integrations/nuxt-auth-utils/bff-proxy-pattern.md).

Rails répond au login avec un JWT (souvent dans le header `Authorization`
de la réponse, à vérifier côté implémentation réelle du gem `devise-jwt`).

## Ce que la route Nuxt de login doit faire

1. Appeler Rails, récupérer le token.
2. `setUserSession(event, { user: {...}, railsToken: token })`.
3. Ne jamais renvoyer le token brut au client dans le corps JSON — il ne
   doit exister que dans le cookie chiffré.

## Ce que les routes protégées doivent faire

1. `const session = await requireUserSession(event)`
2. Appeler Rails avec le header `Authorization: Bearer ${session.railsToken}`.

# Pièges à éviter

- Le JWT `devise-jwt` a une expiration — une route protégée qui reçoit un
  401 de Rails doit déclencher un `clearUserSession`, pas juste propager
  l'erreur brute.
