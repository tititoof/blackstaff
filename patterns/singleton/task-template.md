# Gabarit de tâche — pattern Singleton

Garantit qu'une seule instance partagée existe.

## ⚠️ Spécifique à TypeScript/ES Modules — à vérifier AVANT toute chose

En JS/TS, un module ES exporté (`export const instance = ...`) EST déjà un singleton
par nature du système de modules (une seule évaluation, un seul objet partagé entre
tous les imports). **N'implémente PAS de classe avec constructeur privé + `getInstance()`
statique** sauf raison précise et explicite (ex: lazy initialization coûteuse
nécessaire, paramétrage à l'instanciation). Dans l'écrasante majorité des cas côté
Nuxt/TS, un simple module exportant une constante suffit.

## Fichiers attendus (cas simple, largement suffisant)

⚠️ Les chemins ci-dessus utilisent `{domain}s/` sans préfixe — c'est un raccourci
générique, pas le chemin final. Le PRÉFIXE RÉEL dépend du framework/côté en cours
(ex: `app/` pour Nuxt 4 frontend, `app/models/` ou équivalent pour Rails) — vérifie
les conventions du framework déjà chargées (frameworks/{framework}/v{N}.md) ou les
autres gabarits du projet (crud/builder s'ils sont disponibles) et utilise EXACTEMENT
le même préfixe. N'utilise jamais un chemin sans préfixe si le framework en impose un.

⚠️ Le nom de domaine utilisé dans les exemples ci-dessus est un EXEMPLE DE FORME
UNIQUEMENT — jamais à recopier tel quel. Remplace-le PARTOUT par le vrai domaine de
la tâche reçue (celui de l'analyse fonctionnelle). Si ta réponse finale contient ce
mot d'exemple alors que la tâche n'en parle pas, c'est une ERREUR CRITIQUE : tu as
recopié le gabarit au lieu du vrai sujet — relis ta réponse avant de la finaliser.

- {domain}/{nom}.ts (`export const {nom} = ...` — instance unique créée à l'import,
  partagée par tous les consommateurs)

## Fichiers attendus (cas avancé, SEULEMENT si lazy init ou paramétrage nécessaire)

- {domain}/{Nom}.ts (classe avec constructeur privé, méthode statique
  `getInstance()` qui crée l'instance au premier appel puis la réutilise)

## Règles

- Ne JAMAIS dupliquer un état qui devrait être partagé (ex: recréer un client HTTP à
  chaque appel de composable alors qu'un seul suffit pour toute l'app).
- Si l'état partagé doit être réactif côté Vue, préférer un store Pinia à un vrai
  Singleton classe — Pinia gère déjà ce rôle de façon idiomatique dans Nuxt.

## Quand NE PAS l'utiliser

- L'état est spécifique à un composant ou une session utilisateur (pas vraiment
  global) → ce n'est pas un Singleton, c'est de l'état local ou un store Pinia normal.
