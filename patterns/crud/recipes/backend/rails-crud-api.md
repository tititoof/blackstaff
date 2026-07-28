---
type: Recipe
title: CRUD API Rails ({Resource})
tags: [rails, backend, api, crud]
---

# Quand utiliser ce pattern

Resource métier exposant un CRUD complet via une API Rails JSON, consommée
par un frontend séparé (Nuxt) ou un client tiers.

# Dépendances

- [Conventions Rails générales](/frameworks/rails.md)
- [jsonapi-serializer](/patterns/crud/dependencies/rails-jsonapi-serializer.md)
- [Kaminari (pagination)](/patterns/crud/dependencies/rails-kaminari.md)

# Fichiers à générer

Chemins détaillés dans [Rails 8 — chemins](/frameworks/rails/v8.md).

| Fichier | Rôle |
|---|---|
| `app/models/{resource}.rb` | Modèle ActiveRecord + validations |
| `app/controllers/api/v1/{resource}s_controller.rb` | Controller CRUD |
| `app/serializers/{resource}_serializer.rb` | Sérialisation JSON |
| `db/migrate/xxxx_create_{resource}s.rb` | Migration |
| `config/routes.rb` | Route à ajouter |

# Modèle

```ruby
# app/models/{resource}.rb
class {Resource} < ApplicationRecord
  # Validations
  validates :title, presence: true, length: { maximum: 255 }
  # Ajouter les validations métier selon la spec
end
```

# Migration

```ruby
class Create{Resource}s < ActiveRecord::Migration[8.1]
  def change
    create_table :{resource}s do |t|
      t.string :title, null: false
      # Ajouter les colonnes selon la spec
      t.timestamps
    end
  end
end
```

# Serializer

```ruby
# app/serializers/{resource}_serializer.rb
class {Resource}Serializer
  include JSONAPI::Serializer
  attributes :id, :title, :created_at, :updated_at
  # Ajouter les attributs selon la spec — jamais de champs sensibles
end
```

# Controller

```ruby
# app/controllers/api/v1/{resource}s_controller.rb
module Api
  module V1
    class {Resource}sController < ApplicationController
      before_action :authenticate_user!
      before_action :set_{resource}, only: [:show, :update, :destroy]

      def index
        @{resource}s = {Resource}.all.page(params[:page]).per(params[:per_page] || 25)
        render json: {
          data: {Resource}Serializer.new(@{resource}s).serializable_hash,
          meta: {
            current_page: @{resource}s.current_page,
            total_pages:  @{resource}s.total_pages,
            total_count:  @{resource}s.total_count
          }
        }
      end

      def show
        render json: {Resource}Serializer.new(@{resource}).serializable_hash
      end

      def create
        @{resource} = {Resource}.new({resource}_params)
        if @{resource}.save
          render json: {Resource}Serializer.new(@{resource}).serializable_hash,
                 status: :created
        else
          render json: { errors: @{resource}.errors.full_messages },
                 status: :unprocessable_entity
        end
      end

      def update
        if @{resource}.update({resource}_params)
          render json: {Resource}Serializer.new(@{resource}).serializable_hash
        else
          render json: { errors: @{resource}.errors.full_messages },
                 status: :unprocessable_entity
        end
      end

      def destroy
        @{resource}.destroy
        head :no_content
      end

      private

      def set_{resource}
        @{resource} = {Resource}.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Non trouvé' }, status: :not_found
      end

      def {resource}_params
        params.require(:{resource}).permit(:title) # compléter selon la spec
      end
    end
  end
end
```

# Routes

```ruby
# config/routes.rb — ajouter dans le namespace existant api/v1
namespace :api do
  namespace :v1 do
    resources :{resource}s
  end
end
```

# Pièges à éviter

- Toujours utiliser `rescue ActiveRecord::RecordNotFound` dans
  `set_{resource}` — sans ça Rails renvoie une 500 ou une page d'erreur
  HTML au lieu d'un 404 JSON propre.
- Toujours appeler `params.require().permit()` avec la liste stricte
  des champs autorisés — jamais `.permit!` qui autorise tout.
- Toujours paginer `index` — une resource sans pagination sur `index`
  devient un problème dès que la table grossit.