---
type: Recipe
title: Gestion d'erreurs — trois états
tags: [nuxt, frontend, error-handling]
---

# Gestion d'erreurs — trois états

Tout composable de fetch expose `loading`, `error`, et la donnée. Toute
page consommant ce composable doit rendre les trois états explicitement :

```vue
<div v-if="loading">Chargement…</div>
<div v-else-if="error">{{ error }}</div>
<div v-else><!-- donnée --></div>
```

# Pièges à éviter

- Une liste sans état de chargement masque les erreurs réseau à
  l'utilisateur — ne jamais omettre la branche `error`.
- Le format d'erreur affiché doit correspondre à `errorFormat` du contrat
  API, pas à un format générique supposé.
