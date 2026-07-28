---
type: Recipe
title: Observer Nuxt — générique
tags: [nuxt, frontend, observer, design-pattern]
---

# Quand utiliser ce pattern

Réagir automatiquement à un changement d'état ou à un événement, sans
coupler le producteur de l'événement aux consommateurs.

Exemples concrets :
- [Réactivité Pinia (watch de store)](/patterns/observer/recipes/frontend/examples/pinia-watch.md)
- [Bus d'événements DOM / Nuxt](/patterns/observer/recipes/frontend/examples/dom-events.md)

# Dépendances

- [Conventions Nuxt générales](/frameworks/nuxt.md)
- Chemins selon la version : [v3](/frameworks/nuxt/v3.md) / [v4](/frameworks/nuxt/v4.md)

# Trois mécanismes Observer natifs en Nuxt/Vue

## Mécanisme 1 — `watch` / `watchEffect` (Observer de réactivité Vue)

Le cas le plus courant en Nuxt. Le Sujet est un `ref` ou `computed`,
l'Observateur est la callback de `watch`.

```ts
// Observer simple : réagir au changement d'une valeur réactive
const count = ref(0)

watch(count, (newVal, oldVal) => {
  // Notifié automatiquement à chaque changement de count
  console.log(`count: ${oldVal} → ${newVal}`)
})

// Observer profond : objets imbriqués
const order = ref<Order>({ status: 'draft', items: [] })

watch(
  () => order.value.status,     // getter = ce qu'on observe précisément
  (newStatus) => {
    if (newStatus === 'confirmed') sendConfirmationEmail(order.value)
  }
)

// watchEffect : observe automatiquement toutes les dépendances lues
watchEffect(() => {
  // Ré-exécuté dès que l'une des valeurs réactives lues ici change
  document.title = `${cartCount.value} articles — Mon shop`
})
```

## Mécanisme 2 — `useEventBus` (bus d'événements explicite)

Pour des communications entre composants non liés par parenté, ou entre
un plugin et des composants.

```ts
// app/composables/use{Event}Bus.ts
// Pattern : un composable par type d'événement

export function use{Event}Bus() {
  const bus = useEventBus<{EventPayload}>('app:{event}')

  function emit(payload: {EventPayload}) {
    bus.emit(payload)
  }

  function on(handler: (payload: {EventPayload}) => void) {
    const unsubscribe = bus.on(handler)
    // Nettoyage automatique quand le composant est démonté
    onUnmounted(unsubscribe)
    return unsubscribe
  }

  return { emit, on }
}
```

## Mécanisme 3 — Observer GoF pur (pour les cas hors Vue réactif)

Pour observer des objets non réactifs (classes TypeScript, données
venues d'une API, services) :

```ts
// app/models/{subject}.ts
type Observer<T> = (event: T) => void

export class {Subject}<TEvent> {
  private observers: Set<Observer<TEvent>> = new Set()

  subscribe(observer: Observer<TEvent>): () => void {
    this.observers.add(observer)
    // Retourne une fonction de désabonnement
    return () => this.observers.delete(observer)
  }

  protected notify(event: TEvent): void {
    this.observers.forEach(observer => observer(event))
  }
}

// Classe concrète qui étend le Sujet
export class {ConcreteSubject} extends {Subject}<{EventType}> {
  private _state: {StateType}

  setState(newState: {StateType}): void {
    this._state = newState
    this.notify({ type: '{event_type}', payload: newState })
  }

  get state(): {StateType} { return this._state }
}
```

# Composable façade (gestion du cycle de vie)

```ts
// app/composables/use{Subject}.ts
export function use{Subject}() {
  const subject = new {ConcreteSubject}()
  const state   = ref<{StateType}>(subject.state)

  // Abonnement avec nettoyage automatique au démontage du composant
  const unsubscribe = subject.subscribe((event) => {
    state.value = event.payload
  })
  onUnmounted(unsubscribe)

  function updateState(newState: {StateType}) {
    subject.setState(newState)
  }

  return { state: readonly(state), updateState }
}
```

# Utilisation dans un composant

```vue
<script setup lang="ts">
const { state, updateState } = use{Subject}()

// L'Observateur est enregistré au montage, retiré au démontage — automatique
</script>

<template>
  <div>{{ state }}</div>
  <button @click="updateState(newValue)">Mettre à jour</button>
</template>
```

# Choisir le bon mécanisme

| Situation | Mécanisme |
|---|---|
| Observer un `ref`/`reactive` Vue | `watch` / `watchEffect` |
| Communication entre composants non liés | `useEventBus` |
| Observer un objet non réactif (classe TS) | Observer GoF pur |
| État global réactif avec observateurs multiples | Pinia `$subscribe` |

# Règles à respecter

- Toujours retourner une fonction de désabonnement depuis `subscribe()`
  et l'appeler dans `onUnmounted()` — les observateurs non retirés
  provoquent des memory leaks et des comportements fantômes.
- Éviter les observateurs qui modifient le Sujet qu'ils observent —
  risque de boucle infinie (`watch` → modifie state → déclenche `watch`...).
  Utiliser `watchEffect` avec précaution pour la même raison.
- En SSR Nuxt, `watch` s'exécute côté serveur — s'assurer que les
  effets de bord (DOM, localStorage) sont protégés par `if (import.meta.client)`.