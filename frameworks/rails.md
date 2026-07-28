---
type: Framework
title: Rails — conventions générales
tags: [rails, backend]
---

# Rôle

Conventions de base pour tout projet Rails, indépendamment du pattern
métier (auth, crud...) et de la version. Les patterns lient ici pour les
idiomes du framework ; pour les chemins exacts, voir
[Rails 8](/frameworks/rails/v8.md).

# Identité du framework

Rails est un framework MVC, convention-over-configuration : la structure
de dossiers et les noms de fichiers déterminent le comportement, avec un
minimum de configuration explicite.

# Mode API-only vs full-stack

Pour un projet consommé par un frontend séparé (Nuxt), toujours générer
en mode API-only :

```bash
rails new mon_projet --api --database=postgresql
```

Ce mode désactive les vues, les helpers de cookies/sessions par défaut, et
certains middlewares non pertinents pour une API pure — moins de surface
à auditer, démarrage plus rapide.

# Gestionnaire de paquets

`bundler` (`bundle add`, `bundle install`) — jamais d'édition manuelle du
`Gemfile.lock`.

# Conventions de structure (communes à toutes versions récentes)

| Concept | Convention |
|---|---|
| Modèles | `app/models/`, un fichier par classe, nom singulier (`user.rb` → `class User`) |
| Controllers | `app/controllers/`, versionnés sous `api/v1/` pour une API |
| Migrations | `db/migrate/`, jamais éditées après avoir été jouées en production — créer une nouvelle migration |
| Routes | `config/routes.rb`, toujours namespacées (`namespace :api do ... end`) pour une API |
| Tests | Minitest par défaut, RSpec si le projet l'a choisi explicitement — ne pas mélanger les deux frameworks de test dans un même projet |

# Service objects pour la logique métier complexe

Dès qu'une action dépasse quelques lignes de logique (au-delà d'un simple
CRUD), extraire dans un service object (`app/services/`) plutôt que de
laisser grossir le controller ou le modèle — controllers et modèles
restent fins, la logique métier vit dans des objets dédiés et testables
isolément.

# Pièges transverses (toute version, tout pattern)

- Ne jamais désactiver `protect_from_forgery` globalement pour
  contourner une erreur CSRF — comprendre pourquoi l'erreur survient
  (souvent un firewall CORS mal configuré côté frontend) plutôt que de
  retirer la protection.
- `rails db:migrate` ne doit jamais être lancé directement en production
  sans passer par le pipeline de déploiement habituel (risque de migration
  partielle si le déploiement échoue en cours de route).
- Toujours utiliser des transactions (`ActiveRecord::Base.transaction`)
  pour toute opération qui touche plusieurs tables de façon liée — éviter
  les états incohérents en cas d'erreur à mi-parcours.