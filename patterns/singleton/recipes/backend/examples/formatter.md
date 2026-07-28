---
type: Example
title: Singleton — exemple Service formateur (sans état)
tags: [singleton, formatter, rails, laravel, symfony]
---

# Application du pattern sur un service sans état

Un formateur (devise, date, nombre, adresse) n'a pas d'état mutable —
la même instance peut être partagée en toute sécurité entre toutes les
requêtes et tous les threads.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Singleton}` | `CurrencyFormatter` |
| Méthodes | `format(amount, currency)`, `parse(string)` |

# Rails — module avec `module_function` (le plus simple)

Un service sans état n'a pas besoin d'instance du tout — un module Ruby
avec `module_function` est la solution la plus idiomatique.

```ruby
# app/services/currency_formatter.rb
module CurrencyFormatter
  module_function   # toutes les méthodes suivantes sont publiques ET privées d'instance

  SYMBOLS = { 'EUR' => '€', 'USD' => '$', 'GBP' => '£' }.freeze

  def format(amount, currency: 'EUR', locale: :fr)
    symbol  = SYMBOLS.fetch(currency, currency)
    rounded = amount.round(2)
    case locale
    when :fr then "#{rounded.to_s.sub('.', ',')} #{symbol}"
    else          "#{symbol}#{rounded}"
    end
  end

  def parse(string)
    string.gsub(/[^0-9.,]/, '').sub(',', '.').to_f
  end
end

# Utilisation — pas d'instance, appel direct
CurrencyFormatter.format(1999.99, currency: 'EUR')  # → "2 000,00 €"
CurrencyFormatter.parse('1 234,56 €')               # → 1234.56
```

# Laravel — service léger, binding singleton

```php
// app/Services/CurrencyFormatter.php
class CurrencyFormatter
{
    private const SYMBOLS = ['EUR' => '€', 'USD' => '$', 'GBP' => '£'];

    public function format(float $amount, string $currency = 'EUR', string $locale = 'fr'): string
    {
        $symbol  = self::SYMBOLS[$currency] ?? $currency;
        $rounded = number_format($amount, 2, ',', ' ');
        return match($locale) {
            'fr'    => "{$rounded} {$symbol}",
            default => "{$symbol}{$rounded}",
        };
    }

    public function parse(string $value): float
    {
        return (float) str_replace([' ', ','], ['', '.'],
            preg_replace('/[^0-9,.]/', '', $value)
        );
    }
}

// app/Providers/AppServiceProvider.php
$this->app->singleton(CurrencyFormatter::class);

// Utilisation — injection
class InvoiceController extends Controller
{
    public function __construct(private CurrencyFormatter $formatter) {}

    public function show(Invoice $invoice): JsonResponse
    {
        return response()->json([
            'total' => $this->formatter->format($invoice->total),
        ]);
    }
}
```

# Symfony — service auto-wired (shared: true par défaut)

```php
// src/Service/CurrencyFormatter.php
class CurrencyFormatter
{
    private const SYMBOLS = ['EUR' => '€', 'USD' => '$', 'GBP' => '£'];

    public function format(float $amount, string $currency = 'EUR', string $locale = 'fr'): string
    {
        $symbol  = self::SYMBOLS[$currency] ?? $currency;
        $rounded = number_format($amount, 2, ',', ' ');
        return match($locale) {
            'fr'    => "{$rounded} {$symbol}",
            default => "{$symbol}{$rounded}",
        };
    }

    public function parse(string $value): float
    {
        return (float) str_replace([' ', ','], ['', '.'],
            preg_replace('/[^0-9,.]/', '', $value)
        );
    }
}
// config/services.yaml : auto-wired, shared: true par défaut — c'est tout.
```

```php
// Utilisation dans un controller
class InvoiceController extends AbstractController
{
    public function __construct(private CurrencyFormatter $formatter) {}

    #[Route('/api/invoices/{id}')]
    public function show(Invoice $invoice): JsonResponse
    {
        return $this->json(['total' => $this->formatter->format($invoice->total)]);
    }
}
```

# Twig / Blade — formateur accessible dans les templates

```php
// Symfony : enregistrer comme extension Twig
// src/Twig/CurrencyFormatterExtension.php
class CurrencyFormatterExtension extends AbstractExtension
{
    public function __construct(private CurrencyFormatter $formatter) {}

    public function getFilters(): array
    {
        return [new TwigFilter('currency', [$this->formatter, 'format'])];
    }
}
// Dans un template : {{ invoice.total | currency('EUR') }}
```

```php
// Laravel : Blade directive
// app/Providers/AppServiceProvider.php
Blade::directive('currency', function ($amount) {
    return "<?php echo app(CurrencyFormatter::class)->format($amount); ?>";
});
// Dans un template : @currency($invoice->total)
```

# Pourquoi le Singleton GoF n'est pas nécessaire ici

Un service sans état est intrinsèquement thread-safe — partager l'instance
entre requêtes ne pose aucun risque. Le conteneur DI (Laravel, Symfony) et
le module Ruby gèrent l'unicité de façon plus simple et plus testable que
le pattern GoF classique (constructeur privé, instance statique).