# Pattern — Médiateur (Mediator)
# Catégorie : Patron comportemental
# Diminue les dépendances chaotiques entre les objets en restreignant leurs communications directes via un objet médiateur.
# Référence : [refactoring.guru/fr/design-patterns/mediator](https://refactoring.guru/fr/design-patterns/mediator)

---

## Quand l'utiliser dans ce projet

- Communication entre composants complexes (ex: formulaire multi-étapes)
- Gestion des événements entre modules indépendants (ex: sidebar, modal, notifications)
- Centralisation de la logique de coordination entre plusieurs services

---

## Template TypeScript — Nuxt 3

### utils/mediators/FormMediator.ts

```typescript
// utils/mediators/FormMediator.ts
// Mediator — coordination entre composants de formulaire

export interface FormComponent {
  setValue(value: any): void
  validate(): boolean
  getValue(): any
}

export class FormMediator {
  private components: Record<string, FormComponent> = {}

  register(name: string, component: FormComponent): void {
    this.components[name] = component
  }

  setFieldValue(field: string, value: any): void {
    if (this.components[field]) {
      this.components[field].setValue(value)
    }
  }

  validateAll(): boolean {
    return Object.values(this.components).every(component => component.validate())
  }

  getFormData(): Record<string, any> {
    const data: Record<string, any> = {}
    Object.entries(this.components).forEach(([name, component]) => {
      data[name] = component.getValue()
    })
    return data
  }

  notifyFieldChanged(field: string): void {
    // Exemple: mettre à jour un champ dépendant
    if (field === 'country') {
      const country = this.components[field].getValue()
      if (country === 'FR') {
        this.setFieldValue('region', 'Île-de-France')
      }
    }
  }
}
```

### Exemple d'utilisation dans un composable

```typescript
// composables/useFormMediator.ts
import { FormMediator } from '~/utils/mediators/FormMediator'

export const useFormMediator = () => {
  const mediator = new FormMediator()

  const registerComponent = (name: string, component: any) => {
    mediator.register(name, {
      setValue: (value: any) => component.value = value,
      validate: () => component.validate(),
      getValue: () => component.value
    })
  }

  const submitForm = () => {
    if (mediator.validateAll()) {
      const data = mediator.getFormData()
      console.log('Données du formulaire:', data)
      // Envoyer à Rails...
    }
  }

  return { mediator, registerComponent, submitForm }
}
```

### Exemple d'utilisation dans une page

```typescript
// pages/forms/complex.vue
<script setup lang="ts">
const { mediator, registerComponent, submitForm } = useFormMediator()

// Composants de formulaire (simplifiés)
const name = ref('')
const country = ref('')
const region = ref('')

// Enregistrement des composants
registerComponent('name', name)
registerComponent('country', country)
registerComponent('region', region)

// Mise à jour automatique des champs dépendants
watch(country, () => {
  mediator.notifyFieldChanged('country')
})
</script>
```

---

## Règles d'utilisation

- Le médiateur centralise toute la logique de communication
- Les composants ne communiquent **que** via le médiateur
- Le médiateur ne contient pas de logique métier, seulement de la coordination
- Chaque composant doit implémenter l'interface `FormComponent`