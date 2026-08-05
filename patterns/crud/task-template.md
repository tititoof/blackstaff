# Gabarit de tâche — pattern CRUD

Une tâche CRUD complète sur une ressource doit systématiquement couvrir :

⚠️ `{ressource}`/`{Ressource}` doivent TOUJOURS être résolus en anglais, même si
l'instruction d'origine est en français (ex: "recherche" → "search", pas "recherche").
Aucun caractère accentué dans un chemin de fichier ou un nom de type.

## Fichiers attendus (à adapter au nom de la ressource, ex: "article")

### Types (TOUJOURS en premier dans la liste)
- shared/types/{ressource}.ts (Nuxt 4 — schéma zod {ressource}Schema comme SOURCE DE
  VÉRITÉ, dont le type TypeScript {Ressource} est dérivé via `z.infer` — jamais
  l'inverse. Réutilisé par le composable, les pages ET les endpoints serveur pour la
  validation. Le préfixe `shared/` est requis car ce fichier est accédé à la fois
  depuis `app/` et `server/`.)

  ⚠️ **La description de ce fichier dans le plan DOIT lister les champs concrets**,
  pas juste "interface partagée". Exemple de description attendue :
  `types/article.ts (schéma zod Article : id: number, title: string (min 1), content:
  string, authorId: number, publishedAt: string | null, createdAt: string — exporte
  aussi createArticleSchema pour la création, sans id/createdAt)`

  Règle pour déterminer les champs :
  - Si l'instruction de l'utilisateur mentionne des champs précis, utilise-les tels quels.
  - Sinon, invente des champs RAISONNABLES et COURANTS pour ce type de ressource
    (ex: un article a typiquement title/content/author/publishedAt ; un produit a
    typiquement name/description/price/stock). Ne laisse jamais la liste de champs vide
    ou vague ("des informations sur X") — sois toujours concret et énumératif.
  - Chaque champ doit apparaître sous la forme `nom: type` (ex: `price: number`,
    `isPublished: boolean`), avec `?` si optionnel.
  - Prévoir un schéma de validation dédié pour la création/édition (ex:
    `create{Ressource}Schema`), généralement le schéma complet SANS les champs générés
    côté serveur (id, createdAt, etc.).

### Composables
- app/composables/use{Ressource}s.ts (list, get, create, update, remove — TOUTES
  les opérations, pas juste create. Doit importer et utiliser le type partagé ci-dessus,
  pas redéfinir sa propre interface)

  ⚠️ Le chemin est TOUJOURS `app/composables/` (Nuxt 4) — jamais `composables/` sans
  préfixe. Utilise EXACTEMENT ce même préfixe `app/` que pour les pages, composants et
  middleware ci-dessous — ne JAMAIS faire d'exception pour les composables.

  ⚠️ **La description DOIT lister les fonctions exportées avec leur signature**, pas
  juste "gère les opérations". Exemple de description attendue :
  `composables/useArticles.ts (exporte : list(): Article[], get(id): Article,
  create(input: CreateArticleInput): Article, update(id, input): Article,
  remove(id): void)`. Tout fichier qui appelle une de ces fonctions plus tard DOIT
  utiliser exactement ces noms — pas de référence à une fonction non déclarée ici.

### Components
- app/components/{ressource}s/form.vue (formulaire commun à create et edit, un
  champ de formulaire par champ du type {ressource} — décris explicitement les champs
  de saisie attendus dans la description, en reprenant les MÊMES noms/types que dans
  types/{ressource}.ts)

  ⚠️ **CE FICHIER EST OBLIGATOIRE dès qu'une page create.vue ou edit.vue existe** —
  jamais une page create/edit sans son components/{ressource}s/form.vue correspondant.
  Vérifie AVANT de finaliser ta réponse : chaque ressource avec create.vue/edit.vue
  a-t-elle bien SON form.vue dans la liste ?

