---
type: Example
title: Adapter Nuxt — exemple Format de données
tags: [nuxt, frontend, adapter, format, snake-case, camel-case]
---

# Application du pattern sur la normalisation de format côté Nuxt

Le backend (Rails/Laravel/Symfony) retourne du snake_case, les composants
Vue/TypeScript utilisent du camelCase — l'Adapter traduit automatiquement
dans les deux sens.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Adapter}` | `ApiFormatAdapter` |
| Direction aller | snake_case (backend) → camelCase (frontend) |
| Direction retour | camelCase (frontend) → snake_case (backend) |

# Adapter de format bidirectionnel

```ts
// adapters/apiFormat/ApiFormatAdapter.ts

type AnyObject = Record<string, unknown>

export class ApiFormatAdapter {
  // snake_case → camelCase (réponses API → composants)
  toCamelCase<T = AnyObject>(data: unknown): T {
    if (Array.isArray(data)) {
      return data.map(item => this.toCamelCase(item)) as T
    }
    if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
      return Object.fromEntries(
        Object.entries(data as AnyObject).map(([key, value]) => [
          this.snakeToCamel(key),
          this.toCamelCase(value),
        ])
      ) as T
    }
    return data as T
  }

  // camelCase → snake_case (envoi vers l'API)
  toSnakeCase<T = AnyObject>(data: unknown): T {
    if (Array.isArray(data)) {
      return data.map(item => this.toSnakeCase(item)) as T
    }
    if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
      return Object.fromEntries(
        Object.entries(data as AnyObject).map(([key, value]) => [
          this.camelToSnake(key),
          this.toSnakeCase(value),
        ])
      ) as T
    }
    return data as T
  }

  private snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  }
}

export const apiFormatAdapter = new ApiFormatAdapter()
```

# Plugin Nuxt — interception globale de `$fetch`

Pour appliquer l'Adapter automatiquement sur tous les appels API sans
l'appeler manuellement dans chaque composable :

```ts
// app/plugins/api-format.ts
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Créer un client $fetch qui adapte automatiquement les formats
  const $api = $fetch.create({
    baseURL: config.public.apiBaseUrl,

    onResponse({ response }) {
      // Convertir automatiquement snake_case → camelCase sur toutes les réponses
      if (response._data && typeof response._data === 'object') {
        response._data = apiFormatAdapter.toCamelCase(response._data)
      }
    },

    onRequest({ options }) {
      // Convertir automatiquement camelCase → snake_case sur tous les envois
      if (options.body && typeof options.body === 'object') {
        options.body = apiFormatAdapter.toSnakeCase(options.body as AnyObject)
      }
    },
  })

  return {
    provide: { api: $api }
  }
})
```

# Utilisation — transparente dans les composables

```ts
// composables/useOrders.ts
export function useOrders() {
  const { $api } = useNuxtApp()

  async function fetchAll() {
    // L'API retourne snake_case : { order_id, customer_name, created_at }
    // Après l'Adapter : { orderId, customerName, createdAt } — automatique
    return $api<Order[]>('/api/orders')
  }

  async function create(order: Partial<Order>) {
    // Envoi en camelCase : { customerName, totalAmount }
    // Après l'Adapter : { customer_name, total_amount } — automatique
    return $api<Order>('/api/orders', { method: 'POST', body: order })
  }

  return { fetchAll, create }
}
```

# Adapter de date en complément

```ts
// adapters/apiFormat/DateAdapter.ts
export class DateAdapter {
  // Normaliser toutes les dates d'un objet vers des objets Date JS
  normalizeDates<T extends AnyObject>(
    data: T,
    dateFields: (keyof T)[]
  ): T {
    const result = { ...data }
    for (const field of dateFields) {
      const value = result[field]
      if (typeof value === 'string' || typeof value === 'number') {
        (result[field] as unknown) = new Date(value)
      }
    }
    return result
  }

  // Pour l'envoi API : Date → ISO 8601 string
  serializeDates<T extends AnyObject>(
    data: T,
    dateFields: (keyof T)[]
  ): T {
    const result = { ...data }
    for (const field of dateFields) {
      const value = result[field]
      if (value instanceof Date) {
        (result[field] as unknown) = value.toISOString()
      }
    }
    return result
  }
}
```

# Tests de l'Adapter — sans mock réseau

```ts
// tests/adapters/ApiFormatAdapter.test.ts
import { ApiFormatAdapter } from '~/adapters/apiFormat/ApiFormatAdapter'

const adapter = new ApiFormatAdapter()

test('toCamelCase convertit les clés récursivement', () => {
  const raw = { order_id: 1, customer: { first_name: 'Alice', last_name: 'Dupont' } }
  expect(adapter.toCamelCase(raw)).toEqual({
    orderId: 1, customer: { firstName: 'Alice', lastName: 'Dupont' }
  })
})

test('toSnakeCase convertit les clés récursivement', () => {
  const data = { orderId: 1, customerName: 'Alice' }
  expect(adapter.toSnakeCase(data)).toEqual({ order_id: 1, customer_name: 'Alice' })
})

test('toCamelCase gère les tableaux', () => {
  const raw = [{ user_id: 1 }, { user_id: 2 }]
  expect(adapter.toCamelCase(raw)).toEqual([{ userId: 1 }, { userId: 2 }])
})
```

# Avantage : zéro couplage au format backend

Le reste du frontend est entièrement en camelCase TypeScript — si le
backend change de convention (vers JSON:API, GraphQL, etc.), seul l'Adapter
de format change. Aucun composable ni composant à modifier.