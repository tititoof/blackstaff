---
type: Example
title: Factory Method Nuxt — exemple Export
tags: [nuxt, frontend, factory-method, export]
---

# Application du pattern sur un service d'export Nuxt

Applique la recipe générique au cas d'un déclenchement d'export
depuis le frontend (appel à l'API backend, puis téléchargement du fichier).

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Domain}` | `Export` |
| `{Product}` | `ExportHandler` |
| `{Creator}` | `ExportProcessor` |
| `{ConcreteA}` | `Csv` |
| `{ConcreteB}` | `Pdf` |
| `{ConcreteC}` | `Excel` |
| `use{Domain}()` | `useExport()` |
| Méthode run | `exportData({ data, filename, options })` |

# Rôle du frontend dans ce pattern

Le frontend ne génère pas le fichier lui-même (c'est le backend qui le
produit). Il déclenche la génération via l'API puis gère le téléchargement.
Chaque Produit frontend correspond à un mode de téléchargement différent :

- **CsvExportHandler** → appelle `POST /api/exports`, reçoit un blob, déclenche un téléchargement navigateur.
- **PdfExportHandler** → idem, ouvre dans un nouvel onglet plutôt que télécharger.
- **ExcelExportHandler** → idem que CSV (téléchargement).

# Structure concrète des fichiers

```
app/services/exports/
├── types.ts
│     ExportFormat = 'csv' | 'pdf' | 'excel'
│     ExportOptions = { filename?: string; columns?: string[] }
├── products/
│     AbstractExportHandler.ts
│       abstract handle(data, options): Promise<void>
│     CsvExportHandler.ts
│       handle → POST /api/exports?format=csv → blob → triggerDownload(blob, .csv)
│     PdfExportHandler.ts
│       handle → POST /api/exports?format=pdf → blob → window.open(url, '_blank')
│     ExcelExportHandler.ts
│       handle → POST /api/exports?format=excel → blob → triggerDownload(blob, .xlsx)
├── creators/
│     AbstractExportProcessor.ts
│       protected abstract createExportHandler(): AbstractExportHandler
│       async execute({ data, filename, options })
│         → validate (data non vide)
│         → handler.handle(data, { ...options, filename })
│         → afterExecute (log analytics)
│     CsvExportProcessor.ts   → createExportHandler() → new CsvExportHandler()
│     PdfExportProcessor.ts
│     ExcelExportProcessor.ts
└── ExportProcessorResolver.ts
      resolve(format) → new {Format}ExportProcessor()
app/composables/
└── useExport.ts
      useExport(format?) → { loading, error, exportData }
```

# Utilitaire de téléchargement (partagé entre les Handlers)

```ts
// app/utils/download.ts  (v4) ou utils/download.ts (v3)
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

# Utilisation dans une page de liste

```vue
<script setup lang="ts">
const { loading, error, exportData } = useExport()

async function downloadReport(format: 'csv' | 'pdf' | 'excel') {
  await exportData({
    data: tableRows.value,
    filename: `rapport-${new Date().toISOString().slice(0, 10)}`,
    options: { columns: ['name', 'amount', 'date'] },
  }, format)
}
</script>

<template>
  <v-btn-group>
    <v-btn :loading="loading" @click="downloadReport('csv')">CSV</v-btn>
    <v-btn :loading="loading" @click="downloadReport('pdf')">PDF</v-btn>
    <v-btn :loading="loading" @click="downloadReport('excel')">Excel</v-btn>
  </v-btn-group>
  <v-alert v-if="error" type="error">{{ error }}</v-alert>
</template>
```

# Différence avec le cas Paiement côté Nuxt

Ici le `format` est passé **explicitement** à `useExport(format)` par
le composant (pas depuis runtimeConfig) — parce que l'utilisateur choisit
le format via un bouton, pas depuis une config projet. Le resolver doit
donc accepter ce paramètre en priorité sur la config.