---
type: Recipe
title: Formulaire Vuetify
tags: [vuetify, frontend, forms]
---

# Formulaire Vuetify

Utilisé par [/patterns/crud-frontend/page-create.md](/patterns/crud-frontend/page-create.md)
et [/patterns/crud-frontend/page-edit.md](/patterns/crud-frontend/page-edit.md).

Structure attendue : `<v-form>` avec `v-model` de validité, un champ par
entrée de `contract.fields`, bouton de soumission désactivé tant que le
formulaire n'est pas valide (`:disabled="!valid"`).

Les props exactes des composants Vuetify (`v-text-field`, `v-select`,
règles de validation) doivent être vérifiées via le MCP Vuetify au moment
de la génération — ce document fixe la structure, pas les props.

# Pièges à éviter

- Ne pas dupliquer la logique de validation entre le formulaire et le
  composable — le formulaire valide le format, le composable/l'API
  valident la règle métier.
