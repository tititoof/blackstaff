# Gabarit de tâche — pattern Factory Method

Choisit QUEL type concret instancier selon un critère, sans exposer la logique de
choix à l'appelant.

## Fichiers attendus (à adapter au domaine, ex: "Notification")

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
- {domain}s/types.ts (interface {Product} commune à toutes les variantes — TOUS les
  champs/méthodes communs listés explicitement)

  ⚠️ Liste les champs/méthodes concrets, ex :
  `notifications/types.ts (Notification : send(): Promise<void>, getRecipient(): string)`

### Variantes concrètes
- {domain}s/{ConcreteA}.ts, {domain}s/{ConcreteB}.ts (une classe par variante,
  implémente {Product} — au moins DEUX variantes, sinon la Factory n'a pas de raison
  d'être, voir "Quand NE PAS l'utiliser")

### Factory
- {domain}s/{Product}Factory.ts (fonction/classe unique `create(type: string):
  {Product}` qui retourne la bonne variante — cette fonction est le SEUL endroit
  du code qui connaît la correspondance type→classe concrète)

## Règles

- L'appelant ne doit JAMAIS instancier directement une variante concrète
  (`new PdfNotification()`) — toujours passer par `{Product}Factory.create()`.
- Chaque variante doit être un fichier séparé, jamais regroupées dans un seul fichier
  avec des if/switch internes (ça viderait le pattern de son intérêt).
- Si une variante nécessite une dépendance externe spécifique (ex: un client API),
  cette dépendance est injectée dans SON constructeur, jamais dans la Factory elle-même.

## Quand NE PAS l'utiliser

- Une seule variante existe et aucune autre n'est prévue à court terme → instancie
  directement, pas de Factory.
- Le choix entre variantes ne dépend que d'une simple condition booléenne stable
  → un simple `if` dans l'appelant suffit, ne pas imposer une couche Factory pour ça.
