---
type: Dependency
title: jsonapi-serializer (Rails)
ecosystem: ruby
check_file: Gemfile
check_pattern: "gem \"jsonapi-serializer\""
install_command: bundle add jsonapi-serializer
postinstall_commands: []
min_version: "2.2"
tags: [rails, crud, serializer, gem]
---

# jsonapi-serializer

Librairie de sérialisation JSON performante pour Rails (anciennement
`fast_jsonapi` de Netflix, maintenant maintenu par la communauté).
Sérialise des objets ActiveRecord en JSON structuré, avec support des
relations, des attributs calculés et de la sélection de champs.

Choisie plutôt qu'`active_model_serializers` (vieillissant, maintenance
minimale depuis 2023) pour sa performance et son activité en 2026.

# Vérification d'installation

Vérifier dans `Gemfile` la présence de `gem "jsonapi-serializer"`.
Pas de générateur dédié — le serializer est une classe Ruby simple.

# Structure d'un serializer

```ruby
# app/serializers/{resource}_serializer.rb
class {Resource}Serializer
  include JSONAPI::Serializer

  attributes :id, :title, :body, :created_at, :updated_at

  # Relation (à n'inclure que si réellement nécessaire) :
  # belongs_to :user
  # has_many :comments
end
```

# Utilisation dans le controller

```ruby
render json: {Resource}Serializer.new(@{resource}).serializable_hash
render json: {Resource}Serializer.new(@{resources}).serializable_hash
```

# Pièges

- Ne jamais sérialiser toutes les associations par défaut — only, n+1
  silencieux garanti sur les listes. Ajouter les relations uniquement
  si l'endpoint les expose explicitement, avec `includes()` en amont.
- Le retour de `serializable_hash` est un Hash Ruby, pas du JSON —
  Rails le sérialise en JSON via `render json:`. Ne pas appeler
  `.to_json` manuellement dessus, ça double-encode.