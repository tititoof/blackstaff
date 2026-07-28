---
type: Dependency
title: Devise (Rails)
ecosystem: ruby
check_file: Gemfile
check_pattern: "gem \"devise\""
install_command: bundle add devise
postinstall_commands:
  - rails generate devise:install
  - rails generate devise User
  - rails db:migrate
min_version: "4.9"
tags: [rails, auth, gem]
---

# Devise

Gem standard pour l'authentification Rails. Gère l'inscription, la
connexion, la récupération de mot de passe, la confirmation par email,
le verrouillage après échecs répétés.

# Vérification d'installation

Avant d'ajouter, vérifier dans `Gemfile` la présence de `gem "devise"`.
Si absent, exécuter `install_command`, puis chaque commande de
`postinstall_commands` dans l'ordre exact (l'installation génère la
config avant le générateur de modèle, qui lui-même précède la migration).

# Pièges

- `rails generate devise:install` génère un fichier de config qu'il ne
  faut pas régénérer s'il existe déjà — vérifier
  `config/initializers/devise.rb` avant de relancer cette commande, sinon
  elle écrase une config déjà personnalisée.
- Nécessite un `secret_key_base` déjà configuré — présent par défaut
  depuis Rails 5, mais à vérifier sur un projet legacy.
- Si l'app est en mode API-only (`config.api_only = true`), Devise désactive
  certaines vues par défaut — c'est attendu, ces vues ne sont pas utilisées
  puisque le frontend est Nuxt.