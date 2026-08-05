# Exemple appris — thinking-plan (nuxt)

> Fichier d'origine : `thinking-plan`
> Corrigé par Claude suite à une revue automatique.
> Contexte : Compteur de vues par page — Ajoute un compteur de vues sur chaque page qui s'incrémente à chaque visite.

## Ce qui a été corrigé

Plan approuvé par Claude (score 88/100) — Plan minimal et cohérent pour un compteur éphémère : 2 fichiers suffisent, pas de sur-ingénierie. Les seuls points ouverts (persistence, validation) sont acceptables au regard de la portée déclarée.

```
TITRE: Compteur de vues par page

## Objectif

Suivre le nombre de visites par page et incrémenter ce compteur à chaque accès à la page

_Choix d'architecture : Objet éphémère à 4 champs ou moins, un composable réactif simple suffit, pas de CRUD ni de Builder justifié._

## Fichiers à générer

### Composables

- app/composables/useCounter.ts (Gère le compteur de vues par page. Utilise une fonction de mise à jour automatique basée sur le montage de la page.)

### Server

- server/api/counter.increment.post.ts (Endpoint POST pour incrémenter le compteur. Lit/modifie la valeur du compteur côté serveur et la retourne.)

## Entités principales

Counter

## Dépendances déclarées

- npm : zod, nuxt-auth-utils, @nuxt/test-utils, vitest, @vue/test-utils, happy-dom, playwright-core, @vitest/coverage-v8
```