---
type: Recipe
title: Auth API Rails (Devise + JWT)
tags: [rails, backend, api, auth]
---

# Quand utiliser ce pattern

Backend Rails en mode API-only, consommé par un frontend séparé (Nuxt ou
autre SPA), nécessitant un échange de token JWT plutôt que des sessions
cookie classiques.

# Dépendances

- [Conventions Rails générales](/frameworks/rails.md)
- [Devise](/patterns/auth/dependencies/rails-devise.md)
- [devise-jwt](/patterns/auth/dependencies/rails-jwt.md)

# Fichiers à générer

Chemins détaillés dans [Rails 8 — chemins](/frameworks/rails/v8.md).

# Modèle User

```ruby
# app/models/user.rb
class User < ApplicationRecord
  devise :database_authenticatable, :registerable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  include Devise::JWT::RevocationStrategies::JTIMatcher
end
```

# Migration JWT denylist

```ruby
class CreateJwtDenylist < ActiveRecord::Migration[8.0]
  def change
    create_table :jwt_denylist do |t|
      t.string :jti, null: false
      t.datetime :exp, null: false
    end
    add_index :jwt_denylist, :jti
  end
end
```

# Controller d'authentification

```ruby
# app/controllers/api/v1/auth_controller.rb
module Api
  module V1
    class AuthController < ApplicationController
      def sign_in
        user = User.find_by(email: params[:email])
        if user&.valid_password?(params[:password])
          render json: { user: UserSerializer.new(user).as_json }
          # Le token est ajouté au header Authorization par devise-jwt automatiquement
        else
          render json: { error: 'Identifiants invalides' }, status: :unauthorized
        end
      end

      def sign_out
        current_user.jwt_payload # déclenche la révocation via la stratégie configurée
        head :no_content
      end
    end
  end
end
```

# Routes

```ruby
# config/routes.rb
namespace :api do
  namespace :v1 do
    post 'auth/sign_in', to: 'auth#sign_in'
    delete 'auth/sign_out', to: 'auth#sign_out'
    post 'auth/sign_up', to: 'registrations#create'
    get 'auth/me', to: 'auth#me'
  end
end
```

# Serializer (ne jamais exposer le modèle brut)

```ruby
# app/serializers/user_serializer.rb
class UserSerializer
  def initialize(user)
    @user = user
  end

  def as_json
    { id: @user.id, email: @user.email, created_at: @user.created_at }
  end
end
```

# CORS

```ruby
# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV.fetch('FRONTEND_URL', 'http://localhost:3000')
    resource '*', headers: :any, methods: [:get, :post, :put, :patch, :delete, :options],
                  expose: ['Authorization']
  end
end
```

# Pièges à éviter

- `expose: ['Authorization']` est indispensable dans la config CORS — sans
  ça, le frontend ne peut pas lire le header contenant le JWT depuis la
  réponse de connexion.
- Toujours vérifier que `jwt_denylist` a un index sur `jti`, sinon chaque
  requête authentifiée fait un scan de table complet pour vérifier la
  révocation.