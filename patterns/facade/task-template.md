# Gabarit de tâche — pattern Facade

Fournit une interface simplifiée et unifiée au-dessus d'un sous-système complexe
(plusieurs classes/services/composables).

## En Nuxt, ceci prend souvent la forme d'un composable qui en orchestre d'autres

Si le sous-système est déjà composé de composables Vue existants, la Facade est
simplement un NOUVEAU composable qui les combine — pas une classe séparée.

## Fichiers attendus (à adapter au domaine, ex: "Checkout")

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

### Facade
- composables/use{Domain}.ts (point d'entrée UNIQUE exposant quelques méthodes
  simples de haut niveau, ex: `checkout(cart): Promise<Order>`, qui orchestre en
  interne plusieurs composables/services : validation panier, paiement, création
  commande, notification — sans exposer ces étapes individuellement à l'appelant)

## Règles

- Le consommateur (page, composant) n'appelle QUE la Facade — jamais directement les
  composables/services internes qu'elle orchestre.
- La Facade gère l'ORDRE des opérations et la gestion d'erreur globale (si une étape
  échoue, que se passe-t-il pour les suivantes) — c'est sa vraie valeur ajoutée.
- Ne PAS dupliquer la logique métier dans la Facade : elle orchestre des appels
  existants, elle n'en réimplémente pas le contenu.

## Quand NE PAS l'utiliser

- Le "sous-système" ne comporte qu'un seul composable/service → pas besoin de Facade,
  appelle-le directement.
- Chaque étape doit rester indépendamment appelable par l'UI (pas toujours dans le
  même ordre groupé) → une Facade qui impose UN enchaînement fixe serait inadaptée.
