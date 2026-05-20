# Pattern — Pont (Bridge)
# Catégorie : Patron structurel
# Sépare une abstraction de son implémentation pour qu'elles évoluent indépendamment.
# Référence : https://refactoring.guru/fr/design-patterns/bridge

---

## Quand l'utiliser dans ce projet

- Séparer la logique d'affichage (abstraction) du système de rendu (implémentation)
- Séparer la logique de validation (abstraction) du moteur de validation (implémentation)
- Séparer la logique d'export (abstraction) du format de sortie (implémentation : PDF, CSV, JSON)
- Séparer la logique de notification (abstraction) du canal d'envoi (implémentation : toast, email, push)

---

## Template TypeScript — Nuxt 3

### utils/bridge/export.ts

```typescript
// utils/bridge/export.ts
// Bridge — sépare la logique d'export du format de sortie

// Implémentation — interface du renderer
export interface ExportRenderer {
  render(data: Record<string, unknown>[], filename: string): void
}

// Implémentations concrètes
class CsvRenderer implements ExportRenderer {
  render(data: Record<string, unknown>[], filename: string): void {
    if (data.length === 0) return

    const headers = Object.keys(data[0]).join(',')
    const rows    = data.map(row =>
      Object.values(row)
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    ).join('\n')

    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = `${filename}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }
}

class JsonRenderer implements ExportRenderer {
  render(data: Record<string, unknown>[], filename: string): void {
    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      { type: 'application/json' }
    )
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = `${filename}.json`
    link.click()
    URL.revokeObjectURL(url)
  }
}

// Abstraction — logique d'export indépendante du format
export abstract class DataExporter {
  constructor(protected renderer: ExportRenderer) {}

  // Méthode commune à toutes les abstractions
  export(data: Record<string, unknown>[], filename: string): void {
    const prepared = this.prepare(data)
    this.renderer.render(prepared, filename)
  }

  // Chaque abstraction concrète prépare les données différemment
  protected abstract prepare(data: Record<string, unknown>[]): Record<string, unknown>[]
}

// Abstraction concrète — export d'articles
export class ArticleExporter extends DataExporter {
  protected prepare(data: Record<string, unknown>[]): Record<string, unknown>[] {
    return data.map(article => ({
      id:        article.id,
      titre:     article.title,
      contenu:   article.content,
      auteur_id: article.author_id,
      créé_le:   article.created_at
    }))
  }
}

// Factory — choisit le renderer selon le format
export type ExportFormat = 'csv' | 'json'

export const createExporter = (
  type: 'article',
  format: ExportFormat
): DataExporter => {
  const renderers: Record<ExportFormat, ExportRenderer> = {
    csv:  new CsvRenderer(),
    json: new JsonRenderer()
  }

  const renderer = renderers[format]

  const exporters: Record<string, new (r: ExportRenderer) => DataExporter> = {
    article: ArticleExporter
  }

  return new exporters[type](renderer)
}
```

### Utilisation dans un composable

```typescript
// composables/useArticleExport.ts
import { createExporter, type ExportFormat } from '~/utils/bridge/export'
import type { Article } from '~/types/Article'

export const useArticleExport = () => {
  const exportArticles = (
    articles: Article[],
    format: ExportFormat = 'csv'
  ) => {
    // Bridge : l'abstraction (ArticleExporter) et le renderer (Csv/Json) évoluent séparément
    const exporter = createExporter('article', format)
    exporter.export(articles as unknown as Record<string, unknown>[], 'articles')
  }

  return { exportArticles }
}
```

### Utilisation dans une page

```vue
<!-- pages/articles/index.vue — section export -->
<script setup lang="ts">
const { exportArticles } = useArticleExport()
const { data } = await useAsyncData('articles', () => list())

// L'abstraction est découplée du format — on peut changer sans toucher la logique
const onExport = (format: 'csv' | 'json') => {
  exportArticles(data.value?.items ?? [], format)
}
</script>

<template>
  <v-btn-group>
    <v-btn @click="onExport('csv')">Export CSV</v-btn>
    <v-btn @click="onExport('json')">Export JSON</v-btn>
  </v-btn-group>
</template>
```

---

## Règles d'utilisation

- L'abstraction contient la logique métier (préparer les données)
- L'implémentation contient le détail technique (rendre les données)
- Les deux hiérarchies évoluent indépendamment — ajouter un format n'impacte pas la logique
- La composition se fait via le constructeur — jamais d'héritage direct entre abstraction et implémentation
- Utiliser une factory function pour assembler abstraction + implémentation