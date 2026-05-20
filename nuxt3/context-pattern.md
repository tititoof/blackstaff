
## Pattern Nitro proxy — RÈGLES CRITIQUES

### Toute route Rails a un proxy Nitro correspondant
Le browser n'appelle JAMAIS Rails directement.
Le browser appelle /api/... sur Nitro.
Nitro lit le cookie httpOnly, injecte le Bearer token, appelle Rails.

### Template proxy authentifié
```typescript
// server/api/[ressource]/index.get.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'auth_token')

  if (!token) {
    throw createError({ statusCode: 401, message: 'Non authentifié' })
  }

  return await $fetch(`${config.railsApiBase}/[ressource]`, {
    headers: { Authorization: `Bearer ${token}` }
  })
})
```

### Login — set cookie httpOnly
```typescript
// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  const response = await $fetch<{ token: string; user: object }>(
    `${config.railsApiBase}/auth/login`,
    { method: 'POST', body }
  )

  setCookie(event, 'auth_token', response.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7
  })

  return { user: response.user }
})
```

### Logout — delete cookie
```typescript
// server/api/auth/logout.delete.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'auth_token')

  if (token) {
    await $fetch(`${config.railsApiBase}/auth/logout`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => {})
  }

  deleteCookie(event, 'auth_token')
  return { success: true }
})
```

---

## Pattern d'appel API côté client — RÈGLES CRITIQUES

### useApi.ts — wrapper central obligatoire
Tous les appels passent par useApi.
Jamais de $fetch direct vers Rails dans les pages ou composants.
Le cookie est envoyé automatiquement via credentials: 'include'.

```typescript
// composables/useApi.ts
export const useApi = () => {
  const apiFetch = <T>(
    endpoint: string,
    options: Parameters<typeof $fetch>[1] = {}
  ): Promise<T> => {
    return $fetch<T>(`/api${endpoint}`, {
      ...options,
      credentials: 'include'
    })
  }
  return { apiFetch }
}
```

### useAsyncData pour les lectures SSR dans les pages
```typescript
const { data, refresh } = await useAsyncData(
  'articles',
  () => apiFetch('/articles')
)
```

### apiFetch pour les mutations
```typescript
await apiFetch('/articles', { method: 'POST', body: payload })
await apiFetch(`/articles/${id}`, { method: 'PUT', body: payload })
await apiFetch(`/articles/${id}`, { method: 'DELETE' })
```

---

## Auth JWT — Pattern obligatoire

### Ce qui est côté Nitro (server/)
- Le token JWT vit dans un cookie httpOnly
- Nitro lit le cookie et injecte le Bearer dans les appels Rails
- Nitro expose /api/auth/me pour que le frontend récupère le user

### Ce qui est côté Pinia (client)
- useAuthStore contient UNIQUEMENT { user }
- Pas de token, jamais
- isAuthenticated = !!user

### Store auth — sans token
```typescript
// stores/useAuthStore.ts
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as { id: number; email: string } | null
  }),
  getters: {
    isAuthenticated: (state) => !!state.user
  },
  actions: {
    setUser(user: { id: number; email: string }) {
      this.user = user
    },
    logout() {
      this.user = null
    }
  }
  // Pas de persist — user rechargé via /api/auth/me au démarrage
})
```

### Rehydratation au démarrage — plugin
```typescript
// plugins/auth.ts
export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  if (!authStore.user) {
    try {
      const { user } = await $fetch('/api/auth/me', { credentials: 'include' })
      authStore.setUser(user)
    } catch {
      // Cookie absent ou expiré — user non connecté
    }
  }
})
```

### Middleware auth
```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
```

### Middleware guest
```typescript
// middleware/guest.ts
export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()
  if (authStore.isAuthenticated) {
    return navigateTo('/')
  }
})
```

---

## Configuration nuxt.config.ts

```typescript
runtimeConfig: {
  // Privé — uniquement côté Nitro, jamais exposé au browser
  railsApiBase: process.env.RAILS_API_BASE || 'http://localhost:3001/api/v1',
  public: {
    // Rien d'auth ici — tout est géré côté Nitro
  }
}
```

Variables d'environnement :
- RAILS_API_BASE → URL privée de l'API Rails (côté Nitro uniquement)

---

## Types à définir pour chaque domaine

```typescript
// types/Article.ts
export interface Article {
  id: number
  title: string
  content: string
  author_id: number
  created_at: string
  updated_at: string
}

export interface ArticlePaginated {
  articles: Article[]
  meta: { total: number; page: number; per_page: number }
}

export interface ArticlePayload {
  title: string
  content: string
  author_id: number
}

// types/Auth.ts
export interface User {
  id: number
  email: string
}

export interface LoginPayload {
  email: string
  password: string
}
```