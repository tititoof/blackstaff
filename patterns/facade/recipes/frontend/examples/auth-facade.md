---
type: Example
title: Facade Nuxt — exemple Auth (authentification multi-étapes)
tags: [nuxt, frontend, facade, auth]
---

# Application du pattern sur le processus d'authentification

Le login coordonne validation des credentials, vérification 2FA,
chargement du profil et initialisation de la session — le composant
n'appelle qu'une méthode `login()`.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Facade}` | `useAuthFacade` |
| `{SubsystemA}` | `useCredentials` (validation email/mot de passe) |
| `{SubsystemB}` | `useTwoFactor` (vérification OTP) |
| `{SubsystemC}` | `useUserProfile` (chargement du profil) |
| `{SubsystemD}` | `useSession` (initialisation de session) |
| Méthode simplifiée | `login({ email, password, otpCode? })` |

# Le composable Facade

```ts
// app/composables/useAuthFacade.ts
export type AuthStep =
  | 'idle'
  | 'checking_credentials'
  | 'awaiting_otp'
  | 'loading_profile'
  | 'done'

export interface LoginParams {
  email:    string
  password: string
  otpCode?: string
}

export function useAuthFacade() {
  const credentials  = useCredentials()
  const twoFactor    = useTwoFactor()
  const userProfile  = useUserProfile()
  const session      = useSession()

  const step         = ref<AuthStep>('idle')
  const error        = ref<string | null>(null)
  const requiresOtp  = ref(false)
  const loading      = computed(() =>
    step.value !== 'idle' && step.value !== 'done'
  )

  async function login(params: LoginParams): Promise<void> {
    step.value        = 'checking_credentials'
    error.value       = null
    requiresOtp.value = false

    try {
      // Étape 1 : valider les credentials
      const authResult = await credentials.verify({
        email:    params.email,
        password: params.password,
      })

      // Étape 2 : vérification 2FA si activée
      if (authResult.requires2fa) {
        if (!params.otpCode) {
          // Signaler au composant qu'un code OTP est attendu
          step.value        = 'awaiting_otp'
          requiresOtp.value = true
          return
        }

        step.value = 'checking_credentials'
        await twoFactor.verify({
          userId:  authResult.userId,
          otpCode: params.otpCode,
        })
      }

      // Étape 3 : charger le profil complet
      step.value = 'loading_profile'
      const profile = await userProfile.fetch(authResult.userId)

      // Étape 4 : initialiser la session
      await session.initialize({
        token:   authResult.token,
        profile: profile,
      })

      step.value = 'done'
      navigateTo(session.intendedRoute.value ?? '/dashboard')

    } catch (e: any) {
      step.value  = 'idle'
      error.value = mapAuthError(e)
      requiresOtp.value = false
    }
  }

  async function logout(): Promise<void> {
    await session.destroy()
    userProfile.clear()
    step.value = 'idle'
    navigateTo('/login')
  }

  function reset(): void {
    step.value        = 'idle'
    error.value       = null
    requiresOtp.value = false
  }

  return {
    step:        readonly(step),
    loading,
    error:       readonly(error),
    requiresOtp: readonly(requiresOtp),
    login,
    logout,
    reset,
  }
}

function mapAuthError(e: any): string {
  if (e.statusCode === 401) return 'Email ou mot de passe incorrect'
  if (e.statusCode === 403) return 'Code de vérification invalide ou expiré'
  if (e.statusCode === 429) return 'Trop de tentatives — réessayez dans quelques minutes'
  return 'Connexion impossible. Veuillez réessayer.'
}
```

# Utilisation dans un composant

```vue
<!-- app/pages/login.vue -->
<script setup lang="ts">
const { step, loading, error, requiresOtp, login, reset } = useAuthFacade()

const form = reactive({
  email:    '',
  password: '',
  otpCode:  '',
})

async function handleLogin() {
  await login({
    email:    form.email,
    password: form.password,
    otpCode:  requiresOtp.value ? form.otpCode : undefined,
  })
}
</script>

<template>
  <v-card max-width="420" class="mx-auto mt-16">
    <v-card-title>Connexion</v-card-title>

    <v-card-text>
      <v-alert v-if="error" type="error" :text="error" class="mb-4" />

      <template v-if="!requiresOtp">
        <v-text-field v-model="form.email"    label="Email" type="email" />
        <v-text-field v-model="form.password" label="Mot de passe" type="password" />
      </template>

      <!-- Affiché uniquement si la 2FA est requise -->
      <template v-else>
        <v-alert type="info" text="Entrez le code envoyé sur votre application" class="mb-4" />
        <v-text-field
          v-model="form.otpCode"
          label="Code de vérification"
          maxlength="6"
          autofocus
        />
      </template>
    </v-card-text>

    <v-card-actions>
      <v-btn v-if="requiresOtp" variant="text" @click="reset">
        ← Retour
      </v-btn>
      <v-spacer />
      <v-btn color="primary" :loading="loading" @click="handleLogin">
        {{ requiresOtp ? 'Vérifier' : 'Se connecter' }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
```

# Ce que la Facade apporte ici

- **Flux conditionnel masqué** — la logique "a-t-on besoin du 2FA ?" est
  dans la Facade, pas dans le composant. Le composant réagit à `requiresOtp`
  sans savoir pourquoi ni comment.
- **État de progression** — `step` permet d'afficher un indicateur visuel
  sans que le composant suive lui-même les transitions.
- **`logout()` groupé** — détruire la session ET vider le profil se fait
  en une seule méthode, dans le bon ordre.