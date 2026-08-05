# Gabarit de tâche — pattern Builder (GoF)

Une tâche qui implémente un Builder doit systématiquement couvrir :

## Fichiers attendus (à adapter au domaine, ex: "Report", "Query", "Form")

⚠️ TOUS les chemins ci-dessous utilisent le préfixe `app/` (Nuxt 4) — jamais de dossier
`builders/` ou `composables/` à la racine, exactement comme pour les autres patterns
de ce projet (crud, auth). Un fichier hors de `app/` (ou `server/` pour du code serveur)
est invisible pour l'auto-import Nuxt et casse le reste de la chaîne.

### Types
- shared/types/{domain}s.ts (interface {Product} du produit fini, interface
  {Builder}Interface déclarant les étapes — TOUS les champs/étapes concrets, pas de
  placeholders vagues)

  ⚠️ Ce fichier ne contient QUE des `interface` TypeScript (structure de données pure,
  sans état ni logique) — jamais de `class`, jamais d'implémentation. Le ConcreteBuilder
  (ci-dessous) est une CLASSE, dans un fichier SÉPARÉ, qui `implements {Builder}Interface`
  — jamais `extends` un type/interface. Si tu écris `extends` sur quelque chose défini
  dans shared/types/, c'est une erreur : une classe implémente une interface, elle
  n'étend jamais un type structurel.
  Si une deuxième variante concrète (ex: PDF vs CSV) ajoute des champs propres à elle,
  ces champs supplémentaires vont dans SA PROPRE interface optionnelle (ex:
  `PdfReportOptions`) explicitement définie ici avec ses champs concrets listés — jamais
  laissés vagues ("options supplémentaires pour X") ni ajoutés par héritage d'un type.

  ⚠️ Liste les champs/étapes concrets dans la description, avec le VRAI domaine de LA
  TÂCHE EN COURS (celui de l'analyse fonctionnelle reçue) — JAMAIS "Report"/"Product"
  ni aucun nom d'exemple générique. Pour illustrer UNIQUEMENT la forme attendue (pas le
  contenu à copier) :
  `shared/types/{EXEMPLE-DE-FORME-UNIQUEMENT-PAS-A-COPIER}.ts ({XxxYyy} : champA, champB,
  champC ; {XxxYyy}Builder : reset, addChampA, addChampB, setChampC)`.
  ⚠️ SI ta réponse finale contient le mot "Report", "PdfReportBuilder", ou tout autre nom
  tiré de CET exemple de format alors que la tâche ne parle pas de rapports — c'est une
  ERREUR CRITIQUE : tu as recopié l'exemple au lieu d'utiliser le vrai sujet de la tâche.
  Relis ta réponse avant de la finaliser et vérifie que TOUS les noms viennent bien de
  l'analyse fonctionnelle que tu as reçue, pas de ce gabarit.
  Tout schéma de validation mentionné ailleurs (ex: "createXxxSchema") DOIT être déclaré
  comme export de CE fichier UNIQUEMENT, jamais dupliqué dans un autre fichier ni
  seulement mentionné sans exister nulle part.

### ConcreteBuilder(s)
- app/builders/{domain}s/{ConcreteX}{Builder}.ts (un fichier par variante concrète — au
  moins UNE, souvent deux si la tâche mentionne plusieurs représentations. Le nom EXACT
  du fichier et de la classe DOIT venir du domaine réel de la tâche — ex: si la tâche
  concerne une recherche, un nom valide serait `InteractiveSearchBuilder`, jamais
  `PdfReportBuilder` ou toute variante du mot "Report" qui n'a de sens QUE si la tâche
  parle explicitement de rapports.)

### Director (si des recettes réutilisables sont mentionnées dans l'instruction)
- app/builders/{domain}s/{Director}.ts (uniquement si l'instruction évoque des
  configurations prédéfinies réutilisables — sinon, l'omettre plutôt que d'imposer une
  couche inutile)

### Composable façade
- app/composables/use{Domain}Builder.ts (point d'entrée réactif pour les composants —
  toute fonction/type qu'il retourne ou consomme, comme un type de résultat de
  recherche, doit être déclarée dans shared/types/{domain}s.ts ci-dessus, jamais
  référencée sans être définie nulle part)

  ⚠️ Le nom de la fonction exportée dans `exports` DOIT être EXACTEMENT identique au
  nom utilisé dans la description (ex: si la description dit `useSearchRequestBuilder`,
  `exports` doit contenir `"useSearchRequestBuilder"`, jamais un autre nom comme
  `createXxx`). Relis ta réponse avant de la finaliser : le nom dans `exports` et le nom
  dans `description` doivent matcher au caractère près.

## Règles

- Respecter STRICTEMENT la structure du pattern `builder` déjà défini pour ce projet
  (voir patterns/builder/recipes/{côté}/{framework}-builder.md) — ne pas réinventer
  une variante différente du même pattern.
- `.reset()` retourne `this`, appelé automatiquement dans `getResult()`.
- `getResult()` reste HORS de l'interface `{Builder}Interface` commune (les produits
  peuvent différer entre ConcreteBuilders).
- N'ajoute un Director QUE si la tâche mentionne explicitement des recettes de
  construction réutilisables — sinon, la construction manuelle étape par étape suffit.
- Un Builder n'est justifié QUE si l'objet a plusieurs champs/étapes optionnels. Pour
  un objet simple, ne PAS proposer de Builder — le signaler dans le résumé du plan
  plutôt que de sur-ingénierer.