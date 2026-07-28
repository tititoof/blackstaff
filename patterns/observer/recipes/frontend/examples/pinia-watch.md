---
type: Example
title: Observer Nuxt — exemple Réactivité Pinia (watch de store)
tags: [nuxt, frontend, observer, pinia, watch]
---

# Application du pattern sur un store Pinia observé

Observer un store Pinia pour déclencher des effets de bord (sauvegarde
automatique, synchronisation, notification) à chaque changement d'état.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Subject}` | `useCartStore` (le store Pinia) |
| `{Event}` | Changement d'état du panier |
| `{ObserverA}` | Sauvegarde automatique localStorage |
| `{ObserverB}` | Synchronisation avec le backend |
| `{ObserverC}` | Mise à jour du badge dans la navbar |

# Deux façons d'observer un store Pinia

## Approche A — `watch` sur des propriétés spécifiques (recommandée)

```ts
// app/stores/cartStore.ts
export const useCartStore = defineStore('cart', () => {
  const items   = ref<CartItem[]>([])
  const total   = computed(() => items.value.reduce((s, i) => s + i.price * i.qty, 0))
  const count   = computed(() => items.value.reduce((s, i) => s + i.qty, 0))

  function addItem(item: CartItem)    { /* ... */ }
  function removeItem(id: number)     { /* ... */ }
  function updateQuantity(id: number, qty: number) { /* ... */ }
  function clear()                    { items.value = [] }

  return { items, total, count, addItem, removeItem, updateQuantity, clear }
})

// app/composables/useCartObservers.ts
// Les Observateurs du store panier — enregistrés une seule fois au boot de l'app
export function useCartObservers() {
  const cart = useCartStore()

  // Observateur A : persistance localStorage à chaque changement
  watch(
    () => cart.items,
    (newItems) => {
      if (import.meta.client) {
        localStorage.setItem('cart', JSON.stringify(newItems))
      }
    },
    { deep: true }
  )

  // Observateur B : synchronisation backend debounced (évite les appels trop fréquents)
  const syncToBackend = useDebounceFn(async (items: CartItem[]) => {
    if (!useAuth().isAuthenticated.value) return
    await $fetch('/api/cart/sync', { method: 'POST', body: { items } })
  }, 1000)

  watch(() => cart.items, syncToBackend, { deep: true })

  // Observateur C : analytics — track seulement quand le total change
  watch(
    () => cart.total,
    (newTotal, oldTotal) => {
      if (newTotal > oldTotal) {
        trackEvent('cart_value_increased', { total: newTotal })
      }
    }
  )
}
```

## Approche B — `$subscribe` Pinia (observer toutes les mutations)

```ts
// Pour observer TOUTES les mutations du store (audit, debug, persistance globale)
const cart = useCartStore()

// $subscribe reçoit la mutation et l'état complet après chaque action
cart.$subscribe((mutation, state) => {
  console.log('[CartObserver]', mutation.type, mutation.storeId)

  // Persistance complète après chaque mutation
  if (import.meta.client) {
    localStorage.setItem('cart-state', JSON.stringify(state))
  }
}, { detached: true })  // detached: true = survit au démontage du composant

// Rehydratation au chargement de l'app
cart.$patch(
  JSON.parse(localStorage.getItem('cart-state') ?? '{}')
)
```

# Plugin Nuxt — enregistrement global des Observateurs

```ts
// app/plugins/cart-observers.client.ts
// .client = exécuté uniquement côté client (localStorage, analytics)
export default defineNuxtPlugin(() => {
  const { useCartObservers } = await import('~/composables/useCartObservers')
  useCartObservers()  // Enregistre tous les observateurs une fois au boot
})
```

# Utilisation dans un composant

```vue
<!-- app/components/CartBadge.vue -->
<script setup lang="ts">
// Le composant observe le store implicitement via computed
// — pas besoin de watch ici, Vue le fait nativement
const cart = useCartStore()
</script>

<template>
  <!-- Mis à jour automatiquement dès que cart.count change -->
  <v-badge :content="cart.count" color="primary">
    <v-icon>mdi-cart</v-icon>
  </v-badge>
</template>
```

# Règles critiques

- Toujours utiliser `{ deep: true }` pour observer des tableaux ou objets
  imbriqués — sans ça, `watch` ne détecte pas les mutations internes.
- Toujours `useDebounceFn` ou `useThrottleFn` (VueUse) pour les appels
  API dans les watchers — évite un appel réseau par frappe de touche.
- `$subscribe` avec `{ detached: true }` uniquement pour les observateurs
  globaux (plugins, analytics) — les observateurs de composants doivent
  être nettoyés au démontage (comportement par défaut sans `detached`).
- Protéger toute utilisation de `localStorage` par `if (import.meta.client)`
  — le watcher s'exécute aussi côté serveur en SSR.