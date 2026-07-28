---
type: Example
title: Decorator Nuxt — exemple Composable décoré (logging + retry)
tags: [nuxt, frontend, decorator, composable]
---

# Application du pattern sur un composable d'API

Enrichir un composable d'appel API avec du logging et du retry automatique
sans modifier le composable original.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Component}` | `ApiClient` |
| `{Operation}` | `fetch` |
| `{DecoratorA}` | `withLogging` |
| `{DecoratorB}` | `withRetry` |

# Implémentation — Higher-Order Functions (idiomatique TypeScript/Vue)

```ts
// app/services/api/apiClient.ts
export type ApiFn<T = unknown> = (path: string, options?: RequestInit) => Promise<T>

// Fonction originale
export const apiClient: ApiFn = async (path, options) => {
  return $fetch(path, options)
}

// Decorator A — logging
export function withLogging<T>(fn: ApiFn<T>): ApiFn<T> {
  return async (path, options) => {
    const start = performance.now()
    console.info(`[API] → ${options?.method ?? 'GET'} ${path}`)

    try {
      const result = await fn(path, options)   // délégation
      const ms = (performance.now() - start).toFixed(1)
      console.info(`[API] ← ${path} (${ms}ms)`)
      return result
    } catch (e: any) {
      console.error(`[API] ✗ ${path}:`, e.message)
      throw e
    }
  }
}

// Decorator B — retry automatique (3 tentatives, backoff exponentiel)
export function withRetry<T>(fn: ApiFn<T>, maxAttempts = 3): ApiFn<T> {
  return async (path, options) => {
    let lastError: unknown

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn(path, options)   // délégation
      } catch (e: any) {
        lastError = e
        // Ne pas retry sur les erreurs 4xx (problème client, pas réseau)
        if (e?.statusCode >= 400 && e?.statusCode < 500) throw e
        if (attempt < maxAttempts) {
          const delay = Math.pow(2, attempt) * 100  // 200ms, 400ms...
          await new Promise(resolve => setTimeout(resolve, delay))
          console.warn(`[API] Retry ${attempt}/${maxAttempts - 1} for ${path}`)
        }
      }
    }
    throw lastError
  }
}

// Decorator C — cache court terme (dedup des requêtes simultanées)
export function withDedup<T>(fn: ApiFn<T>): ApiFn<T> {
  const inFlight = new Map<string, Promise<T>>()

  return async (path, options) => {
    const key = `${options?.method ?? 'GET'}:${path}`
    if (inFlight.has(key)) return inFlight.get(key)!   // court-circuit

    const promise = fn(path, options).finally(() => inFlight.delete(key))
    inFlight.set(key, promise)
    return promise
  }
}

// Assemblage — ordre : logging (extérieur) → retry → dedup → apiClient (intérieur)
export const decoratedApiClient = withLogging(withRetry(withDedup(apiClient)))
```

# Composable façade

```ts
// app/composables/useApi.ts
import { decoratedApiClient } from '~~/services/api/apiClient'

export function useApi() {
  const loading = ref(false)
  const error   = ref<string | null>(null)

  async function request<T>(path: string, options?: RequestInit): Promise<T> {
    loading.value = true
    error.value   = null
    try {
      return await decoratedApiClient<T>(path, options)
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return { loading, error, request }
}
```

# Utilisation dans un composant

```vue
<script setup lang="ts">
const { loading, error, request } = useApi()

const products = ref<Product[]>([])

onMounted(async () => {
  // Les couches logging, retry et dedup sont transparentes
  products.value = await request<Product[]>('/api/products')
})
</script>
```

# Tester chaque Decorator isolément

```ts
// tests/services/api/decorators.test.ts
import { withLogging, withRetry } from '~/services/api/apiClient'

test('withRetry retente 3 fois avant de lever', async () => {
  let callCount = 0
  const failingFn = async () => {
    callCount++
    throw { statusCode: 503, message: 'Service unavailable' }
  }

  const retried = withRetry(failingFn, 3)
  await expect(retried('/test')).rejects.toThrow()
  expect(callCount).toBe(3)
})

test('withRetry ne retente pas sur les erreurs 4xx', async () => {
  let callCount = 0
  const notFoundFn = async () => {
    callCount++
    throw { statusCode: 404, message: 'Not found' }
  }

  const retried = withRetry(notFoundFn, 3)
  await expect(retried('/test')).rejects.toThrow()
  expect(callCount).toBe(1)  // pas de retry sur 404
})
```