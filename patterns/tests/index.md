---
type: PatternIndex
title: Pattern tests — index
tags: [rspec]
---

# Principe

Pattern appliqué automatiquement quand le fichier généré est un fichier de test
(`spec/**/*_spec.rb`, `*.spec.ts`, `*.test.ts`) : le résolveur le place EN PREMIER
et retire `crud` (dont les recipes décrivent du code applicatif — contrôleur,
modèle — et poussaient à écrire des specs « tout mocké »).

Une spec vérifie le COMPORTEMENT observable du code réel : base de test réelle,
HTTP simulé à la frontière, doubles uniquement pour les collaborateurs injectés.
Elle ne re-décrit pas l'implémentation appel par appel.

- **Backend** : [rails-rspec](/patterns/tests/recipes/backend/rails-rspec.md)
