---
type: Dependency
title: LexikJWTAuthenticationBundle (Symfony)
ecosystem: php
check_file: composer.json
check_pattern: "\"lexik/jwt-authentication-bundle\""
install_command: composer require lexik/jwt-authentication-bundle
postinstall_commands:
  - php bin/console lexik:jwt:generate-keypair
min_version: "3.0"
requires:
  - /patterns/auth/dependencies/symfony-security-bundle.md
tags: [symfony, auth, jwt, composer]
---

# LexikJWTAuthenticationBundle

Émission et validation de JWT pour Symfony, branché sur le Security
Bundle natif. Standard de fait pour une API Symfony stateless.

# Dépendance préalable

Nécessite le Security Bundle — voir
[Symfony Security Bundle](/patterns/auth/dependencies/symfony-security-bundle.md).

# Vérification d'installation

Vérifier dans `composer.json` la présence de
`"lexik/jwt-authentication-bundle"`. Vérifier aussi l'existence de
`config/jwt/private.pem` et `public.pem` — le bundle peut être présent
sans clés générées (premier déploiement, ou clés perdues après un reset
d'environnement).

`postinstall_commands` ne génère les clés que si elles n'existent pas déjà
— `lexik:jwt:generate-keypair` refuse d'écraser des clés existantes par
défaut, donc cette commande est sûre à rejouer.

# Configuration manuelle requise après installation

Variables d'environnement dans `.env.local` (jamais committées) :

```
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=<générée aléatoirement par environnement>
```

# Pièges

- Compatible avec `symfony/security-bundle` en `^6.4|^7.0|^8.0` — vérifier
  que la version installée du bundle correspond à la version Symfony du
  projet avant de forcer une version spécifique dans `composer.json`.
- Ne jamais committer `config/jwt/*.pem` ni `.env.local` — ajouter
  `config/jwt/*.pem` au `.gitignore` du projet dès l'installation.