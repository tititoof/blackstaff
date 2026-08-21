# Exemple appris — thinking-plan (nuxt)

> Fichier d'origine : `thinking-plan`
> Corrigé par Claude suite à une revue automatique.
> Contexte : Soumission de commentaire par utilisateur — Permettre aux utilisateurs connectés de soumettre un nouveau commentaire sur l'article, avec affichage automatique de la date de création et du nom de l'utilisateur.

## Ce qui a été corrigé

Plan approuvé par Claude (score 82/100) — Plan cohérent et proportionné pour un objet éphémère à 4 champs ; les deux fichiers sont alignés entre eux. Quelques zones grises (état réactif, endpoint cible, source de authorPseudonym) à clarifier en description avant génération.

```
TITRE: Soumission de commentaire par utilisateur

## Objectif

Permettre aux utilisateurs connectés de soumettre des commentaires et afficher automatiquement la date de création ainsi que le pseudonyme.

_Choix d'architecture : Objet éphémère à 4 champs ou moins, un composable réactif simple suffit, pas de CRUD ni de Builder justifié_

## Fichiers à générer

### Types

- shared/types/commentaire.ts (Commentaire : id: number, createdAt: string, authorPseudonym: string, content: string — exporte aussi createCommentSchema pour la création sans id/createdAt)

### Composables

- app/composables/useCommentaires.ts (useCommentaires : submit(input: CreateCommentInput): Promise<Commentaire>)

## Entités principales

Commentaire

## Dépendances déclarées

- npm : zod, nuxt-auth-utils, @nuxt/test-utils, vitest, @vue/test-utils, happy-dom, playwright-core, @vitest/coverage-v8
```