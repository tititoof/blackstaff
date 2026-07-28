---
type: Dependency
title: Kaminari (Rails — pagination)
ecosystem: ruby
check_file: Gemfile
check_pattern: "gem \"kaminari\""
install_command: bundle add kaminari
postinstall_commands: []
min_version: "1.2"
tags: [rails, crud, pagination, gem]
---

# Kaminari

Gem de pagination pour ActiveRecord. Ajoute `.page()` et `.per()` sur
les scopes ActiveRecord, et expose les métadonnées de pagination
(total_count, total_pages, current_page) pour les inclure dans la
réponse JSON.

# Vérification d'installation

Vérifier dans `Gemfile` la présence de `gem "kaminari"`.

# Utilisation dans le controller

```ruby
@{resources} = {Resource}.all.page(params[:page]).per(params[:per_page] || 25)

render json: {
  data: {Resource}Serializer.new(@{resources}).serializable_hash,
  meta: {
    current_page: @{resources}.current_page,
    total_pages: @{resources}.total_pages,
    total_count: @{resources}.total_count
  }
}
```

# Pièges

- Ne pas appeler `.count` séparément sur la collection paginée —
  Kaminari l'expose via `total_count` sans requête supplémentaire.
- Toujours définir un `per` par défaut raisonnable (25-50 items) et un
  maximum (ex. `Kaminari.configure { |c| c.max_per_page = 100 }` dans
  un initializer) — sans ça un client peut demander `per_page=100000`.