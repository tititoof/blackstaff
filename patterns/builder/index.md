---
type: PatternIndex
title: Pattern Monteur (Builder GoF) — index
tags: [builder, design-pattern, gof, assembler, étape par étape, options facultatives, construire progressivement, chaînage, configuration complexe]
---

# Principe

Le Monteur construit des objets complexes **étape par étape**, en séparant
le code de construction de la représentation finale. Le même processus de
construction peut produire des objets très différents.

```
Client
  └── Director.construct(builder)     ← ordonne les étapes
        └── builder.stepA()
        └── builder.stepB()
        └── builder.stepC()
              └── builder.getResult() ← récupère le produit fini
```

Trois rôles distincts :

- **Builder (Monteur)** : interface déclarant les étapes de construction.
- **ConcreteBuilder** : implémente les étapes, construit et expose `getResult()`.
- **Director** : connaît l'ordre des étapes pour produire une configuration
  précise — optionnel mais recommandé pour encapsuler les recettes réutilisables.

# Deux cas d'usage couverts

| Cas | Description | Exemples |
|---|---|---|
| **Objet complexe configurable** | Objet avec de nombreux champs/options, construit selon différentes recettes | Rapport, requête, email, commande |
| **Arborescence / composite** | Objet dont la structure interne est construite récursivement ou en plusieurs phases | Formulaire multi-étapes, menu, arbre de widgets |

# Recipes disponibles

| Framework | Générique | Exemples |
|---|---|---|
| Nuxt | [nuxt-builder.md](/patterns/builder/recipes/frontend/nuxt-builder.md) | [formulaire](/patterns/builder/recipes/frontend/examples/form-builder.md), [requête](/patterns/builder/recipes/frontend/examples/query-builder.md) |
| Rails | [rails-builder.md](/patterns/builder/recipes/backend/rails-builder.md) | [rapport](/patterns/builder/recipes/backend/examples/report-builder.md), [requête](/patterns/builder/recipes/backend/examples/query-builder.md) |
| Laravel | [laravel-builder.md](/patterns/builder/recipes/backend/laravel-builder.md) | idem |
| Symfony | [symfony-builder.md](/patterns/builder/recipes/backend/symfony-builder.md) | idem |

# Variables de substitution

| Placeholder | Exemple concret |
|---|---|
| `{Product}` | `Report`, `Query`, `Email`, `Form` |
| `{Builder}` | `ReportBuilder`, `QueryBuilder` |
| `{ConcreteBuilderA}` | `PdfReportBuilder`, `SqlQueryBuilder` |
| `{ConcreteBuilderB}` | `CsvReportBuilder`, `ElasticQueryBuilder` |
| `{Director}` | `ReportDirector`, `QueryDirector` |

# Frameworks et versions disponibles

| Framework | Base | Versions |
|---|---|---|
| Nuxt | [nuxt.md](/frameworks/nuxt.md) | [v3](/frameworks/nuxt/v3.md), [v4](/frameworks/nuxt/v4.md) |
| Rails | [rails.md](/frameworks/rails.md) | [v8](/frameworks/rails/v8.md) |
| Laravel | [laravel.md](/frameworks/laravel.md) | [v13](/frameworks/laravel/v13.md) |
| Symfony | [symfony.md](/frameworks/symfony.md) | [v7 LTS](/frameworks/symfony/v7.md) |

# Exemples d'instructions qui déclenchent ce pattern

Ces formulations, sans jamais nommer "builder" explicitement, doivent être détectées automatiquement grâce aux tags ci-dessus :

- "J'ai besoin d'assembler la configuration d'un rapport étape par étape, avec plusieurs options facultatives (filtres, colonnes, format)."
- "Je veux pouvoir construire une requête de recherche progressivement, en ajoutant des critères un par un avant de la valider."
- "Un formulaire multi-étapes où chaque étape enrichit un objet final, avec validation seulement à la fin."

Si une instruction de ce type ne déclenche PAS le pattern, vérifier :

1. Que les mots-clés utilisés correspondent effectivement aux tags déclarés ci-dessus (le matching est une simple recherche de sous-chaîne, sensible à la formulation).
2. Que le fichier existe bien sous patterns/builder/index.md (chemin exact).

# Quand NE PAS utiliser

- Si l'objet a peu de paramètres (< 4-5) → un constructeur classique suffit.
- Si toutes les configurations sont connues à l'avance et peu nombreuses
  → Factory Method est plus simple.
- Si l'objet n'a pas de variantes → pas besoin d'interface Builder,
  un seul Builder sans hiérarchie suffit.

# Différence clé avec Factory Method

Factory Method décide **quel type** d'objet créer.
Builder décide **comment** construire un objet complexe étape par étape.
Les deux peuvent se combiner : un Director peut utiliser plusieurs Builders
via une Factory Method pour choisir le bon Builder selon le contexte.