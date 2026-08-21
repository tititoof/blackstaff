---
type: Recipe
title: Pattern BFF — nuxt-auth-utils devant Rails/Devise
tags: [nuxt, auth, rails, devise, bff]
---

# Pattern BFF — nuxt-auth-utils devant Rails/Devise

Dépend de [/integrations/nuxt-auth-utils/session-basics.md](/integrations/nuxt-auth-utils/session-basics.md).

Nuxt agit en Backend-For-Frontend : jamais de session Rails/cookie Devise
exposée directement au navigateur. Le flux est toujours le même quelle que
soit la stratégie Devise choisie :

1. Le client appelle `POST /api/auth/login` (route Nuxt).
2. La route Nuxt appelle Rails (`loginBackendPath` du contrat) avec les
   identifiants.
3. Rails répond avec un token ou établit une session (selon la stratégie).
4. La route Nuxt stocke dans `setUserSession` uniquement ce qui est
   nécessaire pour ré-authentifier les appels suivants — voir le pattern
   de stratégie correspondant, résolu via `authStrategy` du contrat :
   - [/integrations/nuxt-auth-utils/devise-jwt-pattern.md](/integrations/nuxt-auth-utils/devise-jwt-pattern.md)
   - [/integrations/nuxt-auth-utils/devise-token-auth-pattern.md](/integrations/nuxt-auth-utils/devise-token-auth-pattern.md)
   - [/integrations/nuxt-auth-utils/devise-session-csrf-pattern.md](/integrations/nuxt-auth-utils/devise-session-csrf-pattern.md)
5. Les routes protégées suivantes lisent la session via
   `requireUserSession` et forwardent les credentials stockés vers Rails.

# Pièges à éviter

- Ne jamais choisir la stratégie au moment de la génération d'une route :
  elle est fixée une fois dans `.blackstaff/index.md` (`stack.backend.authProvider`)
  et résolue par le contrat, pas redécidée fichier par fichier.
- Ne pas mélanger deux stratégies dans le même projet — n'injecter que le
  pattern de la stratégie déclarée, jamais les trois en même temps dans
  le contexte du LLM.
