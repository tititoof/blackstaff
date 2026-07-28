---
type: Example
title: Strategy — exemple Validation contextuelle
tags: [strategy, validation, rails, laravel, symfony]
---

# Application du pattern sur une validation contextuelle

Règles de validation différentes selon le rôle ou le contexte (invité,
utilisateur authentifié, admin) — même interface, comportement différent.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Domain}` | `UserRegistration` |
| `{Strategy}` | `RegistrationValidationStrategy` |
| `{Context}` | `RegistrationValidator` |
| `{ConcreteA}` | `GuestRegistration` |
| `{ConcreteB}` | `InvitedUserRegistration` |
| `{ConcreteC}` | `AdminCreatedRegistration` |
| Méthode commune | `execute(data)` |
| Retour | `{ valid: bool, errors: [] }` |

# Rails

```ruby
# app/strategies/user_registrations/guest_registration_validation_strategy.rb
module UserRegistrations
  class GuestRegistrationValidationStrategy
    def execute(data)
      errors = []
      errors << "Email requis"   if data[:email].blank?
      errors << "Email invalide" unless data[:email]&.match?(/\A[^@]+@[^@]+\z/)
      errors << "Mot de passe requis (8 caractères min)" if data[:password].to_s.length < 8
      errors << "Confirmation requise" if data[:password] != data[:password_confirmation]
      { valid: errors.empty?, errors: errors }
    end
  end
end

# app/strategies/user_registrations/admin_created_registration_validation_strategy.rb
module UserRegistrations
  class AdminCreatedRegistrationValidationStrategy
    def execute(data)
      # L'admin peut créer un compte sans mot de passe (envoi d'invitation)
      errors = []
      errors << "Email requis"   if data[:email].blank?
      errors << "Email invalide" unless data[:email]&.match?(/\A[^@]+@[^@]+\z/)
      errors << "Rôle invalide"  unless %w[user moderator admin].include?(data[:role])
      { valid: errors.empty?, errors: errors }
    end
  end
end

# Résolution selon le contexte d'inscription
def register
  strategy = case params[:registration_type]
             when 'guest'          then GuestRegistrationValidationStrategy.new
             when 'invited'        then InvitedUserRegistrationValidationStrategy.new
             when 'admin_created'  then AdminCreatedRegistrationValidationStrategy.new
             else                       GuestRegistrationValidationStrategy.new
             end

  result = strategy.execute(registration_params)
  return render json: { errors: result[:errors] }, status: :unprocessable_entity unless result[:valid]

  # Continuer l'inscription...
end
```

# Laravel

```php
// app/Strategies/UserRegistrations/GuestRegistrationValidationStrategy.php
class GuestRegistrationValidationStrategy implements RegistrationValidationStrategyInterface
{
    public function execute(array $data): array
    {
        $validator = validator($data, [
            'email'                 => 'required|email|unique:users',
            'password'              => 'required|min:8|confirmed',
            'password_confirmation' => 'required',
        ]);
        return [
            'valid'  => ! $validator->fails(),
            'errors' => $validator->errors()->all(),
        ];
    }
}

// app/Strategies/UserRegistrations/AdminCreatedRegistrationValidationStrategy.php
class AdminCreatedRegistrationValidationStrategy implements RegistrationValidationStrategyInterface
{
    public function execute(array $data): array
    {
        // Admin peut créer sans mot de passe, mais doit spécifier le rôle
        $validator = validator($data, [
            'email' => 'required|email|unique:users',
            'role'  => 'required|in:user,moderator,admin',
        ]);
        return ['valid' => ! $validator->fails(), 'errors' => $validator->errors()->all()];
    }
}
```

# Symfony

```php
// src/Strategy/UserRegistration/GuestRegistrationValidationStrategy.php
class GuestRegistrationValidationStrategy implements RegistrationValidationStrategyInterface
{
    public function __construct(private ValidatorInterface $validator) {}

    public function supports(string $type): bool { return $type === 'guest'; }

    public function execute(array $data): array
    {
        $dto = new GuestRegistrationDto(...$data);
        $violations = $this->validator->validate($dto);
        return [
            'valid'  => count($violations) === 0,
            'errors' => array_map(fn($v) => $v->getMessage(), iterator_to_array($violations)),
        ];
    }
}
```

# Avantage clé

Chaque contexte d'inscription a ses propres règles encapsulées dans une
classe dédiée — ajouter un nouveau contexte (ex: `SsoRegistration`) ne
touche à aucune règle existante. Sans Strategy, toutes les règles seraient
dans un seul controller avec des `if ($type === 'guest')` imbriqués.