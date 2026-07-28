---
type: Example
title: Prototype Nuxt — exemple Entité métier (duplication de commande)
tags: [nuxt, frontend, prototype, entity, order]
---

# Application du pattern sur une commande côté Nuxt

Dupliquer une commande depuis la liste — le frontend clone l'objet
localement, l'envoie au backend pour persistance, puis met à jour la
liste avec la nouvelle commande sauvegardée.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Prototype}` | `Order` |
| `{Child}` | `OrderItem` |
| `id: null` dans le clone | Backend crée un nouvel id |
| Override post-clone | `status: 'draft'`, `reference: null` (généré par le backend) |

# Modèles TypeScript concrets

```ts
// app/models/orderItem.ts
export class OrderItem implements Cloneable<OrderItem> {
  constructor(
    public id: number | null,
    public productId: number,
    public productName: string,
    public quantity: number,
    public unitPrice: number,
  ) {}

  clone(): OrderItem {
    return new OrderItem(
      null,                // id null → création côté backend
      this.productId,
      this.productName,
      this.quantity,
      this.unitPrice,
    )
  }

  static fromApi(data: unknown): OrderItem {
    const d = data as Record<string, unknown>
    return new OrderItem(
      d.id as number,
      d.product_id as number,
      d.product_name as string,
      d.quantity as number,
      d.unit_price as number,
    )
  }

  toApiPayload(): Record<string, unknown> {
    return {
      product_id: this.productId,
      quantity:   this.quantity,
      unit_price: this.unitPrice,
    }
  }

  get total(): number {
    return this.quantity * this.unitPrice
  }
}

// app/models/order.ts
export class Order implements Cloneable<Order> {
  constructor(
    public id: number | null,
    public reference: string | null,
    public status: string,
    public customerId: number,
    public shippingAddress: string,
    public items: OrderItem[],
  ) {}

  clone(): Order {
    return new Order(
      null,                               // id null
      null,                               // reference générée côté backend
      'draft',                            // statut remis à zéro
      this.customerId,
      this.shippingAddress,
      this.items.map(item => item.clone()), // clonage récursif des lignes
    )
  }

  static fromApi(data: unknown): Order {
    const d = data as Record<string, unknown>
    return new Order(
      d.id as number,
      d.reference as string,
      d.status as string,
      d.customer_id as number,
      d.shipping_address as string,
      (d.items as unknown[]).map(OrderItem.fromApi),
    )
  }

  toApiPayload(): Record<string, unknown> {
    return {
      customer_id:      this.customerId,
      shipping_address: this.shippingAddress,
      status:           this.status,
      items:            this.items.map(i => i.toApiPayload()),
    }
  }

  get total(): number {
    return this.items.reduce((sum, item) => sum + item.total, 0)
  }
}
```

# Composable

```ts
// composables/useOrders.ts
import { Order } from '~~/models/order'

export function useOrders() {
  const orders  = ref<Order[]>([])
  const loading = ref(false)
  const error   = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    try {
      const data = await $fetch<unknown[]>('/api/orders')
      orders.value = data.map(Order.fromApi)
    } catch (e: any) { error.value = e.message }
    finally { loading.value = false }
  }

  async function duplicate(original: Order): Promise<Order> {
    // 1. Clone local immédiat — pas d'attente réseau pour l'UX
    const clone = original.clone()

    loading.value = true
    try {
      // 2. Envoyer au backend
      const saved = await $fetch<unknown>('/api/orders', {
        method: 'POST',
        body: clone.toApiPayload(),
      })
      const savedOrder = Order.fromApi(saved as Record<string, unknown>)
      orders.value.push(savedOrder)
      return savedOrder
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false }
  }

  return { orders, loading, error, fetchAll, duplicate }
}
```

# Composant liste avec action dupliquer

```vue
<!-- app/pages/orders/index.vue -->
<script setup lang="ts">
const { orders, loading, duplicate, fetchAll } = useOrders()
onMounted(() => fetchAll())

async function handleDuplicate(order: Order) {
  await duplicate(order)
  // La liste est mise à jour automatiquement
  // L'original n'est pas modifié
}
</script>

<template>
  <v-data-table :items="orders" :loading="loading">
    <template #item.actions="{ item }">
      <v-btn
        size="small"
        :disabled="loading"
        @click="handleDuplicate(item)"
      >
        Dupliquer
      </v-btn>
    </template>
  </v-data-table>
</template>
```