# Pattern — Adaptateur (Adapter)
# Catégorie : Patron structurel
# Fait collaborer des objets ayant des interfaces incompatibles.
# Référence : https://refactoring.guru/fr/design-patterns/adapter

---

## Quand l'utiliser dans ce projet

- Adapter le format de réponse Rails (snake_case) au format Nuxt (camelCase)
- Adapter une librairie externe à l'interface interne du projet
- Adapter un ancien format d'API vers le nouveau sans tout réécrire
- Adapter les données d'un composant tiers au format attendu par les composables

---

## Template TypeScript — Nuxt 3

### utils/adapters/railsAdapter.ts

```typescript
// utils/adapters/railsAdapter.ts
// Adapter — convertit les réponses Rails (snake_case) en format Nuxt (camelCase)

// Format Rails (source)
export interface RailsArticle {
  id: number
  title: string
  content: string
  author_id: number
  created_at: string
  updated_at: string
  is_published: boolean
}

export interface RailsPaginated<T> {
  data: T[]
  meta: {
    current_page: number
    total_count: number
    per_page: number
    total_pages: number
  }
}

// Format interne Nuxt (cible)
export interface Article {
  id: number
  title: string
  content: string
  authorId: number
  createdAt: string
  updatedAt: string
  isPublished: boolean
}

export interface Paginated<T> {
  items: T[]
  meta: {
    page: number
    total: number
    perPage: number
    totalPages: number
  }
}

// Interface de l'adaptateur
export interface ArticleAdapter {
  adapt(raw: RailsArticle): Article
  adaptList(raw: RailsPaginated<RailsArticle>): Paginated<Article>
}

// Implémentation de l'adaptateur
class RailsArticleAdapter implements ArticleAdapter {
  adapt(raw: RailsArticle): Article {
    return {
      id:          raw.id,
      title:       raw.title,
      content:     raw.content,
      authorId:    raw.author_id,
      createdAt:   raw.created_at,
      updatedAt:   raw.updated_at,
      isPublished: raw.is_published
    }
  }

  adaptList(raw: RailsPaginated<RailsArticle>): Paginated<Article> {
    return {
      items: raw.data.map(item => this.adapt(item)),
      meta: {
        page:       raw.meta.current_page,
        total:      raw.meta.total_count,
        perPage:    raw.meta.per_page,
        totalPages: raw.meta.total_pages
      }
    }
  }
}

export const articleAdapter = new RailsArticleAdapter()
```

### Utilisation dans le composable

```typescript
// composables/useArticles.ts
import { articleAdapter } from '~/utils/adapters/railsAdapter'
import type { Article, Paginated } from '~/utils/adapters/railsAdapter'
import type { RailsArticle, RailsPaginated } from '~/utils/adapters/railsAdapter'

export const useArticles = () => {
  const { apiFetch } = useApi()

  const list = async (page = 1): Promise<Paginated<Article>> => {
    // Rails retourne son format natif
    const raw = await apiFetch<RailsPaginated<RailsArticle>>(`/articles?page=${page}`)
    // L'adaptateur convertit en format interne
    return articleAdapter.adaptList(raw)
  }

  const get = async (id: number): Promise<Article> => {
    const raw = await apiFetch<RailsArticle>(`/articles/${id}`)
    return articleAdapter.adapt(raw)
  }

  return { list, get }
}
```

### utils/adapters/dateAdapter.ts

```typescript
// utils/adapters/dateAdapter.ts
// Adapter — interface commune pour différentes librairies de dates

export interface DateAdapter {
  format(date: string, pattern: string): string
  fromNow(date: string): string
  isValid(date: string): boolean
}

// Implémentation avec dayjs (module autorisé : dayjs-nuxt)
class DayjsAdapter implements DateAdapter {
  format(date: string, pattern: string): string {
    return useDayjs()(date).format(pattern)
  }

  fromNow(date: string): string {
    return useDayjs()(date).fromNow()
  }

  isValid(date: string): boolean {
    return useDayjs()(date).isValid()
  }
}

export const dateAdapter = new DayjsAdapter()
```

---

## Règles d'utilisation

- L'adaptateur est la seule couche qui connaît le format externe (Rails)
- Le reste du projet ne connaît que le format interne
- Un adaptateur par domaine source (railsAdapter, thirdPartyAdapter)
- Les adaptateurs sont des singletons exportés directement
- Jamais de conversion snake_case → camelCase éparpillée dans les composables