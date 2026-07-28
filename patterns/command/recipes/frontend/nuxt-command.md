---
type: Recipe
title: Command Nuxt — générique
tags: [nuxt, frontend, command, design-pattern]
---

# Quand utiliser ce pattern

Encapsuler des actions utilisateur en objets pour les rendre annulables
(undo/redo), les mettre en file (optimistic UI), ou les logger pour du
debug/analytics.

Exemples concrets :
- [Undo/Redo d'actions utilisateur](/patterns/command/recipes/frontend/examples/undo-redo.md)
- [File d'actions optimiste](/patterns/command/recipes/frontend/examples/action-queue.md)

# Dépendances

- [Conventions Nuxt générales](/frameworks/nuxt.md)
- Chemins selon la version : [v3](/frameworks/nuxt/v3.md) / [v4](/frameworks/nuxt/v4.md)

# Structure des fichiers

```
app/commands/{domain}s/          ← (v4) ou commands/{domain}s/ (v3)
├── types.ts                     ← interface Command + types
├── {CommandA}.ts                ← Command concrète A
├── {CommandB}.ts                ← Command concrète B
└── CommandHistory.ts            ← Invoker (historique undo/redo)
app/composables/
└── use{Domain}Commands.ts       ← façade pour les composants
```

# Interface Command

```ts
// commands/{domain}s/types.ts
export interface Command<TResult = void> {
  // Exécuter l'action — retourne un résultat
  execute(): Promise<TResult>

  // Annuler l'action — optionnel, implémenter si annulable
  undo?(): Promise<void>

  // Description lisible (pour les logs, l'UI "historique")
  readonly description: string
}
```

# Command concrète

```ts
// commands/{domain}s/{CommandA}.ts
import type { Command } from './types'

export class {CommandA} implements Command<{ResultType}> {
  readonly description = '{CommandA}: {description lisible}'

  // État précédent — capturé à execute() pour undo()
  private previousState?: {StateSnapshot}

  constructor(
    // Paramètres immutables — encapsulés à la création
    private readonly {paramA}: {TypeA},
    private readonly {paramB}: {TypeB},
    // Receiver injecté (service, store Pinia...)
    private readonly receiver: {Receiver},
  ) {}

  async execute(): Promise<{ResultType}> {
    // 1. Capturer l'état avant modification (pour undo)
    this.previousState = await this.receiver.captureState()

    // 2. Exécuter l'action via le Receiver
    return this.receiver.{action}({
      {paramA}: this.{paramA},
      {paramB}: this.{paramB},
    })
  }

  async undo(): Promise<void> {
    if (!this.previousState) throw new Error('Rien à annuler')
    await this.receiver.restoreState(this.previousState)
  }
}
```

# Invoker — historique undo/redo

```ts
// commands/{domain}s/CommandHistory.ts
export class CommandHistory {
  private history: Command[] = []   // stack des commandes exécutées
  private redoStack: Command[] = [] // stack des commandes annulées

  async execute<T>(command: Command<T>): Promise<T> {
    const result = await command.execute()
    this.history.push(command)
    this.redoStack = []   // une nouvelle action efface le redo
    return result
  }

  async undo(): Promise<void> {
    const command = this.history.pop()
    if (!command?.undo) throw new Error('Dernière action non annulable')
    await command.undo()
    this.redoStack.push(command)
  }

  async redo(): Promise<void> {
    const command = this.redoStack.pop()
    if (!command) throw new Error('Rien à refaire')
    const result = await command.execute()
    this.history.push(command)
    return result
  }

  get canUndo(): boolean {
    return this.history.length > 0 && !!this.history.at(-1)?.undo
  }

  get canRedo(): boolean { return this.redoStack.length > 0 }

  get historyDescriptions(): string[] {
    return this.history.map(c => c.description)
  }
}
```

# Composable façade

```ts
// composables/use{Domain}Commands.ts
import { CommandHistory } from '~~/commands/{domain}s/CommandHistory'
import { {CommandA} }     from '~~/commands/{domain}s/{CommandA}'

export function use{Domain}Commands() {
  const history = new CommandHistory()
  const canUndo = computed(() => history.canUndo)
  const canRedo = computed(() => history.canRedo)

  const loading = ref(false)
  const error   = ref<string | null>(null)

  async function execute{CommandA}({paramA}: {TypeA}, {paramB}: {TypeB}) {
    const receiver = use{Receiver}()  // store Pinia ou service injecté
    loading.value  = true
    error.value    = null
    try {
      return await history.execute(
        new {CommandA}({paramA}, {paramB}, receiver)
      )
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function undo() {
    try { await history.undo() }
    catch (e: any) { error.value = e.message }
  }

  async function redo() {
    try { await history.redo() }
    catch (e: any) { error.value = e.message }
  }

  return { canUndo, canRedo, loading, error, execute{CommandA}, undo, redo }
}
```

# Utilisation dans un composant

```vue
<script setup lang="ts">
const { canUndo, canRedo, execute{CommandA}, undo, redo } = use{Domain}Commands()

// Raccourcis clavier undo/redo
useEventListener('keydown', (e: KeyboardEvent) => {
  if (e.ctrlKey && e.key === 'z' && !e.shiftKey) undo()
  if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) redo()
})
</script>

<template>
  <v-btn :disabled="!canUndo" @click="undo">↩ Annuler</v-btn>
  <v-btn :disabled="!canRedo" @click="redo">↪ Refaire</v-btn>
</template>
```

# Règles à respecter

- La Command capture l'état **avant** `execute()` — pas après, sinon `undo()`
  restaure l'état post-modification.
- `undo()` est optionnel — l'interface le déclare avec `?`. Le `CommandHistory`
  vérifie `command.undo` avant de l'appeler.
- `execute()` et `undo()` sont toujours `async` — même si l'action est synchrone,
  ça simplifie la gestion du type de retour dans l'Invoker.
- En Nuxt SSR, les instances de `CommandHistory` sont par composant (pas
  globales) — ne pas les partager via un plugin serveur.