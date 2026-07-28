---
type: Recipe
title: Observer Rails — générique
tags: [rails, backend, observer, design-pattern]
---

# Quand utiliser ce pattern

Réagir à des événements sur un modèle ActiveRecord (création, mise à jour,
suppression) ou sur un objet métier personnalisé, sans coupler le modèle
aux effets de bord (emails, notifications, audit...).

Exemples concrets :
- [ActiveRecord callbacks (Sujet natif Rails)](/patterns/observer/recipes/backend/examples/active-record-callbacks.md)
- [Symfony EventSubscriber pattern équivalent](/patterns/observer/recipes/backend/examples/event-subscriber.md)

# Dépendances

- [Conventions Rails générales](/frameworks/rails.md)
- [Rails 8 — chemins](/frameworks/rails/v8.md)

# Trois mécanismes Observer en Rails

## Mécanisme 1 — ActiveRecord callbacks (Observer natif le plus courant)

```ruby
# Les callbacks Rails sont des Observateurs du cycle de vie du modèle.
# app/models/{subject}.rb
class {Subject} < ApplicationRecord
  after_create  :notify_creation
  after_update  :notify_update
  after_destroy :notify_destruction

  private

  def notify_creation
    {ObserverA}.new.update(event: :created, record: self)
    {ObserverB}.new.update(event: :created, record: self)
  end
  # ...
end
```

## Mécanisme 2 — ActiveSupport::Notifications (bus d'événements natif Rails)

Le mécanisme le plus découplé en Rails — le Sujet émet un événement nommé,
les Observateurs s'y abonnent indépendamment.

```ruby
# Émission (Sujet) — depuis n'importe où dans l'app
ActiveSupport::Notifications.instrument(
  'app.{subject}.{event}',    # nom de l'événement
  { record: self, extra: data }  # payload
)

# Abonnement (Observateur) — dans un initializer ou concern
# config/initializers/{subject}_observers.rb
ActiveSupport::Notifications.subscribe('app.{subject}.{event}') do |name, start, finish, id, payload|
  {ObserverA}.new.update(payload)
end

ActiveSupport::Notifications.subscribe('app.{subject}.{event}') do |name, start, finish, id, payload|
  {ObserverB}.new.update(payload)
end
```

## Mécanisme 3 — Observer GoF pur (pour les objets non-ActiveRecord)

```ruby
# app/concerns/observable.rb
module Observable
  extend ActiveSupport::Concern

  included do
    @observers = []
  end

  module ClassMethods
    def add_observer(observer)
      @observers << observer
    end

    def observers
      @observers
    end
  end

  private

  def notify_observers(event, payload = {})
    self.class.observers.each do |observer|
      observer.update(event: event, subject: self, **payload)
    end
  end
end

# app/models/{subject}.rb
class {Subject}
  include Observable

  def some_action
    # Logique métier...
    notify_observers(:action_performed, data: result)
  end
end

# Observateur concret
# app/observers/{observer}.rb
class {Observer}
  def update(event:, subject:, **payload)
    case event
    when :action_performed
      # Réagir à l'événement
    end
  end
end

# Enregistrement des observateurs
{Subject}.add_observer({ObserverA}.new)
{Subject}.add_observer({ObserverB}.new)
```

# Règles à respecter

- Préférer `ActiveSupport::Notifications` aux callbacks ActiveRecord directs
  pour les effets de bord lourds (emails, jobs) — les callbacks bloquants
  dans une transaction peuvent ralentir l'écriture en base.
- Toujours placer les effets de bord asynchrones dans des jobs
  (`perform_later`) plutôt que dans l'Observateur directement — l'Observateur
  enqueue, il n'exécute pas le travail lourd.
- Les callbacks `after_*` dans ActiveRecord s'exécutent dans la transaction
  — une exception dans l'Observateur peut rollbacker l'écriture principale.
  Utiliser `after_commit` si l'effet de bord ne doit se déclencher qu'après
  la validation de la transaction.