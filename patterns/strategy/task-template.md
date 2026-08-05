# Gabarit de tâche — pattern Strategy

Encapsule des algorithmes/comportements interchangeables derrière une interface
commune, sélectionnables à l'exécution.

## Fichiers attendus (à adapter au domaine, ex: "PricingStrategy")

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
- {domain}s/types.ts (interface {Strategy} déclarant la méthode commune — signature
  complète, ex: `calculate(input: X): number`)

### Stratégies concrètes
- {domain}s/{ConcreteStrategyA}.ts, {domain}s/{ConcreteStrategyB}.ts (une classe/objet
  par stratégie — au moins DEUX, sinon voir "Quand NE PAS l'utiliser")

### Contexte / consommateur
- {domain}s/{Context}.ts OU composables/use{Domain}.ts (reçoit une stratégie en
  paramètre/injection et l'utilise via l'interface commune — ne connaît JAMAIS le
  détail d'implémentation d'une stratégie concrète)

## Règles

- Le contexte/consommateur appelle UNIQUEMENT la méthode de l'interface {Strategy},
  jamais une méthode spécifique à une implémentation concrète.
- Le changement de stratégie doit être possible sans modifier le code du contexte
  (injection au constructeur, prop, ou paramètre de fonction).
- Chaque stratégie est un fichier séparé, jamais un switch/if interne à une seule
  classe — ce serait annuler l'intérêt du pattern.

## Quand NE PAS l'utiliser

- Un seul algorithme existe et aucune variation n'est prévue → implémente-le
  directement, pas de couche d'abstraction.
- Les "stratégies" ne sont que des constantes de configuration (pas de comportement
  différent, juste des valeurs) → une simple table de lookup suffit.
