# Gabarit de tâche — pattern Adapter

Convertit l'interface d'un service/librairie externe vers l'interface attendue par
l'application, pour ne pas laisser fuir la forme du tiers dans le code métier.

## Fichiers attendus (à adapter au service externe, ex: "PaymentProvider")

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
- {domain}s/types.ts (interface {Target} — la forme ATTENDUE par l'application,
  indépendante du fournisseur externe, ex: `charge(amount: number): Promise<Receipt>`)

### Adapter(s)
- {domain}s/{ExternalService}Adapter.ts (implémente {Target}, traduit en interne vers
  l'API réelle du service tiers — c'est le SEUL fichier qui connaît la forme exacte de
  l'API externe)

## Règles

- Le reste de l'application n'importe et n'appelle JAMAIS le SDK/client du service
  tiers directement — uniquement l'interface {Target} via l'Adapter.
- Si le service tiers change (migration de fournisseur), seul le fichier Adapter doit
  changer — aucun autre fichier de l'application ne doit être impacté.
- Les types/erreurs spécifiques au tiers sont traduits en types/erreurs propres à
  l'application à l'intérieur de l'Adapter, jamais propagés tels quels.

## Quand NE PAS l'utiliser

- Le service externe est appelé à un seul endroit et aucun changement de fournisseur
  n'est envisagé → un appel direct suffit, l'Adapter ajouterait de l'indirection
  sans bénéfice réel.
