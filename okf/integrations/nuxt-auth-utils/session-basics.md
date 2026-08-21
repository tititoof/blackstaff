---
type: Reference
title: nuxt-auth-utils — bases de la session
tags: [nuxt, auth, nuxt-auth-utils]
---

# nuxt-auth-utils — bases de la session

La session est un cookie chiffré côté Nitro (server/), pas une donnée
stockée en base par défaut. Fonctions serveur disponibles :

- `setUserSession(event, data)` — fusionne avec la session existante
- `replaceUserSession(event, data)` — remplace entièrement
- `getUserSession(event)` — lit la session courante
- `clearUserSession(event)` — déconnexion
- `requireUserSession(event)` — 401 automatique si pas de `user`

Côté client : composable `useUserSession()`.

# Contrainte dure

Le cookie chiffré est limité à 4096 octets. Ne jamais y stocker un objet
utilisateur complet — seulement l'identifiant et les champs strictement
nécessaires à l'affichage + le token d'accès backend si la stratégie
choisie l'exige (voir le pattern de stratégie correspondant).

# Pièges à éviter

- Vérifier la signature exacte de ces fonctions via le MCP Nuxt au moment
  de la génération réelle — ce document donne le rôle de chaque fonction,
  pas une garantie de signature figée dans le temps.
- Ne jamais générer de logique d'auth qui contourne `requireUserSession`
  pour "simplifier" une route protégée.
