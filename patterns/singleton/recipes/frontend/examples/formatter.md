---
type: Example
title: Singleton Nuxt — exemple Service formateur (sans état)
tags: [nuxt, frontend, singleton, formatter]
---

# Application du pattern sur un formateur côté Nuxt

Un formateur (devise, date, nombre) sans état — la même instance est
partagée entre tous les composants et composables.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Singleton}` | `CurrencyFormatter` |
| Approche | Module ES (approche A) — le plus simple pour un service sans état |

# Implémentation — Module ES (singleton naturel)

```ts
// app/singletons/currencyFormatter.ts  (v4) ou singletons/ (v3)

const SYMBOLS: Record<string, string> = {
  EUR: '€', USD: '$', GBP: '£', CHF: 'Fr.', JPY: '¥',
}

class CurrencyFormatter {
  private constructor() {}  // constructeur privé

  // Instance unique — lazy init
  private static _instance: CurrencyFormatter | null = null

  static getInstance(): CurrencyFormatter {
    if (!this._instance) this._instance = new CurrencyFormatter()
    return this._instance
  }

  format(
    amount: number,
    currency: string = 'EUR',
    locale: string = 'fr-FR'
  ): string {
    return new Intl.NumberFormat(locale, {
      style:    'currency',
      currency: currency,
    }).format(amount)
  }

  parse(value: string): number {
    return parseFloat(
      value.replace(/[^0-9,.-]/g, '').replace(',', '.')
    )
  }

  formatCompact(amount: number, locale: string = 'fr-FR'): string {
    return new Intl.NumberFormat(locale, {
      notation:          'compact',
      maximumFractionDigits: 1,
    }).format(amount)
  }
}

// Export de l'instance — pas de la classe
export const currencyFormatter = CurrencyFormatter.getInstance()
```

# Composable d'accès (façade réactive si besoin de locale dynamique)

```ts
// app/composables/useCurrencyFormatter.ts
import { currencyFormatter } from '~~/singletons/currencyFormatter'

export function useCurrencyFormatter() {
  // La locale peut être dynamique (préférence utilisateur)
  const { locale } = useI18n()

  function format(amount: number, currency = 'EUR'): string {
    return currencyFormatter.format(amount, currency, locale.value)
  }

  function formatCompact(amount: number): string {
    return currencyFormatter.formatCompact(amount, locale.value)
  }

  function parse(value: string): number {
    return currencyFormatter.parse(value)
  }

  return { format, formatCompact, parse }
}
```

# Utilisation dans un composant

```vue
<script setup lang="ts">
const { format, formatCompact } = useCurrencyFormatter()

const price  = 1999.99
const volume = 1_234_567
</script>

<template>
  <p>Prix : {{ format(price, 'EUR') }}</p>         <!-- 1 999,99 € -->
  <p>Volume : {{ formatCompact(volume) }}</p>       <!-- 1,2 M -->
</template>
```

# Pourquoi un module ES suffit ici

Un formateur sans état est naturellement thread-safe — pas de race
condition possible côté client (JavaScript est mono-thread). L'approche
module ES (singleton naturel) est plus légère qu'un plugin Nuxt pour ce
cas : pas de `useNuxtApp()`, pas de `provide/inject`, juste un import direct.

Utiliser le plugin Nuxt (approche B) uniquement si le formateur a besoin
de `runtimeConfig` ou d'autres contextes Nuxt à l'initialisation.