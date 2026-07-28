---
type: Example
title: Observer Rails — exemple ActiveRecord callbacks
tags: [rails, backend, observer, callbacks, active-record]
---

# Application du pattern sur ActiveRecord

Les callbacks ActiveRecord sont l'implémentation Observer la plus native
de Rails. Le modèle est le Sujet, les callbacks sont les Observateurs.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Subject}` | `Order` |
| `{Event}` | `:created`, `:status_changed`, `:paid` |
| `{ObserverA}` | `OrderConfirmationMailer` |
| `{ObserverB}` | `StockUpdaterJob` |
| `{ObserverC}` | `AuditLogger` |

# Approche recommandée — ActiveSupport::Notifications (découplé)

```ruby
# app/models/order.rb
class Order < ApplicationRecord
  enum :status, { draft: 0, confirmed: 1, shipped: 2, cancelled: 3 }

  after_create_commit  :broadcast_created
  after_update_commit  :broadcast_status_changed, if: :saved_change_to_status?

  private

  def broadcast_created
    ActiveSupport::Notifications.instrument(
      'app.order.created',
      { order_id: id, customer_id: customer_id, total: total }
    )
  end

  def broadcast_status_changed
    ActiveSupport::Notifications.instrument(
      'app.order.status_changed',
      {
        order_id:   id,
        old_status: status_before_last_save,
        new_status: status,
      }
    )
  end
end

# config/initializers/order_observers.rb
# Observateur A : email de confirmation
ActiveSupport::Notifications.subscribe('app.order.created') do |*, payload|
  OrderConfirmationMailerJob.perform_later(payload[:order_id])
end

# Observateur B : mise à jour du stock
ActiveSupport::Notifications.subscribe('app.order.created') do |*, payload|
  StockReservationJob.perform_later(payload[:order_id])
end

# Observateur C : audit
ActiveSupport::Notifications.subscribe(/\Aapp\.order\./) do |name, start, *, payload|
  AuditLog.create!(
    event:      name,
    record_id:  payload[:order_id],
    occurred_at: start,
    metadata:   payload.to_json
  )
end
```

# Alternative — callbacks directs (plus simple, moins découplé)

```ruby
# app/models/order.rb — pour des effets de bord simples et stables
class Order < ApplicationRecord
  after_create_commit  -> { OrderConfirmationMailerJob.perform_later(id) }
  after_update_commit  -> { StockSyncJob.perform_later(id) }, if: :saved_change_to_status?
end
```

# Concern réutilisable pour l'audit

```ruby
# app/concerns/auditable.rb
module Auditable
  extend ActiveSupport::Concern

  included do
    after_create_commit  -> { log_audit(:created) }
    after_update_commit  -> { log_audit(:updated) }
    after_destroy_commit -> { log_audit(:destroyed) }
  end

  private

  def log_audit(action)
    AuditLog.create!(
      record_type: self.class.name,
      record_id:   id,
      action:      action,
      changes:     previous_changes.to_json,
      user_id:     Current.user&.id,
    )
  end
end

# Utilisation sur n'importe quel modèle
class Order < ApplicationRecord
  include Auditable
end
```

# Règles critiques Rails

- **`after_commit` plutôt que `after_create`** pour les jobs et emails —
  `after_create` s'exécute dans la transaction, si elle rollback le job
  est déjà en queue pour une commande inexistante.
- **`saved_change_to_{attr}?`** plutôt que `{attr}_changed?` dans les
  callbacks `after_*` — `{attr}_changed?` est réservé aux callbacks `before_*`.
- **`perform_later` jamais `perform_now`** dans un callback — un job
  synchrone bloque la requête le temps de son exécution.
- **`ActiveSupport::Notifications` pour les abonnements multiples** —
  plus facile de désenregistrer un observateur ou d'en ajouter sans
  toucher au modèle.