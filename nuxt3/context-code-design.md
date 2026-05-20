## Architecture CRUD standard

Chaque domaine métier suit exactement la même architecture CRUD.
Exemple : articles, projects, services, testimonials, users.

Un CRUD doit toujours respecter la séparation stricte des responsabilités.

---

## Structure CRUD attendue

```text
/pages/articles
  index.vue            → liste
  create.vue           → création
  [id].vue             → détail / édition

/components/articles
  Form.vue
  Card.vue
  Table.vue
  DeleteDialog.vue

/composables
  useArticles.ts
  useArticleForm.ts

/server/api/articles
  index.get.ts
  index.post.ts
  [id].get.ts
  [id].put.ts
  [id].delete.ts

/types
  Article.ts
```

## Responsabilité des fichiers CRUD

### pages/articles/index.vue

Responsabilités :

affichage liste
pagination
filtres UI
orchestration SSR

Interdits :

logique métier
appels API inline
validation complexe

Doit utiliser :

useAsyncData
composables
composants UI

### pages/articles/create.vue

Responsabilités :

initialiser le formulaire
appeler le composable métier
gérer la navigation après succès

Interdits :

logique API inline
validation métier complexe

### pages/articles/[id].vue

Responsabilités :

chargement d’un élément
édition
suppression
orchestration

Interdits :

logique métier complexe
logique réseau inline

### components/articles/*

Responsabilités :

affichage UI uniquement
réception props
émission events

Interdits :

appels API
accès stores
logique métier

Les composants doivent être :

petits
réutilisables
strictement typés

### composables/useArticles.ts

Responsabilités :

tous les appels API CRUD
logique métier
adaptation des données backend

Doit contenir :

list()
get(id)
create(payload)
update(id, payload)
remove(id)

Interdits :

logique UI
accès DOM
composants

Exemple :

```ts
export const useArticles = () => {
  const list = () => useApi('/articles')

  const create = (payload: CreateArticlePayload) =>
    useApi('/articles', {
      method: 'POST',
      body: payload,
    })

  return {
    list,
    create,
  }
}
```

### composables/useArticleForm.ts

Responsabilités :

validation formulaire
règles métiers UI
helpers du formulaire

Interdits :

appels API directs

### server/api/articles/*

Responsabilités :

proxy strict vers Rails
validation entrées
gestion cookies/auth

Interdits :

logique métier
transformation métier complexe

Chaque méthode HTTP possède son propre fichier :


```bash
index.get.ts
index.post.ts
[id].get.ts
[id].put.ts
[id].delete.ts
```

## Design patterns obligatoires

### Pattern — API Proxy Nitro

Tous les appels browser passent obligatoirement par Nitro.

Interdit :

appel direct Rails depuis le client
exposition du JWT

Flux obligatoire :

Browser → Nitro → Rails API

Nitro :

lit le cookie httpOnly
injecte Authorization Bearer
transmet la requête

### Pattern — useApi

Tous les appels réseau passent par useApi.

Interdit :

$fetch direct dans pages/components
fetch natif
axios inline

Exemple :

```ts
const { data } = await useApi('/articles')
```

### Pattern — Smart / Dumb split

Séparation stricte :

Pages = smart orchestration
Components = dumb présentation

Pages :

chargent les données
utilisent les composables

Components :

affichent uniquement

### Pattern — Domain composable

Un domaine métier = un composable principal.

Exemples :

```ts
useArticles
useProjects
useAuth
useTestimonials
```

Le composable centralise :

appels API
logique métier
transformation données

### Pattern — Form composable

Les formulaires complexes utilisent un composable dédié.

Exemple :

```ts
useArticleForm
useProjectForm
```

Responsabilités :

validation
valeurs par défaut
transformation UI

### Pattern — SSR first

Les données critiques doivent être chargées via SSR.

Utiliser :

useAsyncData
await dans setup

Éviter :

onMounted pour données critiques SEO

### Pattern — Type centralization

Tous les types globaux vivent dans /types.

Interdit :

interfaces inline énormes
duplication des types

Exemple :

```bash
/types/Article.ts
/types/User.ts
```

### Pattern — Pure utils

Les utils doivent être entièrement pures.

Interdit :

accès réseau
accès store
mutation globale

Correct :
```ts
formatDate(date)
slugify(title)
truncate(text)
```

Incorrect :
```ts
getCurrentUser()
fetchArticles()
```

### Pattern — Authentication boundary

Le frontend ne connaît jamais le JWT.

Le frontend :

connaît uniquement le user
appelle Nitro

Nitro :

possède le cookie
parle à Rails
Validation obligatoire avant génération

Avant de créer un fichier :

vérifier si un composable existe déjà
vérifier si un type existe déjà
éviter duplication logique
respecter le domaine métier existant
respecter la structure layer-based
Règles qualité
Maximum 200 lignes par composant
Maximum 20 lignes par fonction
Une responsabilité claire par fichier
Pas de duplication
Pas de logique implicite
Code lisible avant d’être “smart”
Favoriser composition plutôt qu’héritage
Philosophie architecture

Le projet privilégie :

simplicité
séparation stricte des responsabilités
lisibilité long terme
maintenabilité
sécurité
SSR-first
frontend découplé du backend