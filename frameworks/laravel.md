---
type: Framework
title: Laravel — conventions générales
tags: [laravel, backend]
---

# Rôle

Conventions de base pour tout projet Laravel, indépendamment du pattern
métier (auth, crud...) et de la version. Les patterns lient ici pour les
idiomes du framework ; pour les chemins exacts, voir
[Laravel 13](/frameworks/laravel/v13.md).

# Identité du framework

Laravel est un framework MVC basé sur des composants Symfony, avec une
forte emphase sur l'expressivité (Eloquent ORM, syntaxe fluide) et un
écosystème de packages très large (Sanctum, Cashier, Horizon...).

# Gestionnaire de paquets

`composer` (`composer require`, jamais d'édition manuelle de
`composer.lock`).

# Conventions de structure (communes à Laravel 11+, post-flattening)

| Concept | Convention |
|---|---|
| Modèles | `app/Models/`, nom singulier en PascalCase (`User.php`) |
| Controllers | `app/Http/Controllers/`, suffixés `Controller` |
| Form Requests | `app/Http/Requests/` pour toute validation au-delà de 2-3 règles simples |
| Routes API | `routes/api.php` |
| Migrations | `database/migrations/`, jamais éditées après avoir été jouées en production |
| Tests | PHPUnit ou Pest selon le choix du projet — ne pas mélanger les deux dans un même projet |

# Eloquent : éviter le N+1

Toujours vérifier les requêtes générées par une relation Eloquent
(`->with('relation')` pour l'eager loading) avant de considérer un
endpoint comme terminé — le N+1 silencieux est l'erreur de performance la
plus fréquente sur les API Laravel.

# Form Requests pour toute validation non triviale

Dès qu'une validation dépasse 2-3 règles simples, l'extraire dans un Form
Request dédié (`php artisan make:request`) plutôt que de valider
directement dans le controller — garde le controller lisible et la
validation testable isolément.

# Langue des noms

Tous les noms de fichiers, classes, méthodes et variables sont TOUJOURS en
anglais — même si l'instruction ou la description de la tâche est en
français. Traduire les termes métier soi-même (ex: "recherche" → "search",
"catégorie" → "category", "utilisateur" → "user"), en respectant les
conventions de casse PHP/Laravel standard : `PascalCase` pour les classes
(`SearchCriteria.php`), `camelCase` pour les méthodes et variables
(`addKeyword()`), `snake_case` pour les colonnes de migration et les clés
de tableau de validation. Aucun caractère accentué dans un nom de fichier,
une classe, une méthode ou une colonne.

# Pièges transverses (toute version, tout pattern)

- Ne jamais désactiver la vérification CSRF globalement pour contourner
  une erreur 419 — comprendre la cause (souvent `SANCTUM_STATEFUL_DOMAINS`
  mal configuré pour un frontend séparé) plutôt que retirer la protection.
- Toujours utiliser des transactions (`DB::transaction()`) pour toute
  opération qui touche plusieurs tables de façon liée.
- Les Jobs en queue doivent être idempotents — un job rejoué après échec
  partiel ne doit pas dupliquer son effet (ex. créer deux fois le même
  enregistrement).