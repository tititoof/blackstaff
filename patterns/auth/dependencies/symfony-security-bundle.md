---
type: Dependency
title: Symfony Security Bundle
ecosystem: php
check_file: composer.json
check_pattern: "\"symfony/security-bundle\""
install_command: composer require symfony/security-bundle
postinstall_commands: []
min_version: "7.0"
tags: [symfony, auth, composer]
---

# Symfony Security Bundle

Bundle natif Symfony — gère les firewalls, providers, voters,
password hashers. Quasi systématiquement présent dès qu'un projet Symfony
a une notion d'utilisateur, mais à vérifier explicitement.

# Vérification d'installation

Vérifier dans `composer.json` la présence de `"symfony/security-bundle"`.
Vérifier aussi que `config/packages/security.yaml` existe et contient au
moins un firewall — le bundle peut être présent sans configuration réelle
sur un projet généré minimal.

# Pièges

- Symfony Flex génère automatiquement `security.yaml` à l'installation du
  bundle avec une config par défaut très permissive (`security: false` sur
  le firewall `main` dans certains squelettes) — ne jamais supposer qu'une
  config par défaut est sécurisée, toujours la revoir avant d'ajouter du
  JWT par-dessus.