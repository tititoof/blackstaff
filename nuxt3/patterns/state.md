# Pattern — État (State)
# Catégorie : Patron comportemental
# Modifie le comportement d’un objet lorsque son état interne change. L’objet donne l’impression qu’il change de classe.
# Référence : [refactoring.guru/fr/design-patterns/state](https://refactoring.guru/fr/design-patterns/state)

---

## Quand l'utiliser dans ce projet

- Gestion des états d'un composant complexe (ex: formulaire, wizard)
- Changement de comportement en fonction de l'état (ex: bouton "Enregistrer" vs "Modifier")
- Machine à états pour les workflows (ex: validation, publication)

---

## Template TypeScript — Nuxt 3

### utils/states/FormState.ts

```typescript
// utils/states/FormState.ts
// State — gestion des états d'un formulaire

export interface FormContext {
  data: Record<string, any>
  setData: (key: string, value: any) => void
  submit: () => void
  reset: () => void
}

export abstract class FormState {
  abstract handle(context: FormContext): void
}

export class ViewState extends FormState {
  handle(context: FormContext): void {
    console.log('Mode lecture seule')
    // Désactiver les champs, etc.
  }
}

export class EditState extends FormState {
  handle(context: FormContext): void {
    console.log('Mode édition')
    // Activer les champs, etc.
  }
}

export class SubmittingState extends FormState {
  handle(context: FormContext): void {
    console.log('Soumission en cours...')
    // Désactiver les champs, afficher un loader
    context.submit()
  }
}

export class FormContextManager {
  private state: FormState
  private context: FormContext

  constructor(initialState: FormState, context: FormContext) {
    this.state = initialState
    this.context = context
  }

  setState(state: FormState): void {
    this.state = state
    this.state.handle(this.context)
  }

  getState(): FormState {
    return this.state
  }
}
```

### Exemple d'utilisation dans un composable

```typescript
// composables/useFormState.ts
import { FormContextManager, ViewState, EditState, SubmittingState } from '~/utils/states/FormState'

export const useFormState = () => {
  const data = reactive({ title: '', content: '' })
  const context: FormContext = {
    data,
    setData: (key, value) => data[key] = value,
    submit: () => console.log('Soumission...'),
    reset: () => Object.keys(data).forEach(key => data[key] = '')
  }

  const manager = new FormContextManager(new ViewState(), context)

  const setEditMode = () => manager.setState(new EditState())
  const setViewMode = () => manager.setState(new ViewState())
  const setSubmittingMode = () => manager.setState(new SubmittingState())

  return { data, setEditMode, setViewMode, setSubmittingMode }
}
```

### Exemple d'utilisation dans une page

```typescript
// pages/articles/[id].vue
<script setup lang="ts">
const { data, setEditMode, setViewMode, setSubmittingMode } = useFormState()
</script>

<template>
  <div>
    <button @click="setEditMode">Modifier</button>
    <button @click="setViewMode">Annuler</button>
    <button @click="setSubmittingMode">Soumettre</button>
  </div>
</template>
```

---

## Règles d'utilisation

- Chaque état est une classe séparée qui implémente `FormState`
- Le contexte (`FormContext`) est partagé entre tous les états
- Le `FormContextManager` gère le changement d'état
- Les états ne se connaissent pas entre eux