---
type: Recipe
title: Auth client Nuxt
tags: [nuxt, frontend, auth]
---

# Quand utiliser ce pattern

Toute page Nuxt qui a besoin de connaître l'état de connexion de
l'utilisateur, ou de restreindre l'accès à des pages selon
l'authentification — indépendamment du backend utilisé derrière (Rails,
Laravel, Symfony, ou un backend tiers déjà existant).

# Dépendances

- [Conventions Nuxt générales](/frameworks/nuxt.md)
- [Pinia](/patterns/auth/dependencies/nuxt-pinia.md)

# Fichiers à générer

Les chemins exacts dépendent de la version Nuxt déclarée dans la config
projet :
- [Nuxt 3 — chemins](/frameworks/nuxt/v3.md)
- [Nuxt 4 — chemins](/frameworks/nuxt/v4.md)

# Store

```ts
// stores/auth.ts (v3) ou app/stores/auth.ts (v4)
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = useCookie<string | null>('auth_token', { default: () => null })

  const isAuthenticated = computed(() => !!user.value)

  async function login(credentials: { email: string; password: string }) {
    const { data } = await $fetch<{ user: User; token?: string }>('/api/auth/login', {
      method: 'POST',
      body: credentials,
      credentials: 'include', // nécessaire si backend en mode cookie (Laravel Sanctum SPA)
    })
    user.value = data.user
    if (data.token) token.value = data.token // backends en mode token (Rails, Symfony)
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    user.value = null
    token.value = null
  }

  async function fetchUser() {
    try {
      user.value = await $fetch<User>('/api/auth/me', { credentials: 'include' })
    } catch {
      user.value = null
    }
  }

  return { user, isAuthenticated, login, logout, fetchUser }
})
```

# Composable

```ts
// composables/useAuth.ts (v3) ou app/composables/useAuth.ts (v4)
export function useAuth() {
  const store = useAuthStore()
  return {
    user: computed(() => store.user),
    isAuthenticated: computed(() => store.isAuthenticated),
    login: store.login,
    logout: store.logout,
    register: store.register,
  }
}
```

# Middleware de route

```ts
// middleware/auth.ts (v3) ou app/middleware/auth.ts (v4)
export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated.value && to.path !== '/login') {
    return navigateTo('/login')
  }
})
```

# Adaptation selon le backend

| Backend | Mode | Détail |
|---|---|---|
| Laravel (Sanctum SPA) | Cookie de session | `credentials: 'include'` obligatoire, appeler `/sanctum/csrf-cookie` avant le premier login |
| Rails (Devise + devise-jwt) | Token Bearer | Stocker le token retourné, l'attacher en header `Authorization: Bearer` sur chaque requête suivante |
| Symfony (Lexik JWT) | Token Bearer | Identique à Rails côté client |

Voir la recipe backend correspondante pour le détail exact des endpoints
et du format de réponse attendu.

# Pièges à éviter

- Ne pas dupliquer la logique `$fetch` dans chaque composant — toujours
  passer par le store.
- Toujours appeler `fetchUser()` dans un plugin au boot de l'app
  (`plugins/auth.client.ts`), pour que `isAuthenticated` reflète l'état
  réel côté serveur dès le chargement, pas seulement la présence d'un
  cookie potentiellement expiré.