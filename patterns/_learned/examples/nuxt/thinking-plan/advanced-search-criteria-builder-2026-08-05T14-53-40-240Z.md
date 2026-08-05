# Exemple appris — thinking-plan (nuxt)

> Fichier d'origine : `thinking-plan`
> Corrigé par Claude suite à une revue automatique.
> Contexte : Advanced Search Criteria Builder — Je veux pouvoir composer une requête de recherche avancée avec plusieurs critères ajoutés un par un (mots-clés, catégorie, plage de dates, tri), avant de lancer la recherche.

## Ce qui a été corrigé

Plan approuvé par Claude (score 82/100) — Plan cohérent et proportionné (2 fichiers, pas de CRUD, pas de sur-ingénierie) ; les 3 points mineurs concernent le nommage du fichier et l'absence de champs/signatures concrets qui doivent être précisés avant génération.

```
TITRE: Advanced Search Criteria Builder

## Objectif

Permettre à l'utilisateur d'ajouter progressivement des critères de recherche (mots-clés, catégories, dates, tri) avant de lancer la requête complète

_Choix d'architecture : Objet éphémère à 4 champs ou moins, un composable réactif simple suffit, pas de CRUD ni de Builder justifié._

## Fichiers à générer

### Composables

- app/composables/useAdvancedSearchCriteria.ts (Gère la construction et l'exécution des critères de recherche avec un composable réactif)

### Types

- shared/types/advancedsearchcriteria.ts (Définit le type AdvancedSearchCriteriaSchema pour les données du formulaire)

## Entités principales

AdvancedSearchCriteria

## Dépendances déclarées

- npm : zod, nuxt-auth-utils, @nuxt/test-utils, vitest, @vue/test-utils, happy-dom, playwright-core, @vitest/coverage-v8
```