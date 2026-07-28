---
type: Example
title: Singleton Nuxt — exemple Configuration globale
tags: [nuxt, frontend, singleton, config]
---

# Application du pattern sur une config globale côté Nuxt

Configuration de l'application lue depuis `runtimeConfig` une seule fois,
validée et exposée via un singleton — partagé entre tous les composables.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Singleton}` | `AppConfig` |
| Approche | Module ES (approche A) — runtimeConfig lu dans le plugin |

# Implémentation — Module ES + validation

```ts
// app/singletons/appConfig.ts  (v4) ou singletons/appConfig.ts (v3)

export interface AppConfig {
  apiBaseUrl: string
  paymentProvider: 'stripe' | 'paypal'
  featureFlags: {
    newDashboard: boolean
    betaApi: boolean
  }
  maxUploadSize: number  // Mo
}

let _config: AppConfig | null = null

function validate(raw: Record<string, unknown>): AppConfig {
  if (!raw.apiBaseUrl) throw new Error('apiBaseUrl manquant dans runtimeConfig')
  return {
    apiBaseUrl:      raw.apiBaseUrl as string,
    paymentProvider: (raw.paymentProvider as AppConfig['paymentProvider']) ?? 'stripe',
    featureFlags: {
      newDashboard: Boolean(raw.featureNewDashboard),
      betaApi:      Boolean(raw.featureBetaApi),
    },
    maxUploadSize: Number(raw.maxUploadSize ?? 10),
  }
}

// Appelé une seule fois depuis le plugin d'initialisation
export function initAppConfig(raw: Record<string, unknown>): AppConfig {
  _config = validate(raw)
  return _config
}

export function getAppConfig(): AppConfig {
  if (!_config) throw new Error('AppConfig non initialisé — appeler initAppConfig() d\'abord')
  return _config
}
```

```ts
// app/plugins/app-config.ts
export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()
  // Initialiser le singleton avec les valeurs de runtimeConfig
  initAppConfig(runtimeConfig.public as Record<string, unknown>)
})
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBaseUrl:          process.env.NUXT_PUBLIC_API_BASE_URL,
      paymentProvider:     process.env.NUXT_PUBLIC_PAYMENT_PROVIDER ?? 'stripe',
      featureNewDashboard: process.env.NUXT_PUBLIC_FEATURE_NEW_DASHBOARD === 'true',
      featureBetaApi:      process.env.NUXT_PUBLIC_FEATURE_BETA_API === 'true',
      maxUploadSize:       process.env.NUXT_PUBLIC_MAX_UPLOAD_SIZE ?? '10',
    },
  },
})
```

# Composable d'accès

```ts
// app/composables/useAppConfig.ts
// Ne pas confondre avec le useAppConfig() natif Nuxt (pour app.config.ts)
export function useProjectConfig() {
  return getAppConfig()
}
```

# Utilisation dans un composant

```vue
<script setup lang="ts">
const config = useProjectConfig()

const canAccessBeta = computed(() => config.featureFlags.betaApi)
</script>

<template>
  <div>
    <BetaFeature v-if="canAccessBeta" />
  </div>
</template>
```