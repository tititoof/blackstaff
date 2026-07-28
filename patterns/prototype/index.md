---
type: PatternIndex
title: Pattern Prototype (Clone GoF) — index
tags: [prototype, clone, design-pattern, gof]
---

# Principe

Le Prototype délègue le clonage à l'objet lui-même via une méthode `clone()`
— plutôt que de copier l'objet "depuis l'extérieur". Le code client n'a pas
besoin de connaître la classe concrète de l'objet qu'il clone.

```
Client → prototype.clone() → CopyOfPrototype
```

Trois règles fondamentales :

1. **L'objet se clone lui-même** — il connaît ses propres attributs privés.
2. **Le clone est indépendant** — modifier le clone ne modifie pas l'original
   (copie profonde des attributs mutables).
3. **L'interface est commune** — le client ne voit qu'une méthode `clone()`,
   pas la classe concrète.

# Deux cas d'usage couverts

| Cas | Description | Exemples |
|---|---|---|
| **Entité métier** | Dupliquer une entité complexe (commande, produit, config) avec ses relations | Dupliquer une commande, cloner un template de produit |
| **Objet UI** | Cloner un composant paramétré pour en produire des variantes | Dupliquer un widget de dashboard, cloner une config de formulaire |

# Recipes disponibles

| Framework | Générique | Exemples |
|---|---|---|
| Nuxt | [nuxt-prototype.md](/patterns/prototype/recipes/frontend/nuxt-prototype.md) | [entité](/patterns/prototype/recipes/frontend/examples/entity-clone.md), [composant UI](/patterns/prototype/recipes/frontend/examples/component-clone.md) |
| Rails | [rails-prototype.md](/patterns/prototype/recipes/backend/rails-prototype.md) | [entité](/patterns/prototype/recipes/backend/examples/entity-clone.md), [config](/patterns/prototype/recipes/backend/examples/config-clone.md) |
| Laravel | [laravel-prototype.md](/patterns/prototype/recipes/backend/laravel-prototype.md) | idem |
| Symfony | [symfony-prototype.md](/patterns/prototype/recipes/backend/symfony-prototype.md) | idem |

# Variables de substitution

| Placeholder | Exemple concret |
|---|---|
| `{Prototype}` | `Order`, `Product`, `FormConfig`, `Widget` |
| Méthode de clonage | `clone()` (Ruby/PHP), `clone()` (TypeScript) |
| Attributs simples | Copiés par valeur directement |
| Attributs mutables / objets imbriqués | Clonés en profondeur (deep copy) |

# Frameworks et versions disponibles

| Framework | Base | Versions |
|---|---|---|
| Nuxt | [nuxt.md](/frameworks/nuxt.md) | [v3](/frameworks/nuxt/v3.md), [v4](/frameworks/nuxt/v4.md) |
| Rails | [rails.md](/frameworks/rails.md) | [v8](/frameworks/rails/v8.md) |
| Laravel | [laravel.md](/frameworks/laravel.md) | [v13](/frameworks/laravel/v13.md) |
| Symfony | [symfony.md](/frameworks/symfony.md) | [v7 LTS](/frameworks/symfony/v7.md) |

# Copie superficielle vs copie profonde

Le piège le plus fréquent du pattern Prototype :

| | Copie superficielle (shallow) | Copie profonde (deep) |
|---|---|---|
| Attributs primitifs | ✅ Copiés indépendamment | ✅ Copiés indépendamment |
| Objets / tableaux imbriqués | ❌ Référence partagée avec l'original | ✅ Nouvelles instances indépendantes |
| Quand l'utiliser | Jamais pour des entités métier | Toujours pour le Prototype GoF |

Modifier un tableau imbriqué dans le clone ne doit jamais modifier l'original.

# Quand NE PAS utiliser

- Si l'objet est simple (peu d'attributs, pas d'imbrication) → un
  constructeur classique ou une factory suffisent.
- Si les attributs contiennent des ressources externes non clonables
  (connexion DB, fichier ouvert, socket) → le clonage est risqué sans
  gestion explicite de ces ressources.
- Si l'objet a des références circulaires complexes → le clonage profond
  devient très difficile à gérer correctement.

# Différence clé avec les autres patterns de création

| Pattern | Décision |
|---|---|
| Factory Method | Quel **type** d'objet créer |
| Builder | **Comment** construire un objet complexe étape par étape |
| Prototype | **Copier** un objet existant sans connaître sa classe |