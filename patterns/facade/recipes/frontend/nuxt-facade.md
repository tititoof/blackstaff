---
type: Recipe
title: Facade Nuxt — générique
tags: [nuxt, frontend, facade, design-pattern]
---

# Quand utiliser ce pattern

Un composable qui orchestre plusieurs services ou composables pour un cas
d'usage complet — le composant n'appelle qu'une seule fonction et reçoit
tout ce dont il a besoin.

Exemples concrets :
- [Facade de checkout](/patterns/facade/recipes/frontend/examples/checkout-facade.md)
- [Facade d'authentification](/patterns/facade/recipes/frontend/examples/auth-facade.md)

# Dépendances

- [Conventions Nuxt générales](/frameworks/nuxt.md)
- Chemins selon la version : [v3](/frameworks/nuxt/v3.md) / [v4](/frameworks/nuxt/v4.md)

# Structure des fichiers

```
app/composables/
├── use{Facade}.ts             ← le composable Facade (point d'entrée simplifié)
├── use{SubsystemA}.ts         ← composables des sous-systèmes
├── use{SubsystemB}.ts
└── use{SubsystemC}.ts
```

# Le composable Facade

```ts
// composables/use{Facade}.ts
export function use{Facade}() {
  // Instancier les sous-systèmes — la Facade connaît leur existence,
  // les composants ne la connaissent pas
  const {subsystemA} = use{SubsystemA}()
  const {subsystemB} = use{SubsystemB}()
  const {subsystemC} = use{SubsystemC}()

  // État consolidé exposé aux composants
  const loading = ref(false)
  const error   = ref<string | null>(null)
  const result  = ref<{ResultType} | null>(null)

  // Interface simplifiée — une fonction pour le cas d'usage complet
  async function {operation}(params: {ParamsType}): Promise<{ResultType}> {
    loading.value = true
    error.value   = null

    try {
      // Orchestrer les sous-systèmes dans l'ordre correct
      const stepA = await {subsystemA}.{methodA}(params)
      const stepB = await {subsystemB}.{methodB}({ ...params, stepA })
      const stepC = await {subsystemC}.{methodC}({ ...params, stepB })

      result.value = {
        {resultKeyA}: stepA,
        {resultKeyB}: stepB,
        {resultKeyC}: stepC,
      }

      return result.value
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Deuxième opération de haut niveau — même sous-systèmes, cas différent
  async function {otherOperation}(params: {OtherParamsType}): Promise<void> {
    await {subsystemA}.{otherMethod}(params)
    await {subsystemB}.cleanup()
  }

  // Exposer l'état global et les opérations de haut niveau
  // Ne PAS exposer les sous-systèmes individuels
  return {
    loading: readonly(loading),
    error:   readonly(error),
    result:  readonly(result),
    {operation},
    {otherOperation},
  }
}
```

# Avant / Après

```vue
<!-- ❌ Sans Facade — le composant orchestre tout lui-même -->
<script setup lang="ts">
const { validateCart }  = useCart()
const { processPayment } = usePayment()
const { reserveStock }  = useStock()
const { sendConfirm }   = useNotifications()

async function handleCheckout() {
  const cart    = await validateCart(cartId.value)
  const payment = await processPayment(cart, paymentToken.value)
  await reserveStock(cart)
  await sendConfirm(payment)
  navigateTo('/orders/confirmation')
}
</script>

<!-- ✅ Avec Facade — le composant ne sait rien de l'orchestration -->
<script setup lang="ts">
const { checkout, loading, error } = useCheckoutFacade()

async function handleCheckout() {
  await checkout({ cartId: cartId.value, paymentToken: paymentToken.value })
  navigateTo('/orders/confirmation')
}
</script>
```

# Gestion des erreurs dans la Facade

```ts
// La Facade peut enrichir les erreurs avec du contexte métier
async function {operation}(params: {ParamsType}) {
  try {
    const stepA = await {subsystemA}.{methodA}(params)
    return stepA
  } catch (e: any) {
    // Transformer une erreur technique en erreur métier
    if (e.statusCode === 422) throw new Error('{Operation} invalide : ' + e.data?.message)
    if (e.statusCode === 409) throw new Error('{Resource} déjà existante')
    throw e  // erreur inconnue — remonter telle quelle
  }
}
```

# Règles à respecter

- La Facade **agrège des composables**, ne réimplémente pas leur logique.
  Si une étape est complexe, elle appartient dans son composable dédié.
- Exposer `loading`/`error` au niveau de la Facade — pas besoin de les
  exposer depuis chaque sous-système si le composant n'a qu'un état global.
- Ne jamais exposer les sous-systèmes directement (pas de `{ subsystemA }`
  dans le return) — si un composant en a besoin, il importe le composable
  directement, pas via la Facade.
- Un composable Facade est idéal pour les formulaires multi-étapes, les
  wizards, et tout processus qui combine plusieurs actions utilisateur.