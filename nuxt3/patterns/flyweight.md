# Pattern — Poids Mouche (Flyweight)
# Catégorie : Patron structurel
# Partage les états similaires entre de multiples objets pour économiser la RAM.
# Référence : https://refactoring.guru/fr/design-patterns/flyweight

---

## Quand l'utiliser dans ce projet

- Partager les configurations d'icônes ou de styles entre de nombreux composants
- Partager les métadonnées de types de contenu entre des listes d'articles
- Partager les configurations de validation entre de nombreux champs de formulaire
- Mettre en cache les résultats de formatage coûteux (dates, slugs)

---

## Template TypeScript — Nuxt 3

### utils/flyweight/iconRegistry.ts

```typescript
// utils/flyweight/iconRegistry.ts
// Flyweight — partage les configurations d'icônes entre tous les composants

// État intrinsèque — partagé entre toutes les instances du même type
interface IconConfig {
  name: string
  color: string
  size: 'small' | 'default' | 'large'
  ariaLabel: string
}

// Flyweight — objet léger avec état intrinsèque uniquement
class Icon {
  // L'état intrinsèque est partagé — ne jamais le muter
  constructor(private readonly config: Readonly<IconConfig>) {}

  // État extrinsèque passé au moment du rendu (jamais stocké)
  render(externalClass?: string): { icon: string; color: string; size: string; class?: string; ariaLabel: string } {
    return {
      icon:      this.config.name,
      color:     this.config.color,
      size:      this.config.size,
      ariaLabel: this.config.ariaLabel,
      ...(externalClass ? { class: externalClass } : {})
    }
  }
}

// Fabrique Flyweight — gère le pool d'instances partagées
class IconRegistry {
  private pool = new Map<string, Icon>()

  getOrCreate(key: string, config: IconConfig): Icon {
    if (!this.pool.has(key)) {
      this.pool.set(key, new Icon(config))
    }
    return this.pool.get(key)!
  }

  get size(): number {
    return this.pool.size
  }
}

// Instance unique du registry (Singleton + Flyweight)
const registry = new IconRegistry()

// Pré-enregistrement des icônes du projet
export const ICONS = {
  edit:    registry.getOrCreate('edit',    { name: 'mdi-pencil',       color: 'primary', size: 'small', ariaLabel: 'Éditer' }),
  delete:  registry.getOrCreate('delete',  { name: 'mdi-trash-can',    color: 'error',   size: 'small', ariaLabel: 'Supprimer' }),
  add:     registry.getOrCreate('add',     { name: 'mdi-plus',         color: 'primary', size: 'default', ariaLabel: 'Ajouter' }),
  view:    registry.getOrCreate('view',    { name: 'mdi-eye',          color: 'grey',    size: 'small', ariaLabel: 'Voir' }),
  save:    registry.getOrCreate('save',    { name: 'mdi-content-save', color: 'success', size: 'default', ariaLabel: 'Enregistrer' }),
  cancel:  registry.getOrCreate('cancel',  { name: 'mdi-close',        color: 'grey',    size: 'default', ariaLabel: 'Annuler' }),
  loading: registry.getOrCreate('loading', { name: 'mdi-loading',      color: 'primary', size: 'default', ariaLabel: 'Chargement' })
} as const
```

### utils/flyweight/validationRules.ts

```typescript
// utils/flyweight/validationRules.ts
// Flyweight — règles de validation partagées entre tous les formulaires

type ValidationRule = (value: unknown) => true | string

// Flyweight — règle réutilisable avec configuration intrinsèque
class ValidationRuleFlyweight {
  constructor(private readonly fn: ValidationRule) {}

  // La règle elle-même est l'état intrinsèque partagé
  validate(value: unknown): true | string {
    return this.fn(value)
  }
}

// Registry des règles partagées
class ValidationRegistry {
  private pool = new Map<string, ValidationRuleFlyweight>()

  register(key: string, fn: ValidationRule): ValidationRuleFlyweight {
    if (!this.pool.has(key)) {
      this.pool.set(key, new ValidationRuleFlyweight(fn))
    }
    return this.pool.get(key)!
  }

  get(key: string): ValidationRuleFlyweight | undefined {
    return this.pool.get(key)
  }
}

const validationRegistry = new ValidationRegistry()

// Règles intrinsèques partagées — créées une seule fois
const required  = validationRegistry.register('required', v => !!v || 'Champ obligatoire')
const email     = validationRegistry.register('email', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)) || 'Email invalide')

// Factory pour les règles paramétrées — état extrinsèque = le paramètre
export const createRules = {
  required: () => (v: unknown) => required.validate(v),
  email:    () => (v: unknown) => email.validate(v),

  // État extrinsèque passé à la création — la règle de base est partagée
  minLength: (min: number) => (v: unknown) =>
    String(v ?? '').length >= min || `Minimum ${min} caractères`,

  maxLength: (max: number) => (v: unknown) =>
    String(v ?? '').length <= max || `Maximum ${max} caractères`,

  min: (min: number) => (v: unknown) =>
    Number(v) >= min || `Valeur minimum : ${min}`,

  max: (max: number) => (v: unknown) =>
    Number(v) <= max || `Valeur maximum : ${max}`
}
```

### Utilisation dans un composable de formulaire

```typescript
// composables/useArticleForm.ts
import { createRules } from '~/utils/flyweight/validationRules'
import type { CreateArticlePayload } from '~/types/Article'

export const useArticleForm = () => {
  const initialState: CreateArticlePayload = {
    title:     '',
    content:   '',
    author_id: 0
  }

  const form = reactive<CreateArticlePayload>({ ...initialState })

  // Les règles de base (required, minLength) sont des Flyweights partagés
  // Seul le paramètre (min) est spécifique à ce formulaire
  const rules = {
    title:   [createRules.required(), createRules.minLength(5), createRules.maxLength(200)],
    content: [createRules.required(), createRules.minLength(50)]
  }

  const reset = () => Object.assign(form, initialState)

  const isValid = computed(() =>
    Object.entries(rules).every(([key, fieldRules]) =>
      fieldRules.every(rule => rule((form as Record<string, unknown>)[key]) === true)
    )
  )

  return { form, rules, reset, isValid }
}
```

---

## Règles d'utilisation

- L'état intrinsèque (partagé) ne doit JAMAIS être muté après création
- L'état extrinsèque (spécifique au contexte) est passé au moment de l'utilisation
- Le registry est un Singleton — une seule instance pour toute l'application
- Utiliser le Flyweight uniquement quand des milliers d'objets similaires sont créés
- Pour les formulaires, les règles de validation sont des Flyweights naturels