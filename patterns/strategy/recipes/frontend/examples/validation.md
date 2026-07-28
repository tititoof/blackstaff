---
type: Example
title: Strategy Nuxt — exemple Validation de formulaire
tags: [nuxt, frontend, strategy, validation]
---

# Application du pattern sur une validation de formulaire

Règles de validation différentes selon le contexte (inscription standard,
invitation, profil admin) — le composant formulaire ne connaît pas les règles.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Domain}` | `FormValidation` |
| `{Strategy}` | `ValidationStrategy` |
| `{ConcreteA}` | `GuestRegistration` |
| `{ConcreteB}` | `InvitedUser` |
| `{ConcreteC}` | `AdminCreated` |
| Méthode | `execute(data)` → `{ valid, errors }` |

# Implémentation

```ts
// app/strategies/formValidations/types.ts
export type ValidationContext = 'guest' | 'invited' | 'admin_created'

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string[]>
}

export interface ValidationStrategyInterface {
  execute(data: Record<string, unknown>): ValidationResult
}

// app/strategies/formValidations/GuestRegistrationValidationStrategy.ts
export class GuestRegistrationValidationStrategy implements ValidationStrategyInterface {
  execute(data: Record<string, unknown>): ValidationResult {
    const errors: Record<string, string[]> = {}

    if (!data.email) {
      errors.email = ['Email requis']
    } else if (!/^[^@]+@[^@]+\.[^@]+$/.test(String(data.email))) {
      errors.email = ['Email invalide']
    }

    if (!data.password || String(data.password).length < 8) {
      errors.password = ['Mot de passe requis (8 caractères min)']
    }

    if (data.password !== data.passwordConfirmation) {
      errors.passwordConfirmation = ['Les mots de passe ne correspondent pas']
    }

    return { valid: Object.keys(errors).length === 0, errors }
  }
}

// app/strategies/formValidations/AdminCreatedValidationStrategy.ts
export class AdminCreatedValidationStrategy implements ValidationStrategyInterface {
  execute(data: Record<string, unknown>): ValidationResult {
    const errors: Record<string, string[]> = {}

    if (!data.email) errors.email = ['Email requis']
    if (!['user', 'moderator', 'admin'].includes(String(data.role))) {
      errors.role = ['Rôle invalide']
    }
    // Pas de validation mot de passe — envoi d'invitation par email

    return { valid: Object.keys(errors).length === 0, errors }
  }
}

// app/strategies/formValidations/ValidationStrategyResolver.ts
import { GuestRegistrationValidationStrategy } from './GuestRegistrationValidationStrategy'
import { AdminCreatedValidationStrategy } from './AdminCreatedValidationStrategy'
import type { ValidationContext, ValidationStrategyInterface } from './types'

export function resolveValidationStrategy(context: ValidationContext): ValidationStrategyInterface {
  switch (context) {
    case 'guest':        return new GuestRegistrationValidationStrategy()
    case 'admin_created': return new AdminCreatedValidationStrategy()
    default:             return new GuestRegistrationValidationStrategy()
  }
}
```

# Composable contexte

```ts
// app/composables/useFormValidation.ts
import { resolveValidationStrategy } from '~~/strategies/formValidations/ValidationStrategyResolver'
import type { ValidationContext, ValidationResult } from '~~/strategies/formValidations/types'

export function useFormValidation(context: ValidationContext = 'guest') {
  const errors = ref<Record<string, string[]>>({})
  const isValid = computed(() => Object.keys(errors.value).length === 0)

  const strategy = resolveValidationStrategy(context)

  function validate(data: Record<string, unknown>): boolean {
    const result: ValidationResult = strategy.execute(data)
    errors.value = result.errors
    return result.valid
  }

  function clearError(field: string) {
    const { [field]: _, ...rest } = errors.value
    errors.value = rest
  }

  return { errors, isValid, validate, clearError }
}
```

# Utilisation dans un composant

```vue
<!-- app/pages/register.vue -->
<script setup lang="ts">
const route = useRoute()
// Le contexte vient de la route ou d'une prop — pas hardcodé
const validationContext = computed(() =>
  route.query.type === 'invited' ? 'invited' : 'guest'
)

const { errors, validate } = useFormValidation(validationContext.value)

const form = reactive({ email: '', password: '', passwordConfirmation: '' })

async function handleSubmit() {
  if (!validate(form)) return   // erreurs affichées automatiquement
  await $fetch('/api/register', { method: 'POST', body: form })
  navigateTo('/dashboard')
}
</script>

<template>
  <v-form @submit.prevent="handleSubmit">
    <v-text-field
      v-model="form.email"
      label="Email"
      :error-messages="errors.email"
    />
    <v-text-field
      v-model="form.password"
      label="Mot de passe"
      type="password"
      :error-messages="errors.password"
    />
    <v-btn type="submit" color="primary">S'inscrire</v-btn>
  </v-form>
</template>
```