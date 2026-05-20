# Pattern — Décorateur (Decorator)
# Catégorie : Patron structurel
# Affecte dynamiquement de nouveaux comportements à des objets via des emballeurs.
# Référence : https://refactoring.guru/fr/design-patterns/decorator

---

## Quand l'utiliser dans ce projet

- Ajouter du logging à un composable sans modifier son code
- Ajouter du caching à un service d'API sans modifier sa logique
- Ajouter de la validation à un appel API existant
- Ajouter de la gestion d'erreur enrichie autour d'un composable

---

## Template TypeScript — Nuxt 3

### utils/decorators/apiDecorators.ts

```typescript
// utils/decorators/apiDecorators.ts
// Decorator — enrichit les appels API sans modifier leur logique

// Interface commune
export interface ApiService<T> {
  list(page?: number): Promise<T[]>
  get(id: number): Promise<T>
  create(payload: unknown): Promise<T>
  update(id: number, payload: unknown): Promise<T>
  remove(id: number): Promise<void>
}

// Décorateur de base — délègue à l'implémentation wrappée
export abstract class ApiServiceDecorator<T> implements ApiService<T> {
  constructor(protected wrapped: ApiService<T>) {}

  list(page = 1): Promise<T[]>         { return this.wrapped.list(page) }
  get(id: number): Promise<T>          { return this.wrapped.get(id) }
  create(payload: unknown): Promise<T> { return this.wrapped.create(payload) }
  update(id: number, payload: unknown): Promise<T> { return this.wrapped.update(id, payload) }
  remove(id: number): Promise<void>    { return this.wrapped.remove(id) }
}

// Décorateur de logging
export class LoggingDecorator<T> extends ApiServiceDecorator<T> {
  constructor(wrapped: ApiService<T>, private context: string) {
    super(wrapped)
  }

  async list(page = 1): Promise<T[]> {
    console.info(`[${this.context}] list(page=${page})`)
    const result = await this.wrapped.list(page)
    console.info(`[${this.context}] list → ${result.length} items`)
    return result
  }

  async create(payload: unknown): Promise<T> {
    console.info(`[${this.context}] create`, payload)
    const result = await this.wrapped.create(payload)
    console.info(`[${this.context}] create → OK`)
    return result
  }
}

// Décorateur de cache
export class CachingDecorator<T> extends ApiServiceDecorator<T> {
  private cache = new Map<string, { data: unknown; expiresAt: number }>()

  constructor(wrapped: ApiService<T>, private ttlMs = 30_000) {
    super(wrapped)
  }

  private getCached<R>(key: string): R | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) { this.cache.delete(key); return null }
    return entry.data as R
  }

  private setCached(key: string, data: unknown): void {
    this.cache.set(key, { data, expiresAt: Date.now() + this.ttlMs })
  }

  async list(page = 1): Promise<T[]> {
    const key    = `list:${page}`
    const cached = this.getCached<T[]>(key)
    if (cached) return cached
    const result = await this.wrapped.list(page)
    this.setCached(key, result)
    return result
  }

  async get(id: number): Promise<T> {
    const key    = `get:${id}`
    const cached = this.getCached<T>(key)
    if (cached) return cached
    const result = await this.wrapped.get(id)
    this.setCached(key, result)
    return result
  }
}

// Décorateur de retry
export class RetryDecorator<T> extends ApiServiceDecorator<T> {
  constructor(wrapped: ApiService<T>, private maxRetries = 3, private delayMs = 1000) {
    super(wrapped)
  }

  private async withRetry<R>(fn: () => Promise<R>): Promise<R> {
    let lastError: unknown
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.delayMs * attempt))
        }
      }
    }
    throw lastError
  }

  list(page = 1): Promise<T[]>         { return this.withRetry(() => this.wrapped.list(page)) }
  get(id: number): Promise<T>          { return this.withRetry(() => this.wrapped.get(id)) }
  create(payload: unknown): Promise<T> { return this.withRetry(() => this.wrapped.create(payload)) }
}
```

### Utilisation dans un composable

```typescript
// composables/useArticles.ts
import {
  LoggingDecorator,
  CachingDecorator,
  RetryDecorator,
  type ApiService
} from '~/utils/decorators/apiDecorators'
import type { Article, CreateArticlePayload } from '~/types/Article'

// Service de base
class ArticleService implements ApiService<Article> {
  private apiFetch = useApi().apiFetch

  list(page = 1)                               { return this.apiFetch<Article[]>(`/articles?page=${page}`) }
  get(id: number)                              { return this.apiFetch<Article>(`/articles/${id}`) }
  create(payload: CreateArticlePayload)        { return this.apiFetch<Article>('/articles', { method: 'POST', body: payload }) }
  update(id: number, payload: Partial<CreateArticlePayload>) { return this.apiFetch<Article>(`/articles/${id}`, { method: 'PUT', body: payload }) }
  remove(id: number)                           { return this.apiFetch<void>(`/articles/${id}`, { method: 'DELETE' }) }
}

export const useArticles = () => {
  // Empiler les décorateurs selon le besoin
  const base    = new ArticleService()
  const retried = new RetryDecorator(base, 3)
  const cached  = new CachingDecorator(retried, 30_000)
  const service = new LoggingDecorator(cached, 'Articles')

  return {
    list:   (page?: number)                              => service.list(page),
    get:    (id: number)                                 => service.get(id),
    create: (payload: CreateArticlePayload)              => service.create(payload),
    update: (id: number, payload: Partial<CreateArticlePayload>) => service.update(id, payload),
    remove: (id: number)                                 => service.remove(id)
  }
}
```

---

## Règles d'utilisation

- Chaque décorateur a une seule responsabilité (logging OU cache OU retry)
- Les décorateurs s'empilent — l'ordre compte (retry → cache → logging)
- Le décorateur de base délègue tout à l'objet wrappé
- Jamais de logique métier dans un décorateur — uniquement des comportements transversaux
- En production, choisir uniquement les décorateurs nécessaires