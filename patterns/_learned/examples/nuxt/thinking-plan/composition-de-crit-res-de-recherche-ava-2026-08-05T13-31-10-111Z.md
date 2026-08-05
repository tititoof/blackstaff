# Exemple appris — thinking-plan (nuxt)

> Fichier d'origine : `thinking-plan`
> Corrigé par Claude suite à une revue automatique.
> Contexte : Composition de critères de recherche avancée — Je veux pouvoir composer une requête de recherche avancée avec plusieurs critères ajoutés un par un (mots-clés, catégorie, plage de dates, tri), avant de lancer la recherche.

## Ce qui a été corrigé

Plan approuvé par Claude (score 88/100) — Plan cohérent et proportionné pour un objet éphémère à 4 champs : 3 fichiers suffisent, zod est disponible pour la validation, pas de sur-ingénierie. Quelques imprécisions de contrat (retour de submit, défaut de orderBy, interface emit du composant) à clarifier pour éviter des choix silencieux lors de la génération.

```
TITRE: Composition de critères de recherche avancée

## Objectif

Permettre à l'utilisateur d'ajouter progressivement des critères (mots-clés, catégorie, dates, tri) avant d'exécuter la recherche

_Choix d'architecture : Objet éphémère à 4 champs ou moins, un composable réactif simple suffit, pas de CRUD ni de Builder justifié._

## Fichiers à générer

### Types

- shared/types/searchCriteria.ts (SearchCriteria : keyword: string (min 1), category: string?, startDate: string?, endDate: string?, orderBy: 'title' | 'date')

### Composables

- app/composables/useSearchCriteria.ts (useSearchCriteria() (reactive(), setKeyword(v), setCategory(v), setStartDate(v), setEndDate(v), setOrderBy(v), submit()))

### Components

- app/components/search/form.vue (form.vue avec champs de saisie pour keyword, category, startDate, endDate et orderBy)

## Entités principales

SearchCriteria

## Dépendances déclarées

- npm : zod, nuxt-auth-utils, @nuxt/test-utils, vitest, @vue/test-utils, happy-dom, playwright-core, @vitest/coverage-v8
```