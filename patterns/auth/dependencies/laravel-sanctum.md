---
type: Dependency
title: Laravel Sanctum
ecosystem: php
check_file: composer.json
check_pattern: "\"laravel/sanctum\""
install_command: php artisan install:api
postinstall_commands: []
min_version: "4.0"
tags: [laravel, auth, composer]
---

# Laravel Sanctum

Package officiel Laravel pour l'authentification SPA (cookie de session)
et/ou API token. Préinstallé dans la plupart des squelettes Laravel
récents mais pas toujours configuré.

# Vérification d'installation

Vérifier dans `composer.json` la présence de `"laravel/sanctum"`. Sanctum
est souvent déjà présent comme dépendance du framework de base sans être
"installé" au sens fonctionnel (config publiée, migration jouée) — donc
vérifier aussi l'existence de `config/sanctum.php` avant de considérer
que c'est prêt à l'emploi.

La commande `install:api` est idempotente : si Sanctum est déjà configuré,
elle ne casse rien, mais elle peut redemander de rejouer une migration —
vérifier l'état des migrations avant de l'exécuter à l'aveugle sur un
projet existant.

# Pièges

- `install:api` crée `routes/api.php` s'il n'existe pas — sur un projet
  où ce fichier existe déjà avec du contenu, vérifier qu'il n'est pas
  écrasé (il ne devrait pas l'être, mais à vérifier après exécution).
- Cette commande active aussi `EnsureFrontendRequestsAreStateful` côté
  config si le mode SPA est souhaité — vérifier `config/sanctum.php`
  après coup plutôt que de supposer que tout est en place.