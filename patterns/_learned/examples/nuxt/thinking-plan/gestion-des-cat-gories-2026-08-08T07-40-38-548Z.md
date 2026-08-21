# Exemple appris — thinking-plan (nuxt)

> Fichier d'origine : `thinking-plan`
> Corrigé par Claude suite à une revue automatique.
> Contexte : Gestion des catégories — Je veux gérer les catégories en CRUD dont les attributs sont name string 255 et description text ainsi que la validation, name ne peut pas faire moins de 4 caractères et description moins de 40 et pas plus de 800

## Ce qui a été corrigé

Plan approuvé par Claude (score 88/100) — Plan cohérent et proportionné pour un composable réactif simple : types zod bien définis, composable couvrant les opérations, formulaire présent. Les opérations du composable sans page consommatrice sont acceptables si le contexte d'usage est externe à ce plan.

```
TITRE: Gestion des catégories

## Objectif

Permettre la création, lecture, mise à jour et suppression de catégories avec des attributs name et description, ainsi que la validation des données entrantes.

_Choix d'architecture : Objet éphémère à 4 champs ou moins, un composable réactif simple suffit, pas de CRUD ni de Builder justifié._

## Fichiers à générer

### Types

- shared/types/category.ts (Category : id: number, name: string (min 1), description: string (min 40, max 800) — exporte aussi createCategorySchema pour la création, sans id/createdAt)

### Composables

- app/composables/useCategories.ts (useCategories.ts (list(): Category[], get(id): Category, create(input: CreateCategoryInput): Category, update(id, input): Category, remove(id): void))

### Components

- app/components/categories/form.vue (form.vue pour saisir les champs de la catégorie : name et description)

## Entités principales

Category

## Dépendances déclarées

- npm : zod, nuxt-auth-utils, @nuxt/test-utils, vitest, @vue/test-utils, happy-dom, playwright-core, @vitest/coverage-v8
```