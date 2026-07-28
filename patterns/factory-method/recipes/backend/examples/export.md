---
type: Example
title: Factory Method — exemple Export (CSV, PDF, Excel)
tags: [factory-method, export, rails, laravel, symfony]
---

# Application du pattern sur un service d'export

Applique la recipe générique au cas d'un service d'export de données
avec 3 formats : CSV, PDF, Excel.

# Correspondance avec les placeholders génériques

| Placeholder | Valeur concrète |
|---|---|
| `{Domain}` | `Export` |
| `{Product}` | `ExportRenderer` |
| `{Creator}` | `ExportProcessor` |
| `{ConcreteA}` | `Csv` |
| `{ConcreteB}` | `Pdf` |
| `{ConcreteC}` | `Excel` |
| Méthode du produit | `render(data, options)` → contenu du fichier |
| Variable d'env | `EXPORT_FORMAT` (ou paramètre de requête) |

# Interface Produit

```
render(data: array/collection, options: hash/array) → string|binary
  ← contenu du fichier à retourner/sauvegarder
mimeType() → string
  ← 'text/csv', 'application/pdf', 'application/vnd.openxmlformats...'
extension() → string
  ← 'csv', 'pdf', 'xlsx'
```

# Particularités par format

- **CSV** : pas de dépendance externe (natif dans tous les langages),
  le Créateur concret n'a pas besoin de surcharger `execute()`.
- **PDF** : nécessite une librairie externe (Prawn en Rails, DomPDF en
  Laravel, KnpSnappy en Symfony) — à déclarer dans les dépendances du
  projet selon le backend.
- **Excel** : nécessite une librairie externe (caxlsx en Rails, PhpSpreadsheet
  en Laravel/Symfony) — idem.

# Rails — nommage concret

```
app/services/exports/
├── base_export_renderer.rb
│     def render(data:, options: {}) → raise NotImplementedError
│     def mime_type              → raise NotImplementedError
│     def extension              → raise NotImplementedError
├── csv_export_renderer.rb   → render: CSV.generate { ... }
├── pdf_export_renderer.rb   → render: Prawn::Document (gem 'prawn')
├── excel_export_renderer.rb → render: Axlsx::Package  (gem 'caxlsx')
├── base_export_processor.rb
│     def create_export_renderer → raise NotImplementedError
│     def execute(data:, filename:, options: {})
│       renderer = create_export_renderer
│       content  = renderer.render(data: data, options: options)
│       attach_to_storage(filename, content, renderer.mime_type)
│       send_notification(filename)
├── csv_export_processor.rb  → create_export_renderer → CsvExportRenderer.new
├── pdf_export_processor.rb  → create_export_renderer → PdfExportRenderer.new
├── excel_export_processor.rb
└── export_processor_resolver.rb
      IMPLEMENTATIONS = { 'csv' => ..., 'pdf' => ..., 'excel' => ... }
```

# Laravel — nommage concret

```
app/Services/Exports/
├── Contracts/ExportRendererInterface.php
│     render(Collection $data, array $options): string
│     mimeType(): string
│     extension(): string
├── Products/CsvRenderer.php, PdfRenderer.php, ExcelRenderer.php
├── Creators/AbstractExportProcessor.php
│     abstract protected function createExportRenderer(): ExportRendererInterface
│     public function execute(array $args): array
│       $renderer = $this->createExportRenderer()
│       $content  = $renderer->render(collect($args['data']), $args['options'] ?? [])
│       $path     = Storage::put($args['filename'].'.'.$renderer->extension(), $content)
│       return ['path' => $path, 'mime' => $renderer->mimeType()]
├── Creators/CsvExportProcessor.php  → createExportRenderer() → app(CsvRenderer::class)
├── Creators/PdfExportProcessor.php, ExcelExportProcessor.php
└── ExportProcessorFactory.php
      config: config/exports.php → exports.format
```

# Symfony — nommage concret

```
src/Service/Export/
├── Product/ExportRendererInterface.php
├── Product/CsvRenderer.php, PdfRenderer.php, ExcelRenderer.php
├── Creator/AbstractExportProcessor.php
│     abstract protected function createExportRenderer(): ExportRendererInterface
│     public function execute(array $args): array
│       $renderer = $this->createExportRenderer()
│       $content  = $renderer->render($args['data'], $args['options'] ?? [])
│       // sauvegarder ou streamer le contenu
├── Creator/CsvExportProcessor.php, PdfExportProcessor.php, ExcelExportProcessor.php

# config/services.yaml
# parameters: export_format: '%env(EXPORT_FORMAT)%'
# alias: AbstractExportProcessor → '%export_format%ExportProcessor'
```

# Endpoint API attendu

```
POST /api/exports
Body: { format: "csv", data: [...], filename: "rapport-2026" }
Response: { path: "/storage/rapport-2026.csv", mime: "text/csv" }
# ou HTTP stream direct du fichier
```

# Différence avec le cas Paiement

L'Export illustre un cas où **le format est souvent passé en paramètre
de la requête** (pas uniquement via variable d'environnement), donc le
résolveur doit pouvoir le lire depuis `params[:format]` / `$request->get('format')` /
`$request->query->get('format')` plutôt que seulement depuis la config.

Cela n'invalide pas le pattern — le Résolveur reste le seul point de
résolution, mais sa logique intègre également le paramètre de la requête :

```ruby
# Rails
format = params[:format] || ENV.fetch('EXPORT_FORMAT', 'csv')
processor = Exports::ExportProcessorResolver.resolve(format)
```

# Tests à écrire

```
- CsvExportRenderer#render     → vérifie le format CSV ligne par ligne
- PdfExportRenderer#render     → vérifie la présence du header PDF %PDF-
- AbstractExportProcessor#execute → mock renderer, vérifie save + notification
- ExportProcessorResolver      → résout le bon Créateur selon format
```