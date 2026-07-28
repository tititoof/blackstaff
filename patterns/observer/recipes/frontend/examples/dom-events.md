---
type: Example
title: Observer Nuxt — exemple Bus d'événements
tags: [nuxt, frontend, observer, event-bus, dom]
---

# Application du pattern sur un bus d'événements

Communication découplée entre composants non liés par parenté, ou entre
un service et des composants, via un bus d'événements Nuxt.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Subject}` | Le service ou composant qui émet l'événement |
| `{Event}` | `'order:created'`, `'user:logged-out'`, `'notification:received'` |
| `{Observer}` | Tout composant abonné à l'événement |

# Implémentation — `useEventBus` (VueUse, natif avec Nuxt)

```ts
// app/composables/useAppEvents.ts
// Typage centralisé de tous les événements de l'application

export interface OrderCreatedPayload {
  orderId: number
  total: number
  customerEmail: string
}

export interface NotificationPayload {
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

// Un composable par type d'événement — évite les collisions de nommage
export function useOrderEvents() {
  const bus = useEventBus<OrderCreatedPayload>('app:order:created')
  return {
    emit:  (payload: OrderCreatedPayload) => bus.emit(payload),
    on:    (handler: (payload: OrderCreatedPayload) => void) => {
      const off = bus.on(handler)
      onUnmounted(off)   // nettoyage automatique
      return off
    },
  }
}

export function useNotificationEvents() {
  const bus = useEventBus<NotificationPayload>('app:notification')
  return {
    emit: (payload: NotificationPayload) => bus.emit(payload),
    on:   (handler: (payload: NotificationPayload) => void) => {
      const off = bus.on(handler)
      onUnmounted(off)
      return off
    },
  }
}
```

# Sujet — service qui émet l'événement

```ts
// app/composables/useOrders.ts
export function useOrders() {
  const { emit: emitOrderCreated } = useOrderEvents()
  const { emit: notify }           = useNotificationEvents()

  async function createOrder(payload: CreateOrderPayload) {
    const order = await $fetch<Order>('/api/orders', {
      method: 'POST',
      body: payload,
    })

    // Notifier tous les Observateurs — sans les connaître
    emitOrderCreated({
      orderId:       order.id,
      total:         order.total,
      customerEmail: order.customer.email,
    })

    notify({ message: 'Commande créée avec succès', type: 'success' })

    return order
  }

  return { createOrder }
}
```

# Observateurs — composants qui réagissent

```vue
<!-- app/components/RecentOrders.vue — se met à jour quand une commande est créée -->
<script setup lang="ts">
const orders = ref<Order[]>([])
const { on }  = useOrderEvents()

// S'abonner à la création de commande
on(async ({ orderId }) => {
  // Recharger la liste dès qu'une commande est créée ailleurs
  const newOrder = await $fetch<Order>(`/api/orders/${orderId}`)
  orders.value.unshift(newOrder)
})

onMounted(async () => {
  orders.value = await $fetch<Order[]>('/api/orders')
})
</script>

<!-- app/components/GlobalNotifications.vue — affiche les notifications -->
<script setup lang="ts">
const notifications = ref<NotificationPayload[]>([])
const { on }        = useNotificationEvents()

on((payload) => {
  notifications.value.push(payload)
  setTimeout(() => {
    notifications.value.shift()
  }, payload.duration ?? 3000)
})
</script>

<template>
  <div class="notifications-container">
    <v-snackbar
      v-for="(n, i) in notifications"
      :key="i"
      :color="n.type"
      :model-value="true"
    >
      {{ n.message }}
    </v-snackbar>
  </div>
</template>
```

# Plugin — abonnements globaux (survivent aux navigations)

```ts
// app/plugins/global-observers.client.ts
export default defineNuxtPlugin(() => {
  const { on } = useOrderEvents()

  // Observateur global : analytics à chaque commande, peu importe la page
  on(({ orderId, total }) => {
    trackConversion({ orderId, revenue: total })
  })
  // Pas de onUnmounted ici — le plugin vit toute la durée de l'app
})
```

# Différence avec les props/emits Vue

| | Props/Emits | Bus d'événements |
|---|---|---|
| Relation | Parent → Enfant (hiérarchie) | N'importe quel composant |
| Couplage | Fort (parent connaît l'enfant) | Faible (émetteur ne connaît pas les abonnés) |
| Quand utiliser | Communication directe parent/enfant | Composants non liés, services → composants |