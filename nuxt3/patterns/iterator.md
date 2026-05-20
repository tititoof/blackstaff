# Pattern — Itérateur (Iterator)
# Catégorie : Patron comportemental
# Permet de parcourir les éléments d’une collection sans révéler sa représentation interne.
# Référence : [refactoring.guru/fr/design-patterns/iterator](https://refactoring.guru/fr/design-patterns/iterator)

---

## Quand l'utiliser dans ce projet

- Parcourir des listes de données paginées (ex: articles, utilisateurs)
- Parcourir des structures de données complexes (ex: arbres de catégories)
- Implémenter des boucles personnalisées pour des collections spécifiques

---

## Template TypeScript — Nuxt 3

### utils/iterators/PaginatedIterator.ts

```typescript
// utils/iterators/PaginatedIterator.ts
// Iterator — parcours de collections paginées

export interface PaginatedCollection<T> {
  data: T[]
  meta: {
    current_page: number
    total_pages: number
    total_items: number
  }
}

export class PaginatedIterator<T> {
  constructor(
    private collection: PaginatedCollection<T>,
    private fetchNextPage: (page: number) => Promise<PaginatedCollection<T>>
  ) {}

  private currentIndex = 0
  private currentPage = 1
  private buffer: T[] = this.collection.data

  async next(): Promise<T | null> {
    if (this.currentIndex >= this.buffer.length) {
      if (this.currentPage >= this.collection.meta.total_pages) {
        return null
      }
      this.currentPage++
      const nextPage = await this.fetchNextPage(this.currentPage)
      this.buffer = nextPage.data
      this.currentIndex = 0
    }

    const item = this.buffer[this.currentIndex]
    this.currentIndex++
    return item
  }

  async hasNext(): Promise<boolean> {
    if (this.currentIndex < this.buffer.length) {
      return true
    }
    return this.currentPage < this.collection.meta.total_pages
  }

  async forEach(callback: (item: T) => void): Promise<void> {
    let item = await this.next()
    while (item !== null) {
      callback(item)
      item = await this.next()
    }
  }
}
```

### Exemple d'utilisation dans un composable

```typescript
// composables/usePaginatedArticles.ts
import { PaginatedIterator } from '~/utils/iterators/PaginatedIterator'
import type { Article, ArticlePaginated } from '~/types/Article'

export const usePaginatedArticles = () => {
  const { apiFetch } = useApi()

  const fetchPage = async (page: number): Promise<ArticlePaginated> => {
    return apiFetch<ArticlePaginated>('/articles', {
      query: { page, per_page: 10 }
    })
  }

  const iterateArticles = async (callback: (article: Article) => void) => {
    const firstPage = await fetchPage(1)
    const iterator = new PaginatedIterator<Article>(firstPage, fetchPage)
    await iterator.forEach(callback)
  }

  return { iterateArticles }
}
```

### Exemple d'utilisation dans une page

```typescript
// pages/articles/index.vue
<script setup lang="ts">
const { iterateArticles } = usePaginatedArticles()

const processAllArticles = async () => {
  await iterateArticles((article) => {
    console.log('Traitement de l\'article:', article.title)
  })
}
</script>
```

---

## Règles d'utilisation

- L'itérateur ne connaît pas la structure interne de la collection
- La méthode `next()` retourne l'élément suivant ou `null` si la fin est atteinte
- La méthode `hasNext()` vérifie s'il reste des éléments
- `forEach()` permet de parcourir toute la collection