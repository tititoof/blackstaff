---
type: Recipe
title: Prototype Rails — générique
tags: [rails, backend, prototype, design-pattern]
---

# Quand utiliser ce pattern

Dupliquer un objet complexe (entité ActiveRecord avec relations, objet de
configuration imbriqué) sans coupler le code appelant à la classe concrète,
et sans avoir à accéder aux attributs privés depuis l'extérieur.

Exemples concrets :
- [Entité métier (commande, produit)](/patterns/prototype/recipes/backend/examples/entity-clone.md)
- [Objet de configuration complexe](/patterns/prototype/recipes/backend/examples/config-clone.md)

# Dépendances

- [Conventions Rails générales](/frameworks/rails.md)
- [Rails 8 — chemins](/frameworks/rails/v8.md)

# Structure des fichiers

```
app/models/{prototype}.rb           ← inclut Cloneable
app/concerns/cloneable.rb           ← concern partagé (méthode clone)
```

# Concern partagé (interface Prototype)

```ruby
# app/concerns/cloneable.rb
module Cloneable
  extend ActiveSupport::Concern

  # Interface commune — à redéfinir dans chaque classe concrète.
  # Retourne une nouvelle instance indépendante de l'objet courant.
  def clone_prototype
    raise NotImplementedError, "#{self.class} doit implémenter #clone_prototype"
  end
end
```

# Prototype concret (à adapter par classe)

```ruby
# app/models/{prototype}.rb
class {Prototype} < ApplicationRecord
  include Cloneable

  # Relations et attributs
  has_many :{children}, dependent: :destroy
  # ...

  # Implémentation du clonage.
  # Copie en profondeur : l'objet et ses relations sont des instances
  # nouvelles et indépendantes de l'original.
  def clone_prototype
    clone = self.class.new(clone_attributes)
    clone_children(clone)
    clone
  end

  private

  # Attributs à copier — exclut toujours : id, timestamps, et tout
  # champ qui doit être unique (slug, référence, UUID...).
  def clone_attributes
    attributes.except('id', 'created_at', 'updated_at')
              .merge(clone_overrides)
  end

  # Surcharger pour modifier certains attributs dans le clone.
  # Ex : marquer le clone comme brouillon, changer son titre.
  def clone_overrides
    {}
    # Exemple : { 'status' => 'draft', 'title' => "#{title} (copie)" }
  end

  # Clone chaque enfant et l'attache au clone parent.
  # Copie profonde — les enfants sont des nouvelles instances.
  def clone_children(clone_parent)
    {children}.each do |child|
      cloned_child = child.clone_prototype
      clone_parent.{children} << cloned_child
    end
  end
end
```

# Utilisation dans un controller ou service

```ruby
# Depuis n'importe quel contexte — sans connaître la classe concrète
# si l'objet est obtenu via une interface / polymorphisme.
original = {Prototype}.find(params[:id])
cloned   = original.clone_prototype

if cloned.save
  render json: cloned, status: :created
else
  render json: { errors: cloned.errors.full_messages }, status: :unprocessable_entity
end
```

# Copie profonde vs superficielle en Ruby

```ruby
# ❌ Copie superficielle — les objets imbriqués sont partagés
clone = original.dup
# clone.items == original.items → même tableau, même références

# ✅ Copie profonde via clone_prototype
clone = original.clone_prototype
# clone.items → nouvelles instances d'Item, indépendantes
```

# Règles à respecter

- `clone_prototype` ne doit jamais appeler `save` — c'est le code appelant
  qui décide de persister ou non le clone.
- Toujours exclure `id` et les timestamps des attributs copiés — sinon
  ActiveRecord tente une UPDATE sur l'id de l'original.
- Toujours exclure les champs uniques (`reference`, `slug`, `token`) et
  les renseigner explicitement dans `clone_overrides`.
- Pour les relations `has_many through:`, cloner la relation intermédiaire,
  pas la cible finale (qui elle n'est pas dupliquée).