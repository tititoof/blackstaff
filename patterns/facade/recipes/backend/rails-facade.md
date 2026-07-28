---
type: Recipe
title: Facade Rails — générique
tags: [rails, backend, facade, design-pattern]
---

# Quand utiliser ce pattern

Une action métier qui nécessite de coordonner plusieurs services — le
controller ou le client ne devrait appeler qu'une seule méthode pour
déclencher l'ensemble du processus.

Exemples concrets :
- [Facade de commande (stock + paiement + email)](/patterns/facade/recipes/backend/examples/order-facade.md)
- [Facade de notification (email + SMS + push)](/patterns/facade/recipes/backend/examples/notification-facade.md)
- [Facade de reporting (plusieurs sources de données)](/patterns/facade/recipes/backend/examples/reporting-facade.md)

# Dépendances

- [Conventions Rails générales](/frameworks/rails.md)
- [Rails 8 — chemins](/frameworks/rails/v8.md)

# Structure des fichiers

```
app/facades/
└── {facade}.rb          ← la Facade
app/services/
├── {subsystem_a}.rb     ← composants du sous-système (inchangés)
├── {subsystem_b}.rb
└── {subsystem_c}.rb
```

# La Facade

```ruby
# app/facades/{facade}.rb
class {Facade}
  # La Facade reçoit ses composants par injection — testabilité et flexibilité
  def initialize(
    {subsystem_a}: {SubsystemA}.new,
    {subsystem_b}: {SubsystemB}.new,
    {subsystem_c}: {SubsystemC}.new
  )
    @{subsystem_a} = {subsystem_a}
    @{subsystem_b} = {subsystem_b}
    @{subsystem_c} = {subsystem_c}
  end

  # Interface simplifiée — une méthode pour le cas d'usage complet
  def {operation}(**params)
    # Orchestrer les composants dans l'ordre correct
    step_a = @{subsystem_a}.{method_a}(**params)
    step_b = @{subsystem_b}.{method_b}(step_a_result: step_a, **params)
    step_c = @{subsystem_c}.{method_c}(step_b_result: step_b, **params)

    # Retourner un résultat consolidé
    {
      {result_key_a}: step_a,
      {result_key_b}: step_b,
      {result_key_c}: step_c,
    }
  end

  # La Facade peut exposer plusieurs opérations de haut niveau
  def {other_operation}(**params)
    # Orchestration différente avec les mêmes composants
    @{subsystem_a}.{other_method}(**params)
  end
end
```

# Utilisation dans un controller (avant / après)

```ruby
# ❌ Sans Facade — le controller connaît et orchestre tous les services
def create
  order   = OrderService.new.create(order_params)
  payment = PaymentService.new.charge(order: order, token: params[:token])
  stock   = StockService.new.reserve(order: order)
  MailService.new.send_confirmation(order: order, payment: payment)
  render json: order, status: :created
end

# ✅ Avec Facade — une seule méthode
def create
  result = {Facade}.new.{operation}(
    order_params: order_params,
    token:        params[:token],
  )
  render json: result, status: :created
end
```

# Règles à respecter

- La Facade **orchestre** — elle ne contient pas de logique métier propre.
  La logique reste dans les services du sous-système.
- Toujours injecter les composants dans le constructeur plutôt que les
  instancier en dur — permet de swapper en test.
- Une Facade trop grande (>5-6 méthodes, >5 composants) est un signal
  qu'elle devrait être découpée en plusieurs facades plus ciblées.
- Ne pas exposer les composants internes via des accesseurs publics —
  si un client a besoin d'accéder directement à `@{subsystem_a}`, la
  Facade n'est peut-être pas la bonne abstraction ici.