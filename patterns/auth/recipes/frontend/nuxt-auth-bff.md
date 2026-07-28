# Recipe : auth avec nuxt-auth-utils (Nuxt 3/4, pattern BFF)

## Principe

Le token JWT (ou toute donnée sensible) ne quitte JAMAIS le serveur. Il est stocké
dans une session scellée côté serveur (cookie httpOnly chiffré), jamais renvoyé
au client. Le client ne connaît que `user`, jamais le token.

## 1. Augmentation de session — `app/types/session.d.ts` (ou `auth.d.ts`)

```typescript
// server/types/auth.d.ts (ou app/types/session.d.ts selon convention projet)
declare module '#auth-utils' {
  interface User {
    id: number | string
    email: string
    name?: string
  }

  interface UserSession {
    user: User
    loggedInAt: number
  }

  interface SecureSessionData {
    rails_token: string
  }
}

export {}
```

⚠️ Le module à augmenter est **`#auth-utils`**, pas `nuxt-auth-utils` ni
`nuxt-auth-utils/runtime`. `SecureSessionData` est une interface SÉPARÉE de
`UserSession` — les données sensibles n'y vont jamais en clair dans `UserSession`.

## 2. Client HTTP vers l'API externe — `server/utils/rails-client.ts`

```typescript
// server/utils/rails-client.ts
export async function fetchRails<T = any>(
  path: string,
  opts: { method?: string; body?: any; token?: string | null } = {},
): Promise<T> {
  const config = useRuntimeConfig()
  return await $fetch<T>(path, {
    baseURL: config.railsApiUrl,
    method:  opts.method ?? 'GET',
    body:    opts.body,
    headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : {},
  })
}
```

Nom exporté : **`fetchRails`** — c'est CE nom exact que les routes API doivent importer,
pas `createRailsClient` ni aucune variante.

## 3. Route de connexion — `server/api/auth/login.post.ts`

```typescript
// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  const data = await fetchRails<{ user: any; token: string }>('/api/v1/login', {
    method: 'POST',
    body: { email, password },
  })

  await setUserSession(event, {
    user: { id: data.user.id, email: data.user.email, name: data.user.name },
    loggedInAt: Date.now(),
    secure: { rails_token: data.token },
  })

  return { user: data.user } // le token n'est JAMAIS renvoyé
})
```

## 4. Déconnexion — `server/api/auth/logout.delete.ts`

```typescript
// server/api/auth/logout.delete.ts
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const token = session.secure?.rails_token

  if (token) {
    await fetchRails('/api/v1/logout', { method: 'DELETE', token }).catch(() => {})
  }

  await clearUserSession(event)
  return { success: true }
})
```

## 5. Composable côté client — `app/composables/useAuthApi.ts`

```typescript
// app/composables/useAuthApi.ts
export function useAuthApi() {
  const { user, loggedIn, fetch: refreshSession } = useUserSession()

  async function signIn(email: string, password: string) {
    try {
      await $fetch('/api/auth/login', { method: 'POST', body: { email, password } })
      await refreshSession()
      return { statusCode: 200 }
    } catch (e: any) {
      return { statusCode: e.response?.status ?? 500 }
    }
  }

  async function signOut() {
    await $fetch('/api/auth/logout', { method: 'DELETE' })
    await refreshSession()
    await navigateTo('/login')
  }

  return { user, loggedIn, signIn, signOut }
}
```

## 6. Middleware de protection — `app/middleware/auth.ts`

```typescript
// app/middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()
  if (!loggedIn.value && to.path !== '/login') {
    return navigateTo('/login')
  }
})
```

⚠️ La logique protège les routes **quand l'utilisateur n'est PAS connecté** —
sens inverse observé dans plusieurs générations ratées.