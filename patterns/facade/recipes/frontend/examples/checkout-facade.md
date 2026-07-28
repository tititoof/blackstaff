---
type: Example
title: Facade Nuxt — exemple Checkout
tags: [nuxt, frontend, facade, checkout]
---

# Application du pattern sur le processus de checkout

Le checkout coordonne validation du panier, sélection de livraison,
paiement et confirmation — le composant n'appelle qu'une méthode `checkout()`.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Facade}` | `useCheckoutFacade` |
| `{SubsystemA}` | `useCart` |
| `{SubsystemB}` | `useShipping` |
| `{SubsystemC}` | `usePayment` |
| `{SubsystemD}` | `useOrders` |
| Méthode simplifiée | `checkout({ shippingId, paymentToken })` |

# Le composable Facade

```ts
// app/composables/useCheckoutFacade.ts
export type CheckoutStep = 'idle' | 'validating' | 'shipping' | 'paying' | 'confirming' | 'done'

export function useCheckoutFacade() {
  const cart     = useCart()
  const shipping = useShipping()
  const payment  = usePayment()
  const orders   = useOrders()

  const step    = ref<CheckoutStep>('idle')
  const error   = ref<string | null>(null)
  const orderId = ref<number | null>(null)
  const loading = computed(() => step.value !== 'idle' && step.value !== 'done')

  async function checkout(params: {
    shippingId:   number
    paymentToken: string
  }): Promise<number> {
    error.value   = null
    orderId.value = null

    try {
      // Étape 1 : valider le panier
      step.value = 'validating'
      const validatedCart = await cart.validate()

      // Étape 2 : calculer les frais de livraison
      step.value = 'shipping'
      const shippingCost = await shipping.calculate({
        cartId:     validatedCart.id,
        methodId:   params.shippingId,
      })

      // Étape 3 : traiter le paiement
      step.value = 'paying'
      const paymentResult = await payment.process({
        amount:        validatedCart.total + shippingCost.amount,
        currency:      'EUR',
        paymentToken:  params.paymentToken,
      })

      // Étape 4 : créer la commande
      step.value = 'confirming'
      const order = await orders.create({
        cartId:        validatedCart.id,
        shippingId:    params.shippingId,
        paymentId:     paymentResult.id,
        shippingCost:  shippingCost.amount,
      })

      orderId.value = order.id
      step.value    = 'done'

      // Vider le panier après succès
      await cart.clear()

      return order.id

    } catch (e: any) {
      step.value  = 'idle'
      error.value = mapCheckoutError(e)
      throw e
    }
  }

  function reset() {
    step.value    = 'idle'
    error.value   = null
    orderId.value = null
  }

  return {
    step: readonly(step),
    loading,
    error:   readonly(error),
    orderId: readonly(orderId),
    checkout,
    reset,
  }
}

function mapCheckoutError(e: any): string {
  if (e.statusCode === 422) return 'Informations invalides : ' + (e.data?.message ?? '')
  if (e.statusCode === 402) return 'Paiement refusé — vérifiez vos informations'
  if (e.statusCode === 409) return 'Un article n\'est plus disponible'
  return 'Une erreur est survenue. Veuillez réessayer.'
}
```

# Utilisation dans un composant

```vue
<!-- app/pages/checkout/index.vue -->
<script setup lang="ts">
const { step, loading, error, orderId, checkout } = useCheckoutFacade()
const selectedShipping = ref<number | null>(null)
const paymentToken     = ref('')

async function handleCheckout() {
  if (!selectedShipping.value || !paymentToken.value) return
  const id = await checkout({
    shippingId:   selectedShipping.value,
    paymentToken: paymentToken.value,
  })
  navigateTo(`/orders/${id}/confirmation`)
}
</script>

<template>
  <div>
    <!-- Indicateur d'étapes -->
    <v-stepper :model-value="step">
      <v-stepper-item value="validating" title="Validation" />
      <v-stepper-item value="shipping"   title="Livraison" />
      <v-stepper-item value="paying"     title="Paiement" />
      <v-stepper-item value="confirming" title="Confirmation" />
    </v-stepper>

    <v-alert v-if="error" type="error" :text="error" class="my-4" />

    <!-- Formulaire de checkout -->
    <ShippingSelector v-model="selectedShipping" />
    <PaymentForm v-model:token="paymentToken" />

    <v-btn
      color="primary"
      :loading="loading"
      :disabled="!selectedShipping || !paymentToken"
      @click="handleCheckout"
    >
      Passer commande
    </v-btn>
  </div>
</template>
```

# Ce que la Facade apporte ici

- **État unifié** : `step` expose l'étape courante pour le stepper —
  sans la Facade, chaque sous-système a son propre `loading` et le
  composant doit tous les combiner manuellement.
- **Erreurs métier** : `mapCheckoutError()` centralise la traduction
  des codes HTTP en messages utilisateur lisibles.
- **Orchestration fiable** : l'ordre des étapes (valider → calculer →
  payer → confirmer) est garanti une seule fois, dans la Facade.