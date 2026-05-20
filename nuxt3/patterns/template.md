# Pattern — Patron de méthode (Template Method)
# Catégorie : Patron comportemental
# Met le squelette d’un algorithme dans la classe mère, mais laisse les sous-classes redéfinir certaines étapes de l’algorithme sans changer sa structure.
# Référence : [refactoring.guru/fr/design-patterns/template-method](https://refactoring.guru/fr/design-patterns/template-method)

---

## Quand l'utiliser dans ce projet

- Algorithmes multi-étapes avec des variantes (ex: validation, import/export)
- Éviter la duplication de code entre classes similaires
- Définir un workflow commun avec des étapes personnalisables

---

## Template TypeScript — Nuxt 3

### utils/templates/DataImporter.ts

```typescript
// utils/templates/DataImporter.ts
// Template Method — importation de données

export abstract class DataImporter {
  // Template method (ne change pas)
  async import(file: File): Promise<any[]> {
    this.validateFile(file)
    const rawData = await this.parseFile(file)
    const processedData = this.processData(rawData)
    this.logImport(processedData.length)
    return processedData
  }

  // Étapes à implémenter par les sous-classes
  protected abstract validateFile(file: File): void
  protected abstract parseFile(file: File): Promise<any>
  protected abstract processData(data: any): any[]

  // Méthode optionnelle (peut être redéfinie)
  protected logImport(count: number): void {
    console.log(`Importé ${count} éléments`)
  }
}

export class CsvImporter extends DataImporter {
  protected validateFile(file: File): void {
    if (!file.name.endsWith('.csv')) {
      throw new Error('Le fichier doit être au format CSV')
    }
  }

  protected async parseFile(file: File): Promise<any> {
    const text = await file.text()
    // Parsing CSV simplifié
    return text.split('\n').map(line => line.split(','))
  }

  protected processData(data: any): any[] {
    return data.map((row: any) => ({
      id: row[0],
      name: row[1]
    }))
  }
}

export class JsonImporter extends DataImporter {
  protected validateFile(file: File): void {
    if (!file.name.endsWith('.json')) {
      throw new Error('Le fichier doit être au format JSON')
    }
  }

  protected async parseFile(file: File): Promise<any> {
    const text = await file.text()
    return JSON.parse(text)
  }

  protected processData(data: any): any[] {
    return data.items || []
  }

  protected logImport(count: number): void {
    console.log(`Import JSON: ${count} éléments`)
  }
}
```

### Exemple d'utilisation dans un composable

```typescript
// composables/useDataImport.ts
import { CsvImporter, JsonImporter } from '~/utils/templates/DataImporter'

export const useDataImport = () => {
  const importCsv = async (file: File) => {
    const importer = new CsvImporter()
    return importer.import(file)
  }

  const importJson = async (file: File) => {
    const importer = new JsonImporter()
    return importer.import(file)
  }

  return { importCsv, importJson }
}
```

### Exemple d'utilisation dans une page

```typescript
// pages/admin/import.vue
<script setup lang="ts">
const { importCsv, importJson } = useDataImport()

const handleFileUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    if (file.name.endsWith('.csv')) {
      const data = await importCsv(file)
      console.log('Données CSV importées:', data)
    } else if (file.name.endsWith('.json')) {
      const data = await importJson(file)
      console.log('Données JSON importées:', data)
    }
  } catch (error) {
    console.error('Erreur:', error)
  }
}
</script>

<template>
  <input type="file" @change="handleFileUpload" accept=".csv,.json" />
</template>
```

---

## Règles d'utilisation

- La méthode template (`import()`) est **finale** et ne change pas
- Les étapes abstraites (`validateFile`, `parseFile`, etc.) **doivent** être implémentées
- Les étapes optionnelles (`logImport`) peuvent être redéfinies
- Le squelette de l'algorithme est défini dans la classe mère