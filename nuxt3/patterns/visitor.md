# Pattern — Visiteur (Visitor)
# Catégorie : Patron comportemental
# Permet de séparer les algorithmes et les objets sur lesquels ils opèrent.
# Référence : [refactoring.guru/fr/design-patterns/visitor](https://refactoring.guru/fr/design-patterns/visitor)

---

## Quand l'utiliser dans ce projet

- Ajout de nouvelles opérations sur des structures d'objets complexes (ex: AST, arbres de catégories)
- Éviter de modifier les classes existantes lors de l'ajout de nouvelles fonctionnalités
- Traiter différents types d'objets de manière uniforme

---

## Template TypeScript — Nuxt 3

### utils/visitors/ExportVisitor.ts

```typescript
// utils/visitors/ExportVisitor.ts
// Visitor — export de données dans différents formats

// Éléments à visiter
export interface Article {
  type: 'article'
  title: string
  content: string
  tags: string[]
}

export interface Category {
  type: 'category'
  name: string
  articles: Article[]
}

// Visiteur
export interface ExportVisitor {
  visitArticle(article: Article): string
  visitCategory(category: Category): string
}

// Visiteur pour l'export en Markdown
export class MarkdownExportVisitor implements ExportVisitor {
  visitArticle(article: Article): string {
    return `
# ${article.title}

${article.content}

**Tags:** ${article.tags.join(', ')}
`.trim()
  }

  visitCategory(category: Category): string {
    return `
# Catégorie: ${category.name}

${category.articles.map(article => this.visitArticle(article)).join('\n\n---\n\n')}
`.trim()
  }
}

// Visiteur pour l'export en JSON
export class JsonExportVisitor implements ExportVisitor {
  visitArticle(article: Article): string {
    return JSON.stringify(article, null, 2)
  }

  visitCategory(category: Category): string {
    return JSON.stringify(category, null, 2)
  }
}

// Structure acceptant le visiteur
export interface Visitable {
  accept(visitor: ExportVisitor): string
}

export class ArticleNode implements Visitable {
  constructor(public article: Article) {}

  accept(visitor: ExportVisitor): string {
    return visitor.visitArticle(this.article)
  }
}

export class CategoryNode implements Visitable {
  constructor(public category: Category) {}

  accept(visitor: ExportVisitor): string {
    return visitor.visitCategory(this.category)
  }
}
```

### Exemple d'utilisation dans un composable

```typescript
// composables/useDataExport.ts
import { MarkdownExportVisitor, JsonExportVisitor, ArticleNode, CategoryNode } from '~/utils/visitors/ExportVisitor'
import type { Article, Category } from '~/utils/visitors/ExportVisitor'

export const useDataExport = () => {
  const exportToMarkdown = (data: Article | Category) => {
    const visitor = new MarkdownExportVisitor()
    const node = data.type === 'article'
      ? new ArticleNode(data)
      : new CategoryNode(data)
    return node.accept(visitor)
  }

  const exportToJson = (data: Article | Category) => {
    const visitor = new JsonExportVisitor()
    const node = data.type === 'article'
      ? new ArticleNode(data)
      : new CategoryNode(data)
    return node.accept(visitor)
  }

  return { exportToMarkdown, exportToJson }
}
```

### Exemple d'utilisation dans une page

```typescript
// pages/admin/export.vue
<script setup lang="ts">
const { exportToMarkdown, exportToJson } = useDataExport()

const article: Article = {
  type: 'article',
  title: 'Mon Article',
  content: 'Contenu de l\'article...',
  tags: ['tech', 'nuxt']
}

const category: Category = {
  type: 'category',
  name: 'Technologie',
  articles: [article]
}

const exportMarkdown = () => {
  const markdown = exportToMarkdown(category)
  console.log(markdown)
}

const exportJson = () => {
  const json = exportToJson(category)
  console.log(json)
}
</script>

<template>
  <button @click="exportMarkdown">Exporter en Markdown</button>
  <button @click="exportJson">Exporter en JSON</button>
</template>
```

---

## Règles d'utilisation

- Les classes `ArticleNode` et `CategoryNode` implémentent `accept(visitor)`
- Chaque visiteur implémente toutes les méthodes `visitXxx()`
- Les objets visités ne connaissent pas les algorithmes des visiteurs
- Les visiteurs ne modifient pas les objets visités