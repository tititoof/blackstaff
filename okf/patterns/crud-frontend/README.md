---
type: Recipe
title: CRUD frontend Nuxt
tags: [nuxt, frontend, crud]
---

# Quand utiliser ce pattern

Toute ressource métier exposant un CRUD complet (liste, détail, création, édition,
suppression) consommé depuis une page/composant Nuxt, indépendamment du backend réel.

# Dépendances

Voir [conventions Nuxt 4](../../frameworks/nuxt/v4.md) (ou
[v3](../../frameworks/nuxt/v3.md) selon la version déclarée du projet) pour la structure
de dossiers et la règle de routing.

# Structure attendue

Pour une ressource `{resource}` (ex: `articles`) :

- `app/pages/{resource}/index.vue` — liste
- `app/pages/{resource}/[id].vue` — détail
- `app/pages/{resource}/create.vue` — création
- `app/pages/{resource}/[id]/edit.vue` — édition
- Un composable `app/composables/use{Resource}.ts` optionnel si la logique de fetch est
  réutilisée sur plusieurs pages (liste + recherche par exemple) — sinon `useFetch`
  directement dans la page suffit, ne pas sur-architecturer une ressource simple.

# Appel API

**Ne jamais construire l'URL manuellement depuis le nom de la ressource.** La table de
routage API est calculée par le pipeline de génération et injectée dans le contexte —
utiliser EXACTEMENT l'URL qui y figure pour cette ressource, jamais une reconstruction
du type `/api/${resource}`.

```ts
// Toujours useFetch pour un GET consommé au chargement de la page (SSR-friendly)
const { data: articles } = await useFetch('/api/articles');

// $fetch pour une action déclenchée par l'utilisateur (submit, click), pas au chargement
async function onSubmit() {
  await $fetch('/api/articles', { method: 'POST', body: form.value });
}
```

# États à gérer systématiquement

- **Chargement** — `pending`/`status` de `useFetch`, jamais un état de chargement géré
  manuellement en parallèle
- **Erreur** — `error` de `useFetch`/`$fetch` catché, jamais silencieusement ignoré
- **Liste vide** — un état vide explicite, pas un tableau vide affiché sans message (voir
  pattern empty-state si le bundle design en contient un)

# Pièges à éviter

- Le chemin du fichier serveur n'est jamais l'URL appelée côté client — voir
  [conventions Nuxt 4#routing](../../frameworks/nuxt/v4.md#routing-serveur-server-api).
- Ne pas dupliquer la logique de fetch dans chaque page si plusieurs pages consomment la
  même ressource — extraire un composable dès la 2ème page qui en a besoin, pas avant
  (éviter l'abstraction prématurée sur une ressource utilisée une seule fois).
- Un formulaire de création/édition ne doit jamais soumettre sans validation côté client
  ET côté serveur — voir [pattern forms](../forms/README.md) si présent dans le bundle.
