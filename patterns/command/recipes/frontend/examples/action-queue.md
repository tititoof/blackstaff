---
type: Example
title: Command Nuxt — exemple File d'actions optimiste
tags: [nuxt, frontend, command, optimistic-ui, action-queue]
---

# Application du pattern sur une UI optimiste avec file d'actions

Les actions sont appliquées immédiatement côté client (optimistic UI) et
mises en file pour synchronisation backend — si une action échoue, le
rollback est automatique.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Command}` | `ToggleTaskDoneCommand`, `ReorderTaskCommand` |
| `{Receiver}` | `useTaskStore()` + `$fetch` (backend) |
| Invoker | `ActionQueue` |

# ActionQueue — Invoker avec rollback automatique

```ts
// app/commands/tasks/ActionQueue.ts
export interface OptimisticCommand {
  applyOptimistic(): void       // application immédiate côté client
  syncToBackend(): Promise<void>  // synchronisation backend
  rollback(): void              // annulation si backend échoue
  readonly description: string
}

export class ActionQueue {
  private queue: OptimisticCommand[] = []
  private processing = false

  // Enqueue et appliquer immédiatement côté client
  enqueue(command: OptimisticCommand): void {
    command.applyOptimistic()    // ← immédiat, pas d'attente
    this.queue.push(command)
    this.flush()                 // déclencher le traitement async
  }

  // Traiter la file en série
  private async flush(): Promise<void> {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0) {
      const command = this.queue.shift()!
      try {
        await command.syncToBackend()  // ← async, en arrière-plan
      } catch (e) {
        console.error(`[ActionQueue] Sync failed: ${command.description}`, e)
        command.rollback()   // annuler l'application optimiste
        // Vider la file restante (état incohérent après un échec)
        this.queue.forEach(c => c.rollback())
        this.queue = []
        break
      }
    }

    this.processing = false
  }
}
```

# Commands optimistes

```ts
// app/commands/tasks/ToggleTaskDoneCommand.ts
export class ToggleTaskDoneCommand implements OptimisticCommand {
  private previousDone: boolean
  readonly description: string

  constructor(
    private readonly taskId: number,
    private readonly store: ReturnType<typeof useTaskStore>,
  ) {
    const task = store.getById(taskId)
    this.previousDone = task?.done ?? false
    this.description = `Toggle tâche #${taskId}`
  }

  applyOptimistic(): void {
    // Appliquer immédiatement dans le store — pas d'attente réseau
    this.store.setDone(this.taskId, !this.previousDone)
  }

  async syncToBackend(): Promise<void> {
    // Synchroniser avec le backend en arrière-plan
    await $fetch(`/api/tasks/${this.taskId}`, {
      method: 'PATCH',
      body: { done: !this.previousDone },
    })
  }

  rollback(): void {
    // Restaurer l'état précédent si le backend a échoué
    this.store.setDone(this.taskId, this.previousDone)
  }
}

// app/commands/tasks/ReorderTaskCommand.ts
export class ReorderTaskCommand implements OptimisticCommand {
  private previousOrder: number[]
  readonly description: string

  constructor(
    private readonly taskId: number,
    private readonly newPosition: number,
    private readonly store: ReturnType<typeof useTaskStore>,
  ) {
    this.previousOrder = store.taskIds   // snapshot de l'ordre actuel
    this.description   = `Réordonnancement tâche #${taskId}`
  }

  applyOptimistic(): void {
    this.store.reorder(this.taskId, this.newPosition)
  }

  async syncToBackend(): Promise<void> {
    await $fetch(`/api/tasks/${this.taskId}/reorder`, {
      method: 'PATCH',
      body: { position: this.newPosition },
    })
  }

  rollback(): void {
    this.store.restoreOrder(this.previousOrder)
  }
}
```

# Composable

```ts
// app/composables/useOptimisticTasks.ts
import { ActionQueue }           from '~~/commands/tasks/ActionQueue'
import { ToggleTaskDoneCommand } from '~~/commands/tasks/ToggleTaskDoneCommand'
import { ReorderTaskCommand }    from '~~/commands/tasks/ReorderTaskCommand'

export function useOptimisticTasks() {
  const store = useTaskStore()
  const queue = new ActionQueue()

  function toggleDone(taskId: number) {
    queue.enqueue(new ToggleTaskDoneCommand(taskId, store))
    // Retour immédiat — l'UI reflète le changement sans attendre
  }

  function reorder(taskId: number, newPosition: number) {
    queue.enqueue(new ReorderTaskCommand(taskId, newPosition, store))
  }

  return { tasks: computed(() => store.tasks), toggleDone, reorder }
}
```

# Utilisation dans un composant

```vue
<script setup lang="ts">
const { tasks, toggleDone, reorder } = useOptimisticTasks()
</script>

<template>
  <v-list>
    <v-list-item v-for="task in tasks" :key="task.id">
      <!-- Clic → application immédiate + sync background -->
      <v-checkbox
        :model-value="task.done"
        @update:model-value="toggleDone(task.id)"
      />
      {{ task.title }}
    </v-list-item>
  </v-list>
</template>
```

# Avantage UX du pattern

Sans Command + file optimiste :
```
Clic → Attente réseau (300-1500ms) → Mise à jour UI
```

Avec Command + file optimiste :
```
Clic → Mise à jour UI immédiate → Sync backend en arrière-plan
        (l'utilisateur ne perçoit aucune latence)
```

En cas d'échec réseau, le rollback remet l'état à son état précédent — UX
dégradée mais cohérente, pas de données incohérentes.