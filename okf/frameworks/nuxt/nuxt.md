---
type: Reference
title: Conventions Nuxt générales
tags: [nuxt, frontend]
---

# Conventions Nuxt générales

Ce concept est le point d'entrée commun. La version exacte des chemins de
fichiers dépend de la version Nuxt déclarée dans `.blackstaff/index.md`
(`stack.frontend.version`), jamais devinée depuis le code existant :

- [Nuxt 3](/frameworks/nuxt/v3.md)
- [Nuxt 4](/frameworks/nuxt/v4.md)

# Règle générale de routing serveur (valable dans les deux versions)

Le chemin d'un fichier sous `server/api/` n'est jamais l'URL appelée côté
client. Conversion :

1. retirer le préfixe jusqu'à `server/api/` inclus, remplacer par `/api/`
2. retirer le suffixe `.get.ts` / `.post.ts` / `.put.ts` / `.patch.ts` / `.delete.ts`
3. retirer un `/index` final

Exemple : `server/api/articles/index.get.ts` → `GET /api/articles`

Le front n'appelle jamais le chemin de fichier. Toujours :
```ts
const { data } = await useFetch('/api/articles')
```

# Pièges à éviter

- Ne jamais recopier le chemin du fichier serveur dans un `$fetch` ou
  `useFetch` côté client.
- Ne pas mettre de `$fetch` brut dans un composant — toujours passer par un
  composable (voir [/patterns/crud-frontend/composable.md](/patterns/crud-frontend/composable.md)).
