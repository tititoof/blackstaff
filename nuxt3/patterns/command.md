# Pattern — Monteur (Builder)
# Catégorie : Patron de création
# Construit des objets complexes étape par étape.
# Référence : https://refactoring.guru/fr/design-patterns/builder

---

## Quand l'utiliser dans ce projet

- Construire des requêtes API complexes avec filtres, pagination, tri
- Construire des objets de configuration de formulaire étape par étape
- Construire des payloads complexes avant envoi à Rails
- Construire des objets de configuration de graphiques (Chart.js, etc.)

---

## Template TypeScript — Nuxt 3

### utils/builders/queryBuilder.ts

```typescript
// utils/builders/queryBuilder.ts
// Builder — construction de requêtes API complexes étape par étape

export interface ApiQuery {
  page: number
  perPage: number
  sortBy: string
  sortOrder: 'asc' | 'desc'
  filters: Record<string, string | number | boolean>
  search: string
}

// Builder
export class QueryBuilder {
  private query: ApiQuery = {
    page:      1,
    perPage:   10,
    sortBy:    'created_at',
    sortOrder: 'desc',
    filters:   {},
    search:    ''
  }

  withPage(page: number): this {
    this.query.page = page
    return this
  }

  withPerPage(perPage: number): this {
    this.query.perPage = Math.min(perPage, 100) // sécurité max 100
    return this
  }

  withSort(field: string, order: 'asc' | 'desc' = 'asc'): this {
    this.query.sortBy    = field
    this.query.sortOrder = order
    return this
  }

  withFilter(key: string, value: string | number | boolean): this {
    this.query.filters[key] = value
    return this
  }

  withSearch(search: string): this {
    this.query.search = search.trim()
    return this
  }

  build(): ApiQuery {
    return { ...this.query }
  }

  // Convertit en query params pour $fetch
  toParams(): Record<string, string | number | boolean> {
    const params: Record<string, string | number | boolean> = {
      page:     this.query.page,
      per_page: this.query.perPage,
      sort_by:  this.query.sortBy,
      sort_order: this.query.sortOrder
    }

    if (this.query.search) {
      params.search = this.query.search
    }

    Object.entries(this.query.filters).forEach(([key, value]) => {
      params[key] = value
    })

    return params
  }
}

// Helper factory pour instancier le builder
export const createQuery = (): QueryBuilder => new QueryBuilder()
```

### Exemple d'utilisation dans un composable

```typescript
// composables/useArticles.ts
import { createQuery } from '~/utils/builders/queryBuilder'
import type { Article, ArticlePaginated } from '~/types/Article'

export const useArticles = () => {
  const { apiFetch } = useApi()

  const list = (options?: {
    page?: number
    search?: string
    status?: string
    sortBy?: string
  }) => {
    // Builder construit la requête étape par étape
    const query = createQuery()
      .withPage(options?.page ?? 1)
      .withPerPage(10)
      .withSort(options?.sortBy ?? 'created_at', 'desc')

    if (options?.search) {
      query.withSearch(options.search)
    }

    if (options?.status) {
      query.withFilter('status', options.status)
    }

    return apiFetch<ArticlePaginated>('/articles', {
      query: query.toParams()
    })
  }

  return { list }
}
```

### utils/builders/formConfigBuilder.ts

```typescript
// utils/builders/formConfigBuilder.ts
// Builder — construction de configuration de formulaire

export interface FieldConfig {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'email'
  required: boolean
  minLength?: number
  maxLength?: number
  options?: { value: string | number; label: string }[]
}

export interface FormConfig {
  fields: FieldConfig[]
  submitLabel: string
  cancelLabel: string
  resetOnSubmit: boolean
}

export class FormConfigBuilder {
  private config: FormConfig = {
    fields:        [],
    submitLabel:   'Enregistrer',
    cancelLabel:   'Annuler',
    resetOnSubmit: false
  }

  addTextField(key: string, label: string, options?: { required?: boolean; minLength?: number; maxLength?: number }): this {
    this.config.fields.push({
      key,
      label,
      type:      'text',
      required:  options?.required  ?? false,
      minLength: options?.minLength,
      maxLength: options?.maxLength
    })
    return this
  }

  addTextareaField(key: string, label: string, options?: { required?: boolean; minLength?: number }): this {
    this.config.fields.push({
      key,
      label,
      type:      'textarea',
      required:  options?.required  ?? false,
      minLength: options?.minLength
    })
    return this
  }

  addSelectField(key: string, label: string, selectOptions: { value: string | number; label: string }[], required = false): this {
    this.config.fields.push({
      key,
      label,
      type:     'select',
      required,
      options:  selectOptions
    })
    return this
  }

  withSubmitLabel(label: string): this {
    this.config.submitLabel = label
    return this
  }

  withResetOnSubmit(): this {
    this.config.resetOnSubmit = true
    return this
  }

  build(): FormConfig {
    return { ...this.config, fields: [...this.config.fields] }
  }
}

export const createFormConfig = (): FormConfigBuilder => new FormConfigBuilder()
```

---

## Règles d'utilisation

- Le builder ne construit qu'un seul type d'objet complexe
- Chaque méthode retourne `this` pour permettre le chaînage fluide
- `build()` est toujours la dernière méthode appelée
- Le builder est instancié via une factory function (`createQuery()`) — pas de `new` direct dans les composables
- Jamais de logique conditionnelle complexe dans les pages — toujours dans le builder