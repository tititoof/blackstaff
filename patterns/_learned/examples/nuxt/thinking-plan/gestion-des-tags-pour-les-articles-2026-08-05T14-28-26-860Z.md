# Exemple appris — thinking-plan (nuxt)

> Fichier d'origine : `thinking-plan`
> Corrigé par Claude suite à une revue automatique.
> Contexte : Gestion des tags pour les articles — Je veux pouvoir gérer une liste de tags pour les articles : les créer, les voir, les modifier, les supprimer.

## Ce qui a été corrigé

Plan approuvé par Claude (score 82/100) — Plan cohérent et proportionné pour un objet éphémère à 3 champs : 2 fichiers suffisent, pas de sur-ingénierie. Deux points mineurs (absence de zod runtime, pas d'update) sans impact bloquant sur la génération.

```
TITRE: Gestion des tags pour les articles

## Objectif

Permettre à l'utilisateur de créer, voir, modifier ou supprimer des tags associés aux articles

_Choix d'architecture : Objet éphémère à 4 champs ou moins, un composable réactif simple suffit, pas de CRUD ni de Builder justifié._

## Fichiers à générer

### Types

- shared/types/tag.ts (Tag : id: number, name: string (min 1), articleIds: number[] (optionnel))

### Composables

- app/composables/useTags.ts (useTags : list(): Tag[], get(id): Tag, create(input: CreateTagInput): Tag, remove(id): void)

## Entités principales

Tag

## Dépendances déclarées

- npm : zod, nuxt-auth-utils, @nuxt/test-utils, vitest, @vue/test-utils, happy-dom, playwright-core, @vitest/coverage-v8
```