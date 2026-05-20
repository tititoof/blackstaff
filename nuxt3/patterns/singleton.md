# Pattern — Singleton
# Catégorie : Patron de création
# Garantit qu'une classe n'a qu'une seule instance avec un point d'accès global.
# Référence : https://refactoring.guru/fr/design-patterns/singleton
# ⚠️ Accepté si justifié — demander confirmation avant utilisation

---

## Quand l'utiliser dans ce projet

- Store Pinia (déjà un Singleton par nature)
- Cache mémoire partagé entre composables
- Instance de logger centralisé
- Configuration globale de l'application

## Quand NE PAS l'utiliser

- Remplacer un composable qui suffit
- Partager un état qui n'est pas vraiment global
- Éviter de passer des props (mauvaise raison)

---

## Template TypeScript — Nuxt 3

### Dans Nuxt 3 — le Singleton natif via Pinia

```typescript
// stores/useAuthStore.ts
// Pinia est déjà un Singleton — une seule instance par store ID
import type { User } from '~/types/Auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.user
  },

  actions: {
    setUser(user: User) {
      this.user = user
    },
    logout() {
      this.user = null
    }
  }
})
// useAuthStore() retourne toujours la même instance
// C'est le Singleton natif de Pinia
```

### Singleton manuel — Cache mémoire

```typescript
// utils/singleton/memoryCache.ts
// Singleton — cache mémoire partagé entre tous les composables

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

class MemoryCache {
  private static instance: MemoryCache | null = null
  private store = new Map<string, CacheEntry<unknown>>()

  // Constructeur privé — empêche new MemoryCache() direct
  private constructor() {}

  // Point d'accès unique à l'instance
  static getInstance(): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache()
    }
    return MemoryCache.instance
  }

  set<T>(key: string, value: T, ttlMs = 60_000): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    })
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  invalidate(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

// Export de l'instance unique — jamais la classe
export const cache = MemoryCache.getInstance()
```

### Utilisation dans un composable

```typescript
// composables/useArticles.ts
import { cache } from '~/utils/singleton/memoryCache'
import type { ArticlePaginated } from '~/types/Article'

export const useArticles = () => {
  const { apiFetch } = useApi()

  const list = async (page = 1): Promise<ArticlePaginated> => {
    const cacheKey = `articles:page:${page}`

    // Vérifier le cache singleton avant l'appel API
    const cached = cache.get<ArticlePaginated>(cacheKey)
    if (cached) return cached

    const result = await apiFetch<ArticlePaginated>(`/articles?page=${page}`)

    // Stocker en cache — TTL 30 secondes
    cache.set(cacheKey, result, 30_000)

    return result
  }

  const invalidateCache = () => cache.invalidate('articles:page:1')

  return { list, invalidateCache }
}
```

### utils/singleton/logger.ts

```typescript
// utils/singleton/logger.ts
// Singleton — logger centralisé

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private static instance: Logger | null = null
  private isDev: boolean

  private constructor() {
    this.isDev = process.env.NODE_ENV === 'development'
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private log(level: LogLevel, context: string, message: string, data?: unknown): void {
    if (!this.isDev && level === 'debug') return

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      ...(data ? { data } : {})
    }

    const method = level === 'error' ? console.error
      : level === 'warn'  ? console.warn
      : console.log

    method(`[BLACKSTAFF][${context}]`, entry)
  }

  debug(context: string, message: string, data?: unknown): void {
    this.log('debug', context, message, data)
  }

  info(context: string, message: string, data?: unknown): void {
    this.log('info', context, message, data)
  }

  warn(context: string, message: string, data?: unknown): void {
    this.log('warn', context, message, data)
  }

  error(context: string, message: string, data?: unknown): void {
    this.log('error', context, message, data)
  }
}

export const logger = Logger.getInstance()
```

---

## Règles d'utilisation

- Le constructeur est TOUJOURS privé pour empêcher `new` direct
- `getInstance()` est le seul point d'accès
- Exporter l'instance, jamais la classe (`export const cache = ...`)
- Préférer Pinia pour l'état global — le Singleton manuel uniquement pour les utilitaires
- Documenter POURQUOI un Singleton est nécessaire dans le commentaire du fichier