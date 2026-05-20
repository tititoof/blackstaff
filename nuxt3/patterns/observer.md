# Pattern — Observateur (Observer)
# Catégorie : Patron comportemental
# Met en place un mécanisme de souscription pour envoyer des notifications à plusieurs objets au sujet d’événements concernant les objets qu’ils observent.
# Référence : [refactoring.guru/fr/design-patterns/observer](https://refactoring.guru/fr/design-patterns/observer)

---

## Quand l'utiliser dans ce projet

- Notifications en temps réel (ex: nouvelles données, erreurs)
- Mise à jour de plusieurs composants suite à un changement d'état
- Gestion des événements globaux (ex: changement de thème, langue, connexion)

---

## Template TypeScript — Nuxt 3

### utils/observers/EventBus.ts

```typescript
// utils/observers/EventBus.ts
// Observer — bus d'événements global

type EventCallback<T = any> = (data?: T) => void

export class EventBus {
  private events: Record<string, EventCallback[]> = {}

  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)

    // Retourne une fonction pour se désabonner
    return () => {
      this.events[event] = this.events[event]?.filter(cb => cb !== callback) || []
    }
  }

  publish<T>(event: string, data?: T): void {
    this.events[event]?.forEach(callback => callback(data))
  }

  clear(event?: string): void {
    if (event) {
      delete this.events[event]
    } else {
      this.events = {}
    }
  }
}

// Singleton
export const eventBus = new EventBus()
```

### Exemple d'utilisation dans un composable

```typescript
// composables/useNotifications.ts
import { eventBus } from '~/utils/observers/EventBus'

export const useNotifications = () => {
  const notifications = ref<string[]>([])

  const subscribeToErrors = () => {
    const unsubscribe = eventBus.subscribe('error', (message: string) => {
      notifications.value.push(`Erreur: ${message}`)
    })
    onUnmounted(unsubscribe)
  }

  const publishError = (message: string) => {
    eventBus.publish('error', message)
  }

  return { notifications, subscribeToErrors, publishError }
}
```

### Exemple d'utilisation dans une page

```typescript
// pages/index.vue
<script setup lang="ts">
const { notifications, subscribeToErrors } = useNotifications()

// Abonnement aux erreurs
subscribeToErrors()

// Simulation d'une erreur
const triggerError = () => {
  eventBus.publish('error', 'Une erreur est survenue!')
}
</script>

<template>
  <div>
    <button @click="triggerError">Déclencher une erreur</button>
    <div v-for="(notification, index) in notifications" :key="index">
      {{ notification }}
    </div>
  </div>
</template>
```

---

## Règles d'utilisation

- Les observateurs s'abonnent via `subscribe()` et reçoivent des notifications via `publish()`
- Toujours se désabonner dans `onUnmounted` pour éviter les fuites mémoire
- Le bus d'événements est un **singleton** (une seule instance globale)
- Les données passées via `publish()` sont clônées (pas de référence directe)