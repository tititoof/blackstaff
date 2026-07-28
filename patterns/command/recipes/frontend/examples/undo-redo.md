---
type: Example
title: Command Nuxt — exemple Undo/Redo
tags: [nuxt, frontend, command, undo-redo]
---

# Application du pattern sur un éditeur avec undo/redo

Un éditeur de liste de tâches où chaque action (ajout, suppression,
modification) est une Command annulable via Ctrl+Z / Ctrl+Y.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Command}` | `AddTaskCommand`, `DeleteTaskCommand`, `UpdateTaskCommand` |
| `{Receiver}` | `useTaskStore()` (store Pinia) |
| Invoker | `CommandHistory` |

# Modèle et Commands

```ts
// app/commands/tasks/types.ts
export interface Task { id: number; title: string; done: boolean }

export interface TaskCommand {
  execute(): void
  undo(): void
  readonly description: string
}

// app/commands/tasks/AddTaskCommand.ts
export class AddTaskCommand implements TaskCommand {
  private addedTaskId?: number
  readonly description: string

  constructor(
    private readonly title: string,
    private readonly store: ReturnType<typeof useTaskStore>,
  ) {
    this.description = `Ajout : "${title}"`
  }

  execute(): void {
    // Ajouter la tâche et mémoriser son id pour undo
    this.addedTaskId = this.store.add(this.title)
  }

  undo(): void {
    if (this.addedTaskId == null) return
    this.store.remove(this.addedTaskId)
  }
}

// app/commands/tasks/DeleteTaskCommand.ts
export class DeleteTaskCommand implements TaskCommand {
  private deletedTask?: Task    // snapshot pour undo
  readonly description: string

  constructor(
    private readonly taskId: number,
    private readonly store: ReturnType<typeof useTaskStore>,
  ) {
    this.description = `Suppression tâche #${taskId}`
  }

  execute(): void {
    // Capturer l'état avant suppression
    this.deletedTask = { ...this.store.getById(this.taskId) }
    this.store.remove(this.taskId)
  }

  undo(): void {
    if (!this.deletedTask) return
    this.store.restore(this.deletedTask)
  }
}

// app/commands/tasks/UpdateTaskCommand.ts
export class UpdateTaskCommand implements TaskCommand {
  private previousTitle?: string
  readonly description: string

  constructor(
    private readonly taskId: number,
    private readonly newTitle: string,
    private readonly store: ReturnType<typeof useTaskStore>,
  ) {
    this.description = `Modification tâche #${taskId}`
  }

  execute(): void {
    const task = this.store.getById(this.taskId)
    this.previousTitle = task?.title   // snapshot
    this.store.updateTitle(this.taskId, this.newTitle)
  }

  undo(): void {
    if (this.previousTitle == null) return
    this.store.updateTitle(this.taskId, this.previousTitle)
  }
}
```

# Store Pinia (Receiver)

```ts
// app/stores/taskStore.ts
export const useTaskStore = defineStore('tasks', () => {
  const tasks    = ref<Task[]>([])
  let   nextId   = 1

  function add(title: string): number {
    const id = nextId++
    tasks.value.push({ id, title, done: false })
    return id
  }

  function remove(id: number): void {
    tasks.value = tasks.value.filter(t => t.id !== id)
  }

  function restore(task: Task): void {
    tasks.value.push({ ...task })
  }

  function updateTitle(id: number, title: string): void {
    const task = tasks.value.find(t => t.id === id)
    if (task) task.title = title
  }

  function getById(id: number): Task | undefined {
    return tasks.value.find(t => t.id === id)
  }

  return { tasks: readonly(tasks), add, remove, restore, updateTitle, getById }
})
```

# Composable avec CommandHistory

```ts
// app/composables/useTaskEditor.ts
import { CommandHistory }       from '~~/commands/tasks/CommandHistory'
import { AddTaskCommand }       from '~~/commands/tasks/AddTaskCommand'
import { DeleteTaskCommand }    from '~~/commands/tasks/DeleteTaskCommand'
import { UpdateTaskCommand }    from '~~/commands/tasks/UpdateTaskCommand'

export function useTaskEditor() {
  const store   = useTaskStore()
  const history = new CommandHistory()

  const canUndo            = computed(() => history.canUndo)
  const canRedo            = computed(() => history.canRedo)
  const historyDescriptions = computed(() => history.historyDescriptions)

  function addTask(title: string) {
    history.execute(new AddTaskCommand(title, store))
  }

  function deleteTask(id: number) {
    history.execute(new DeleteTaskCommand(id, store))
  }

  function updateTask(id: number, title: string) {
    history.execute(new UpdateTaskCommand(id, title, store))
  }

  // Raccourcis clavier — enregistrés globalement
  useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); history.undo() }
    if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); history.redo() }
  })

  return {
    tasks: computed(() => store.tasks),
    canUndo, canRedo, historyDescriptions,
    addTask, deleteTask, updateTask,
    undo: () => history.undo(),
    redo: () => history.redo(),
  }
}
```

# Composant éditeur

```vue
<!-- app/pages/tasks.vue -->
<script setup lang="ts">
const {
  tasks, canUndo, canRedo, historyDescriptions,
  addTask, deleteTask, updateTask, undo, redo,
} = useTaskEditor()

const newTitle = ref('')
function handleAdd() {
  if (!newTitle.value.trim()) return
  addTask(newTitle.value.trim())
  newTitle.value = ''
}
</script>

<template>
  <div>
    <div class="d-flex gap-2 mb-4">
      <v-btn :disabled="!canUndo" prepend-icon="mdi-undo" @click="undo">
        Annuler
      </v-btn>
      <v-btn :disabled="!canRedo" prepend-icon="mdi-redo" @click="redo">
        Refaire
      </v-btn>
    </div>

    <v-text-field v-model="newTitle" label="Nouvelle tâche"
                  @keyup.enter="handleAdd" />
    <v-btn @click="handleAdd">Ajouter</v-btn>

    <v-list>
      <v-list-item v-for="task in tasks" :key="task.id" :title="task.title">
        <template #append>
          <v-btn icon="mdi-delete" @click="deleteTask(task.id)" />
        </template>
      </v-list-item>
    </v-list>

    <!-- Historique des actions -->
    <v-list density="compact" class="mt-4">
      <v-list-item v-for="(desc, i) in historyDescriptions" :key="i"
                   :title="desc" density="compact" />
    </v-list>
  </div>
</template>
```