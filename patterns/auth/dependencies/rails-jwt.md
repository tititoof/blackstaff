---
type: Dependency
title: devise-jwt (Rails)
ecosystem: ruby
check_file: Gemfile
check_pattern: "gem \"devise-jwt\""
install_command: bundle add devise-jwt
postinstall_commands: []
min_version: "0.11"
requires:
  - /patterns/auth/dependencies/rails-devise.md
tags: [rails, auth, gem, jwt]
---

# devise-jwt

Branche Devise sur un échange JWT au lieu de sessions cookie — nécessaire
pour une API consommée par un frontend séparé (Nuxt).

# Dépendance préalable

Nécessite Devise déjà installé — voir
[Devise](/patterns/auth/dependencies/rails-devise.md). Ne pas installer
devise-jwt avant Devise, le générateur échouera.

# Vérification d'installation

Vérifier dans `Gemfile` la présence de `gem "devise-jwt"`. Cette gem n'a
pas de générateur dédié — la configuration se fait manuellement dans
`config/initializers/devise.rb` (ajout du module `:jwt_authenticatable`
sur le modèle User et configuration de la stratégie de révocation).

# Configuration manuelle requise après installation

```ruby
# app/models/user.rb
devise :database_authenticatable, :registerable,
       :jwt_authenticatable, jwt_revocation_strategy: self
```

Et créer la table de blocklist via une migration dédiée (voir la recipe
backend Rails pour le détail complet de cette migration).

# Pièges

- Le module `jwt_revocation_strategy: self` suppose que le modèle User
  inclut aussi `Devise::JWT::RevocationStrategies::JTIMatcher` — sans ça,
  Rails lève une erreur au démarrage plutôt qu'au runtime, donc l'erreur
  est facile à repérer mais bloquante.
- Ne pas oublier `config.jwt.secret = ENV["DEVISE_JWT_SECRET_KEY"]` dans
  l'initializer — sans secret explicite, Devise utilise `secret_key_base`
  par défaut, ce qui fonctionne mais mélange les usages (mieux vaut un
  secret dédié pour pouvoir le faire tourner indépendamment du
  `secret_key_base` de l'app).