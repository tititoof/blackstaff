---
type: Example
title: Factory Method Nuxt — exemple Paiement
tags: [nuxt, frontend, factory-method, payment]
---

# Application du pattern sur un service de paiement Nuxt

Applique la recipe générique
[Nuxt](/patterns/factory-method/recipes/frontend/nuxt-factory-method.md)
au cas d'un service de paiement côté frontend.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Domain}` | `Payment` |
| `{Product}` | `PaymentGateway` |
| `{Creator}` | `PaymentProcessor` |
| `{ConcreteA}` | `Stripe` |
| `{ConcreteB}` | `Paypal` |
| `{ConcreteC}` | `Virement` |
| `use{Domain}()` | `usePayment()` |
| Méthode run | `pay({ amount, currency, source, orderId })` |

# Structure concrète des fichiers

```
app/services/payments/
├── types.ts
│     PaymentType = 'stripe' | 'paypal' | 'virement'
│     PaymentResult = { transactionId: string; status: string }
├── products/
│     AbstractPaymentGateway.ts
│       abstract charge(payload): Promise<PaymentResult>
│       abstract refund(txId, amount?): Promise<void>
│     StripeGateway.ts    → POST /api/payments/stripe/charge
│     PaypalGateway.ts    → POST /api/payments/paypal/charge
│     VirementGateway.ts  → POST /api/payments/virement/initiate
├── creators/
│     AbstractPaymentProcessor.ts
│       protected abstract createPaymentGateway(): AbstractPaymentGateway
│       async execute({ amount, currency, source, orderId })
│         → validate → gateway.charge → afterExecute
│     StripePaymentProcessor.ts
│       createPaymentGateway() → new StripeGateway()
│       execute({amount, ...rest}) → super({ amount: amount * 100, ...rest })
│     PaypalPaymentProcessor.ts  → createPaymentGateway() → new PaypalGateway()
│     VirementPaymentProcessor.ts
└── PaymentProcessorResolver.ts
      resolve('stripe') → new StripePaymentProcessor()
app/composables/
└── usePayment.ts
      use{Domain}('stripe') → { loading, error, pay, refund }
```

# Utilisation dans un composant de checkout

```vue
<script setup lang="ts">
const { loading, error, pay } = usePayment()
// usePayment() sans argument → provider depuis runtimeConfig.public.paymentProvider

const form = reactive({ amount: 0, currency: 'EUR', source: '' })
const order = inject('currentOrder')

async function handleCheckout() {
  await pay({
    amount: form.amount,
    currency: form.currency,
    source: form.source,
    orderId: order.id,
  })
  navigateTo('/orders/confirmation')
}
</script>

<template>
  <v-form @submit.prevent="handleCheckout">
    <!-- formulaire de paiement Vuetify -->
    <v-btn type="submit" :loading="loading" color="primary">
      Payer {{ form.amount }}€
    </v-btn>
    <v-alert v-if="error" type="error">{{ error }}</v-alert>
  </v-form>
</template>
```

# Config runtime (nuxt.config.ts)

```ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      paymentProvider: process.env.NUXT_PUBLIC_PAYMENT_PROVIDER ?? 'stripe',
    },
  },
})
```