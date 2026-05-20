# Pattern — Procuration (Proxy)
# Catégorie : Patron structurel
# Fournit un substitut qui contrôle l'accès à l'objet original.
# Référence : https://refactoring.guru/fr/design-patterns/proxy

---

## Quand l'utiliser dans ce projet

- Contrôler l'accès aux appels API selon les permissions de l'utilisateur
- Ajouter du lazy loading pour des ressources coûteuses
- Logger toutes les mutations d'un store avant qu'elles s'exécutent
- Nitro est déjà un Proxy réseau entre le browser et Rails

---

## Template TypeScript — Nuxt 3

### utils/proxy/protectedApiProxy.ts

```typescript
// utils/proxy/protectedApiProxy.ts
// Proxy de protection — contrôle l'accès aux opérations selon les permissions

import type { ApiService } from '~/utils/decorators/apiDecorators'

export type UserRole = 'admin' | 'editor' | 'reader'

export interface PermissionConfig {
  list:   UserRole[]
  get:    UserRole[]
  create: UserRole[]
  update: UserRole[]
  remove: UserRole[]
}

// Proxy de protection
export class ProtectedApiProxy<T> implements ApiService<T> {
  constructor(
    private readonly service: ApiService<T>,
    private readonly permissions: PermissionConfig,
    private readonly getRole: () => UserRole | null
  ) {}

  private checkPermission(operation: keyof PermissionConfig): void {
    const role = this.getRole()
    if (!role || !this.permissions[operation].includes(role)) {
      throw new Error(`[Proxy] Accès refusé : opération "${operation}" non autorisée pour le rôle "${role}"`)
    }
  }

  list(page = 1): Promise<T[]> {
    this.checkPermission('list')
    return this.service.list(page)
  }

  get(id: number): Promise<T> {
    this.checkPermission('get')
    return this.service.get(id)
  }

  create(payload: unknown): Promise<T> {
    this.checkPermission('create')
    return this.service.create(payload)
  }

  update(id: number, payload: unknown): Promise<T> {
    this.checkPermission('update')
    return this.service.update(id, payload)
  }

  remove(id: number): Promise<void> {
    this.checkPermission('remove')
    return this.service.remove(id)
  }
}
```

### utils/proxy/lazyLoadProxy.ts

```typescript
// utils/proxy/lazyLoadProxy.ts
// Proxy de chargement différé — initialise le service au premier accès

export class LazyLoadProxy<T> implements ApiService<T> {
  private instance: ApiService<T> | null = null

  constructor(private readonly factory: () => ApiService<T>) {}

  private getService(): ApiService<T> {
    if (!this.instance) {
      this.instance = this.factory()
    }
    return this.instance
  }

  list(page = 1)              { return this.getService().list(page) }
  get(id: number)             { return this.getService().get(id) }
  create(payload: unknown)    { return this.getService().create(payload) }
  update(id: number, p: unknown) { return this.getService().update(id, p) }
  remove(id: number)          { return this.getService().remove(id) }
}
```

### Utilisation dans un composable

```typescript
// composables/useArticles.ts
import { ProtectedApiProxy, type PermissionConfig } from '~/utils/proxy/protectedApiProxy'
import type { Article, CreateArticlePayload, UpdateArticlePayload } from '~/types/Article'

// Permissions pour les articles
const ARTICLE_PERMISSIONS: PermissionConfig = {
  list:   ['admin', 'editor', 'reader'],
  get:    ['admin', 'editor', 'reader'],
  create: ['admin', 'editor'],
  update: ['admin', 'editor'],
  remove: ['admin']
}

class ArticleService implements ApiService<Article> {
  private apiFetch = useApi().apiFetch

  list(page = 1)                                         { return this.apiFetch<Article[]>(`/articles?page=${page}`) }
  get(id: number)                                        { return this.apiFetch<Article>(`/articles/${id}`) }
  create(payload: CreateArticlePayload)                  { return this.apiFetch<Article>('/articles', { method: 'POST', body: payload }) }
  update(id: number, payload: UpdateArticlePayload)      { return this.apiFetch<Article>(`/articles/${id}`, { method: 'PUT', body: payload }) }
  remove(id: number)                                     { return this.apiFetch<void>(`/articles/${id}`, { method: 'DELETE' }) }
}

export const useArticles = () => {
  const authStore = useAuthStore()

  // Proxy de protection — vérifie les permissions avant chaque opération
  const service = new ProtectedApiProxy<Article>(
    new ArticleService(),
    ARTICLE_PERMISSIONS,
    () => authStore.user?.role as UserRole ?? null
  )

  return {
    list:   (page?: number)               => service.list(page),
    get:    (id: number)                  => service.get(id),
    create: (payload: CreateArticlePayload) => service.create(payload),
    update: (id: number, payload: UpdateArticlePayload) => service.update(id, payload),
    remove: (id: number)                  => service.remove(id)
  }
}
```

### Nitro comme Proxy réseau — rappel du pattern

```typescript
// server/api/articles/index.get.ts
// Nitro EST un Proxy réseau — il contrôle l'accès à Rails
// avant : vérification token, validation
// après : transformation de la réponse si nécessaire

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token  = getCookie(event, 'auth_token')

  // Contrôle d'accès AVANT transmission à Rails
  if (!token) {
    throw createError({ statusCode: 401, message: 'Non authentifié' })
  }

  // Transmission à l'objet réel (Rails)
  return await $fetch(`${config.railsApiBase}/articles`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  // Transformation possible de la réponse APRÈS
})
```

---

## Règles d'utilisation

- Le Proxy implémente la même interface que l'objet réel — le client ne voit pas la différence
- Le contrôle d'accès se fait AVANT la délégation à l'objet réel
- Nitro est le Proxy réseau naturel du projet — ne pas dupliquer cette logique côté client
- Préférer le Proxy de protection pour les vérifications de rôle côté client
- Combiner avec le Décorateur pour logging + protection + cache