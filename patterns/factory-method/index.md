---
type: PatternIndex
title: Pattern Factory Method (Fabrique GoF) — index
tags: [factory-method, design-pattern, gof]
---

# Principe

La Factory Method définit une **interface pour créer un objet** dans une
classe mère (le Créateur), mais **délègue le choix du type concret** aux
sous-classes. Contrairement à une factory naïve (un switch central), chaque
sous-classe Créateur redéfinit la méthode fabrique et embarque sa propre
logique métier autour du produit qu'elle crée.

```
Créateur (abstrait)
  └── méthodeFactory() → Produit (abstrait)
  └── logiqueMétier() utilise le produit sans savoir lequel

CréateurConcretA étend Créateur
  └── méthodeFactory() → ProduitA

CréateurConcretB étend Créateur
  └── méthodeFactory() → ProduitB
```

# Ce qui distingue Factory Method d'une factory naïve

Une factory naïve (un switch central qui instancie le bon objet) centralise
la création mais force à modifier ce switch à chaque nouvel type. Factory
Method résout ce problème en déplaçant la décision dans une sous-classe :
ajouter un nouveau type = créer une nouvelle sous-classe, sans toucher à
aucun code existant (principe Ouvert/Fermé).

# Exemple concret utilisé dans les recipes

**Service de paiement** : `PaymentProcessor` (Créateur abstrait) avec
sous-classes `StripeProcessor`, `PaypalProcessor`, `VirementProcessor` —
chacune crée son propre `PaymentGateway` (Produit) et gère sa propre
logique de validation/traitement.

# Cas d'usage couverts

| Cas | Recipe |
|---|---|
| Backend Rails | [rails-factory-method.md](/patterns/factory-method/recipes/backend/rails-factory-method.md) |
| Backend Laravel | [laravel-factory-method.md](/patterns/factory-method/recipes/backend/laravel-factory-method.md) |
| Backend Symfony | [symfony-factory-method.md](/patterns/factory-method/recipes/backend/symfony-factory-method.md) |
| Frontend Nuxt | [nuxt-factory-method.md](/patterns/factory-method/recipes/frontend/nuxt-factory-method.md) |

# Variable de substitution

- `{Service}` : le service métier (ex: `Payment`, `Export`, `Notification`)
- `{Creator}` : le créateur abstrait (ex: `PaymentProcessor`)
- `{Product}` : le produit abstrait (ex: `PaymentGateway`)
- `{ConcreteCreator}` : une sous-classe créateur (ex: `StripeProcessor`)
- `{ConcreteProduct}` : un produit concret (ex: `StripeGateway`)

# Frameworks et versions disponibles

| Framework | Base | Versions |
|---|---|---|
| Nuxt | [nuxt.md](/frameworks/nuxt.md) | [v3](/frameworks/nuxt/v3.md), [v4](/frameworks/nuxt/v4.md) |
| Rails | [rails.md](/frameworks/rails.md) | [v8](/frameworks/rails/v8.md) |
| Laravel | [laravel.md](/frameworks/laravel.md) | [v13](/frameworks/laravel/v13.md) |
| Symfony | [symfony.md](/frameworks/symfony.md) | [v7 LTS](/frameworks/symfony/v7.md) |

# Quand NE PAS utiliser

- Si tu n'as que 2-3 variantes stables sans extension prévue et aucune
  logique métier commune → un switch inline dans le code appelant suffit.
- Si les Créateurs n'ont pas de logique métier propre autour de la création
  → la hiérarchie de classes est inutilement complexe.
- Si les produits n'ont pas d'interface commune → revoir la conception.