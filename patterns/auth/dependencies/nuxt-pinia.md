---
type: Dependency
title: Pinia (Nuxt)
ecosystem: node
check_file: package.json
check_pattern: "\"pinia\""
install_command: npx nuxi module add pinia
postinstall_commands: []
min_version: "2.1"
tags: [nuxt, auth, npm]
---

# Pinia

Store officiel recommandé pour Vue/Nuxt. Sert ici à centraliser le state
d'authentification (`useAuthStore`).

# Vérification d'installation

Avant d'ajouter, vérifier dans `package.json` (dependencies) la présence
de `"pinia"` et `"@pinia/nuxt"`. Si absent, exécuter `install_command` —
cette commande ajoute le module dans `nuxt.config.ts` automatiquement,
pas seulement la dépendance npm.

# Pièges

- Le module doit apparaître dans `modules: ['@pinia/nuxt']` de
  `nuxt.config.ts` — si la commande `nuxi module add` a échoué
  silencieusement (rare mais possible), vérifier ce fichier manuellement.
- Ne pas utiliser la syntaxe "options API" de Pinia (`defineStore` avec
  objet `state`/`actions` séparés) si le reste du projet est en
  Composition API — préférer la syntaxe fonctionnelle (`defineStore` avec
  une fonction `setup`) pour rester cohérent avec les composables Vue 3.