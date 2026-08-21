---
type: Recipe
title: CRUD serveur Nuxt (Nitro)
tags: [nuxt, server, crud, nitro]
---

# Quand utiliser ce pattern

Toute ressource métier exposant un CRUD complet côté serveur Nuxt (Nitro), que ce serveur
soit la source de vérité (Nuxt fullstack) ou un simple proxy vers un backend séparé — voir
la section "Stack scindée" plus bas, le cas s'applique différemment.

# Dépendances

Voir [conventions Nuxt 4](../../frameworks/nuxt/v4.md) pour la règle de routing
fichier → URL (déjà appliquée automatiquement, ne pas la recalculer manuellement).

# Structure attendue

Pour une ressource `{resource}` :

- `server/api/{resource}/index.get.ts` — liste
- `server/api/{resource}/[id].get.ts` — détail
- `server/api/{resource}/index.post.ts` — création
- `server/api/{resource}/[id].patch.ts` — édition
- `server/api/{resource}/[id].delete.ts` — suppression

Chaque fichier exporte `export default defineEventHandler(async (event) => { ... })`.

# Validation du body

Tout endpoint qui écrit des données (POST/PATCH/PUT) valide son body avec un schéma
(zod ou équivalent déclaré dans le projet) **avant** tout traitement :

```ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = createArticleSchema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Données invalides' });
  }
  // ... traitement avec parsed.data, jamais body brut
});
```

# Stack scindée (backend séparé — Rails/Laravel/Symfony)

Si `.blackstaff/index.md` déclare un `stack.backend` différent du frontend, CE fichier
Nitro n'est **jamais** la source de vérité des données — il proxie vers le backend
déclaré. Le contrat exact (chemin backend, format de réponse) vient de la fiche
`reference-sheets/auth-backends/*.json` ou `reference-sheets/backends/*.json` résolue
pour ce projet, jamais halluciné. Voir
[bff-proxy-pattern](../../integrations/nuxt-auth-utils/bff-proxy-pattern.md) pour le cas
spécifique de l'authentification, qui suit le même principe.

# Pièges à éviter

- Ne jamais implémenter d'accès base de données direct dans `server/api/*` si une stack
  backend séparée est déclarée — voir section ci-dessus.
- Ne jamais laisser un `throw createError(...)` sans `statusCode` explicite.
- Un endpoint DELETE renvoie un statut cohérent (204 ou 200 avec confirmation), jamais un
  corps de réponse vide avec 200 sans indication de succès pour le front.
