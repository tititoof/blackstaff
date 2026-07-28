---
type: Example
title: Builder — exemple Rapport (PDF, CSV)
tags: [builder, report, rails, laravel, symfony]
---

# Application du pattern sur un service de rapport

Construit un rapport complexe avec en-tête, sections, filtres et pied de
page — dans deux représentations : PDF et CSV. Le même Director orchestre
la construction dans les deux cas.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Domain}` | `Report` |
| `{Product}` | `Report` / `CsvReport` |
| `{Builder}Interface` | `ReportBuilderInterface` |
| `{ConcreteA}{Builder}` | `PdfReportBuilder` |
| `{ConcreteB}{Builder}` | `CsvReportBuilder` |
| `{Director}` | `ReportDirector` |
| `stepA` | `addHeader(title, period)` |
| `stepB` | `addSection(data, columns)` |
| `stepC` | `addFooter(totals)` |

# Étapes de construction

```
addHeader(title, period)   ← en-tête : titre + période couverte
addSection(data, columns)  ← corps : données + colonnes à afficher
addFilters(filters)        ← filtres appliqués (optionnel)
addFooter(totals)          ← pied de page : totaux + date de génération
```

# Rails — nommage concret

```
app/builders/reports/
├── report_builder_interface.rb
│     def reset; def add_header(title:, period:); def add_section(data:, columns:)
│     def add_filters(filters: {}); def add_footer(totals: {})
├── pdf_report_builder.rb
│     # utilise la gem 'prawn' ou 'wicked_pdf'
│     def add_header  → @pdf.text title, size: 18
│     def add_section → @pdf.table data.map { ... }
│     def add_footer  → @pdf.text "Généré le #{Date.today}"
│     def get_result  → @pdf.render (retourne un binary String)
├── csv_report_builder.rb
│     # utilise le module CSV natif Ruby
│     def add_header  → @csv << [title, period]
│     def add_section → data.each { |row| @csv << row.values_at(*columns) }
│     def add_footer  → @csv << totals.values
│     def get_result  → @csv_string (retourne une String CSV)
└── report_director.rb
      def build_monthly_sales(builder, data:, period:)
        builder.reset
        builder.add_header(title: 'Ventes mensuelles', period: period)
        builder.add_section(data: data, columns: %i[date product amount])
        builder.add_footer(totals: { total: data.sum(&:amount) })
      end

      def build_summary(builder, data:)
        builder.reset
        builder.add_header(title: 'Résumé', period: 'Tout')
        builder.add_section(data: data, columns: %i[category total])
      end
```

```ruby
# Utilisation dans un controller Rails
def export
  data = Order.for_period(params[:start], params[:end])

  builder  = params[:format] == 'pdf' ?
             Reports::PdfReportBuilder.new :
             Reports::CsvReportBuilder.new
  director = Reports::ReportDirector.new

  director.build_monthly_sales(builder, data: data, period: params[:period])
  result = builder.get_result

  send_data result,
    filename: "rapport.#{params[:format]}",
    type: builder.mime_type,
    disposition: 'attachment'
end
```

# Laravel — nommage concret

```
app/Builders/Reports/
├── Contracts/ReportBuilderInterface.php
│     addHeader(string $title, string $period): static
│     addSection(Collection $data, array $columns): static
│     addFilters(array $filters = []): static
│     addFooter(array $totals = []): static
├── PdfReportBuilder.php   → getResult(): string (binary PDF)
│     # utilise DomPDF ou Snappy
├── CsvReportBuilder.php   → getResult(): string (CSV)
│     # utilise league/csv
└── ReportDirector.php
      public function buildMonthlySales(
          ReportBuilderInterface $builder,
          Collection $data,
          string $period
      ): void {
          $builder->reset()
                  ->addHeader('Ventes mensuelles', $period)
                  ->addSection($data, ['date', 'product', 'amount'])
                  ->addFooter(['total' => $data->sum('amount')]);
      }
```

```php
// Controller Laravel
public function export(Request $request): Response
{
    $data     = Order::forPeriod($request->start, $request->end)->get();
    $builder  = $request->format === 'pdf'
        ? app(PdfReportBuilder::class)
        : app(CsvReportBuilder::class);
    $director = new ReportDirector();

    $director->buildMonthlySales($builder, $data, $request->period);

    return response($builder->getResult())
        ->header('Content-Type', $builder->mimeType())
        ->header('Content-Disposition', 'attachment; filename="rapport.'.$request->format.'"');
}
```

# Symfony — nommage concret

```
src/Builder/Report/
├── ReportBuilderInterface.php
├── PdfReportBuilder.php   # autowire KnpSnappyBundle ou DOMPDFBundle
├── CsvReportBuilder.php   # autowire league/csv
└── ReportDirector.php

# config/services.yaml
# App\Builder\Report\ReportBuilderInterface: alias PdfReportBuilder (défaut)
# App\Builder\Report\ReportDirector: ~
```

```php
// Controller Symfony
#[Route('/reports/export/{format}', methods: ['GET'])]
public function export(
    string $format,
    ReportDirector $director,
    PdfReportBuilder $pdfBuilder,
    CsvReportBuilder $csvBuilder,
    OrderRepository $repo,
): Response {
    $data    = $repo->forPeriod($request->query->get('start'), $request->query->get('end'));
    $builder = $format === 'pdf' ? $pdfBuilder : $csvBuilder;

    $director->buildMonthlySales($builder, $data, $request->query->get('period'));

    return new Response(
        $builder->getResult(),
        200,
        ['Content-Type' => $builder->mimeType(), 'Content-Disposition' => 'attachment']
    );
}
```

# Pourquoi Builder ici et pas Factory Method

Factory Method aurait créé le bon type de rapport selon le format.
Builder est utilisé ici parce que le rapport est construit **en plusieurs
étapes ordonnées** (header → section → footer) et que le Director
encapsule des **recettes réutilisables** (monthly_sales, summary) qui
s'appliquent identiquement à PDF et CSV — seule la représentation finale
change, pas le processus.