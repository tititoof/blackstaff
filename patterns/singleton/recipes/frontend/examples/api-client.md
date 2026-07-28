---
type: Example
title: Singleton Nuxt — exemple Client API partagé
tags: [nuxt, frontend, singleton, api-client]
---

# Application du pattern sur un client API partagé côté Nuxt

Un client `$fetch` configuré une seule fois avec la base URL, les headers
d'authentification et les intercepteurs — partagé entre tous les composables.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Singleton}` | `ApiClient` |
| `{resource}` | L'instance `$fetch` configurée |
| Approche | Plugin Nuxt (approche B) |

# Implémentation — Plugin Nuxt

```ts
// app/plugins/api-client.ts  (v4) ou plugins/api-client.ts (v3)
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const { token } = useAuth()  // composable d'auth

  // Instance unique configurée une seule fois
  const apiClient = $fetch.create({
    baseURL: config.public.apiBaseUrl,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    onRequest({ options }) {
      // Intercepteur : injecter le token à chaque requête
      if (token.value) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token.value}`,
        }
      }
    },
    onResponseError({ response }) {
      // Intercepteur : gestion centralisée des erreurs
      if (response.status === 401) {
        navigateTo('/login')
      }
    },
  })

  return {
    provide: { api: apiClient }
  }
})
```

```ts
// nuxt.config.ts — déclarer le plugin
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
    },
  },
})
```

# Utilisation dans un composable

```ts
// app/composables/useOrders.ts
export function useOrders() {
  const { $api } = useNuxtApp()

  async function fetchAll() {
    // $api est le client configuré — baseURL, auth, intercepteurs inclus
    return $api<Order[]>('/api/orders')
  }

  async function create(payload: Partial<Order>) {
    return $api<Order>('/api/orders', { method: 'POST', body: payload })
  }

  return { fetchAll, create }
}
```

# Pourquoi un plugin plutôt qu'un module ES ici

`runtimeConfig` et `useAuth()` ne sont disponibles qu'en contexte Nuxt
(composables, plugins, composants) — pas dans un module ES statique.
Le plugin Nuxt est le bon endroit pour créer un singleton qui dépend
du contexte applicatif Nuxt.