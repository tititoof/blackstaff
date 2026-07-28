---
type: Example
title: Decorator Nuxt — exemple Wrapper de composant Vue
tags: [nuxt, frontend, decorator, component, hoc]
---

# Application du pattern sur un composant Vue

Enrichir un composant existant avec des comportements transversaux (loading
state, error boundary, permission guard) via un composant wrapper — sans
modifier le composant original.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Component}` | `ProductCard` (composant original) |
| `{DecoratorA}` | `WithLoadingState` (wrapper qui ajoute le skeleton) |
| `{DecoratorB}` | `WithPermission` (wrapper qui vérifie les droits) |

# Implémentation — composants wrapper Vue

```vue
<!-- app/components/decorators/WithLoadingState.vue -->
<!-- Décore n'importe quel composant avec un skeleton de chargement -->
<script setup lang="ts">
const props = defineProps<{
  loading: boolean
  skeletonHeight?: string
}>()
</script>

<template>
  <div>
    <template v-if="props.loading">
      <v-skeleton-loader
        :height="props.skeletonHeight ?? '200px'"
        type="card"
      />
    </template>
    <template v-else>
      <!-- Le composant enveloppé — reçoit tous les slots et props via pass-through -->
      <slot />
    </template>
  </div>
</template>
```

```vue
<!-- app/components/decorators/WithPermission.vue -->
<!-- Décore n'importe quel composant avec une vérification de permission -->
<script setup lang="ts">
const props = defineProps<{
  permission: string
  fallback?: boolean  // afficher un message d'accès refusé ou rien
}>()

const { hasPermission } = usePermissions()
const canAccess = computed(() => hasPermission(props.permission))
</script>

<template>
  <template v-if="canAccess">
    <slot />
  </template>
  <template v-else-if="props.fallback">
    <v-alert type="warning" text="Accès non autorisé" />
  </template>
  <!-- Sinon : rien (composant simplement non rendu) -->
</template>
```

```vue
<!-- app/components/decorators/WithErrorBoundary.vue -->
<!-- Capture les erreurs de rendu et affiche un fallback -->
<script setup lang="ts">
const props = defineProps<{
  errorMessage?: string
}>()

const error = ref<Error | null>(null)

onErrorCaptured((e) => {
  error.value = e
  return false  // empêche la propagation
})
</script>

<template>
  <template v-if="!error">
    <slot />
  </template>
  <v-alert v-else type="error" :text="props.errorMessage ?? 'Une erreur est survenue'" />
</template>
```

# Utilisation — empilement de wrappers

```vue
<!-- app/pages/products/index.vue -->
<script setup lang="ts">
const { products, loading } = useProducts()
</script>

<template>
  <!-- Empilement : Permission → LoadingState → ErrorBoundary → ProductCard -->
  <WithPermission permission="products.view" :fallback="true">
    <WithLoadingState :loading="loading">
      <WithErrorBoundary error-message="Impossible de charger les produits">
        <div v-for="product in products" :key="product.id">
          <ProductCard :product="product" />
        </div>
      </WithErrorBoundary>
    </WithLoadingState>
  </WithPermission>
</template>
```

# Alternative — composable Decorator (pour les comportements sans rendu)

```ts
// app/composables/decorators/withTracking.ts
// Décore un composable d'action avec du tracking analytics
export function withTracking<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  eventName: string
): T {
  return (async (...args) => {
    const result = await fn(...args)
    trackEvent(eventName, { args })
    return result
  }) as T
}

// Utilisation
const { createOrder: rawCreateOrder } = useOrders()
const createOrder = withTracking(rawCreateOrder, 'order_created')
// createOrder a exactement la même signature que rawCreateOrder
// mais loggue en analytics après chaque appel réussi
```

# Différence avec les slots Vue

Les slots Vue (`<slot />`) et les composants wrapper sont deux mécanismes
différents mais complémentaires :

| | Slot | Composant Wrapper (Decorator) |
|---|---|---|
| Relation | Parenté template | Encapsulation comportementale |
| Comportement ajouté | Disposition visuelle | Logique (loading, auth, error) |
| Réutilisabilité | Dans un composant spécifique | Sur n'importe quel composant |

Un composant wrapper **peut** utiliser des slots (`<slot />`) pour passer
le contenu — c'est précisément ce que font `WithLoadingState` et
`WithPermission` ci-dessus.