### Pages
- app/pages/{ressource}s/index.vue (liste)
- app/pages/{ressource}s/[id].vue (détail)
- app/pages/{ressource}s/create.vue (création, utilise app/components/{ressource}s/form.vue)
- app/pages/{ressource}s/[id]/edit.vue (édition, utilise app/components/{ressource}s/form.vue —
  TOUJOURS présent si le composable expose update)

  ⚠️ Le chemin est TOUJOURS `app/pages/` et `app/components/` (Nuxt 4) — jamais sans
  le préfixe `app/`, exactement comme pour les composables ci-dessus.

  ℹ️ `[id].vue` et `[id]/edit.vue` coexistent ici — c'est la convention Nuxt officielle
  et documentée (voir la doc de migration Nuxt, exemple pages/users/[user].vue +
  pages/users/[user]/edit.vue), aucun conflit de routage à anticiper.

### Server (si l'API n'existe pas déjà côté backend)
- server/api/{ressource}s/index.get.ts (liste)
- server/api/{ressource}s/[id].get.ts (détail)
- server/api/{ressource}s/index.post.ts (création — ⚠️ TOUJOURS sous le dossier
  {ressource}s/, JAMAIS server/api/{ressource}s.post.ts à la racine : Nitro générerait
  une URL incohérente avec les autres routes de la même ressource. Valide le body avec
  create{Ressource}Schema.safeParse(body) AVANT toute écriture ; si invalide, renvoie
  createError({ statusCode: 422, message: 'Validation échouée', data: result.error.flatten() }))
- server/api/{ressource}s/[id].patch.ts (édition — même validation zod que la création,
  avec un schéma partiel si les champs sont optionnels en mise à jour)
- server/api/{ressource}s/[id].delete.ts (suppression)

## Si le pattern `auth` est ÉGALEMENT résolu pour cette tâche

Les routes qui modifient la ressource (create, edit, delete — et leurs endpoints
POST/PATCH/DELETE correspondants) doivent être protégées par le mécanisme de garde
décrit dans le gabarit du pattern `auth` (middleware de route côté pages, vérification
de session côté endpoints serveur). Mentionne explicitement cette protection dans la
description de chaque fichier concerné (ex: "nécessite une session active").
La page `index.vue` (liste) et `[id].vue` (détail) peuvent rester publiques selon le
contexte métier — à décider selon l'instruction, pas systématiquement protégées.

## Règles

- Les endpoints server/api NE DOIVENT JAMAIS importer ni appeler un composable Vue
  (`use{Ressource}s()`) — les composables sont réservés au CLIENT. Le serveur accède
  aux données directement (base de données, fichier, ou couche service dédiée), jamais
  via un composable pensé pour l'UI. Le composable, lui, appelle les endpoints serveur
  via `$fetch` — jamais l'inverse.
- Les endpoints GET (liste, détail) N'ONT PAS de body à valider — ne JAMAIS mentionner
  de validation zod sur un GET. La validation zod ne s'applique qu'aux endpoints qui
  écrivent (POST, PATCH).
- Le nom de la fonction de liste dans le composable est EXACTEMENT `list()`, jamais
  `getList()` ni une autre variante — reste cohérent avec ce gabarit, pas d'improvisation
  de nommage.
- TOUT endpoint serveur qui écrit des données (POST, PATCH) DOIT valider le body reçu
  avec le schéma zod correspondant AVANT toute écriture. Aucune exception. En cas
  d'échec de validation, renvoyer une erreur 422 structurée (pas juste un message texte)
  contenant le détail des champs en erreur (`result.error.flatten()` ou équivalent).
- TOUS les endpoints server d'une même ressource vivent dans LE MÊME dossier
  server/api/{ressource}s/ — jamais un fichier isolé à la racine de server/api/.
- Le type partagé (types/{ressource}.ts) doit être généré EN PREMIER, avec ses champs
  explicitement listés, et référencé explicitement par les autres fichiers — c'est le
  contrat qui évite l'incohérence entre composable, formulaire, pages et endpoints.
- Si le composable expose une opération, il DOIT exister une page/action qui l'utilise
  — pas d'opération orpheline.
- La suppression peut être une action inline (bouton + confirmation) plutôt qu'une page
  dédiée — mais elle doit être PRÉSENTE quelque part dans le plan.
- Prévoir la gestion d'erreur et le feedback utilisateur (message de succès/échec) dans
  la description de chaque page qui fait un appel réseau.