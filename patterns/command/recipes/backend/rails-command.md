---
type: Recipe
title: Command Rails — générique
tags: [rails, backend, command, design-pattern]
---

# Quand utiliser ce pattern

Encapsuler une action métier complexe en objet autonome : pour la mettre en
file (Sidekiq), la logger, la rendre annulable, ou l'assembler dans un bus
de commandes.

Exemples concrets :
- [Jobs Sidekiq comme Commands](/patterns/command/recipes/backend/examples/job-queue.md)
- [Action transactionnelle complexe](/patterns/command/recipes/backend/examples/transaction.md)
- [Traitement par lot](/patterns/command/recipes/backend/examples/batch.md)

# Dépendances

- [Conventions Rails générales](/frameworks/rails.md)
- [Rails 8 — chemins](/frameworks/rails/v8.md)

# Structure des fichiers

```
app/commands/
├── base_command.rb             ← classe de base
├── {command}.rb                ← Command concrète
└── command_bus.rb              ← Invoker (optionnel)
```

# Interface Command (classe de base)

```ruby
# app/commands/base_command.rb
class BaseCommand
  # Résultat structuré : succès/échec + données/erreurs
  Result = Struct.new(:success, :data, :errors, keyword_init: true) do
    def success? = success
    def failure? = !success
  end

  def execute
    raise NotImplementedError, "#{self.class} doit implémenter #execute"
  end

  # Optionnel — implémenter uniquement si l'annulation est nécessaire
  def undo
    raise NotImplementedError, "#{self.class} ne supporte pas #undo"
  end

  private

  def success(data = nil)
    Result.new(success: true, data: data, errors: [])
  end

  def failure(*errors)
    Result.new(success: false, data: nil, errors: errors.flatten)
  end
end
```

# Command concrète

```ruby
# app/commands/{command}.rb
class {Command} < BaseCommand
  # Les paramètres font partie de la Command — encapsulés dans le constructeur
  def initialize({param_a}:, {param_b}:)
    @{param_a} = {param_a}
    @{param_b} = {param_b}
  end

  def execute
    # Valider les préconditions
    return failure("Paramètre invalide") unless valid?

    # Sauvegarder l'état avant modification (pour undo éventuel)
    @previous_state = capture_state

    # Déléguer au Receiver (service métier)
    result = {Receiver}.new.{action}(
      {param_a}: @{param_a},
      {param_b}: @{param_b},
    )

    success(result)
  rescue ActiveRecord::RecordInvalid => e
    failure(e.record.errors.full_messages)
  rescue => e
    failure(e.message)
  end

  def undo
    return failure("Rien à annuler") unless @previous_state
    {Receiver}.new.restore(@previous_state)
    success
  end

  private

  def valid?
    @{param_a}.present? && @{param_b}.present?
  end

  def capture_state
    # Capturer l'état nécessaire pour undo
    # ex: { record_id: @record.id, previous_attributes: @record.attributes.dup }
  end
end
```

# Invoker — Command Bus (optionnel)

```ruby
# app/commands/command_bus.rb
class CommandBus
  def initialize
    @history = []   # pour undo/redo
  end

  def dispatch(command)
    result = command.execute
    @history << command if result.success?
    result
  end

  def undo_last
    command = @history.pop
    return failure("Historique vide") unless command
    command.undo
  end
end
```

# Utilisation dans un controller

```ruby
# Utilisation directe (sans CommandBus)
def create
  command = {Command}.new(
    {param_a}: params[:{param_a}],
    {param_b}: params[:{param_b}],
  )
  result = command.execute

  if result.success?
    render json: result.data, status: :created
  else
    render json: { errors: result.errors }, status: :unprocessable_entity
  end
end

# Utilisation avec CommandBus
def create
  result = CommandBus.new.dispatch(
    {Command}.new({param_a}: params[:{param_a}], {param_b}: params[:{param_b}])
  )
  render json: result.success? ? result.data : { errors: result.errors },
         status: result.success? ? :created : :unprocessable_entity
end
```

# Règles à respecter

- Une Command doit être **autonome** — tous ses paramètres dans le constructeur,
  pas de dépendance implicite sur le contexte (Current.user, etc.) sauf
  injection explicite.
- `execute` retourne toujours un `Result` — jamais `nil` ni une exception
  non catchée pour les erreurs métier.
- `undo` n'est implémenté que si l'annulation est réellement nécessaire —
  ne pas implémenter par défaut pour ne pas surcharger les Commands simples.
- Les Commands asynchrones (jobs) ne doivent pas implémenter `undo` —
  l'annulation d'un job asyncrhone est un cas métier distinct (compensation).