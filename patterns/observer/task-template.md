# Gabarit de tâche — pattern Observer

Notifie plusieurs dépendants d'un changement d'état, sans couplage fort entre eux.

## ⚠️ Spécifique à Vue/Nuxt — à vérifier AVANT toute chose

La réactivité native de Vue (`ref`, `reactive`, `watch`, `computed`) EST déjà une
implémentation du pattern Observer. Si le besoin se limite à "des composants réagissent
à un changement d'état dans l'app", **n'implémente PAS de classes Observer/Subject
manuelles** — utilise `ref`/`watch`/un store Pinia. Ce gabarit ne s'applique QUE si le
besoin dépasse la réactivité Vue (ex: écouter des événements WebSocket, un flux externe
non réactif, un bus d'événements entre modules non-Vue).

## Fichiers attendus (si le cas ci-dessus est confirmé)

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

### Types
- {domain}s/types.ts (interface {Subject} : subscribe(observer), unsubscribe(observer),
  notify(event) ; interface {Observer} : update(event))

### Implémentation
- {domain}s/{ConcreteSubject}.ts (maintient la liste d'observateurs, déclenche notify()
  sur changement d'état réel)
- {domain}s/{ConcreteObserver}.ts (un fichier par observateur concret si plusieurs
  comportements différents sont attendus)

## Règles

- Le Subject ne connaît JAMAIS le détail d'implémentation d'un Observer — uniquement
  l'interface {Observer}.
- La désinscription (`unsubscribe`) doit être prévue et utilisée pour éviter les fuites
  mémoire (observateurs jamais nettoyés).

## Quand NE PAS l'utiliser

- Le besoin est de la réactivité UI standard dans un composant Vue → `ref`/`watch`,
  jamais ce pattern.
- Un seul observateur existe → un simple callback/événement direct suffit.
