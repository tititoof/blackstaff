# Pattern — Composite
# Catégorie : Patron structurel
# Agence les objets en arborescences pour les traiter comme des objets individuels.
# Référence : https://refactoring.guru/fr/design-patterns/composite

---

## Quand l'utiliser dans ce projet

- Construire des menus de navigation hiérarchiques (items avec sous-items)
- Construire des arbres de catégories ou de tags
- Construire des permissions hiérarchiques (groupe > rôle > permission)
- Construire des formulaires composés de sections et sous-sections

---

## Template TypeScript — Nuxt 3

### utils/composite/menuTree.ts

```typescript
// utils/composite/menuTree.ts
// Composite — arbre de navigation avec items simples et groupes

// Interface commune — composant
export interface MenuItem {
  label: string
  icon?: string
  render(): MenuItemRendered
  isLeaf(): boolean
}

export interface MenuItemRendered {
  label: string
  icon?: string
  href?: string
  children?: MenuItemRendered[]
}

// Feuille — item simple sans enfants
export class MenuLeaf implements MenuItem {
  constructor(
    public label: string,
    public href: string,
    public icon?: string
  ) {}

  isLeaf(): boolean {
    return true
  }

  render(): MenuItemRendered {
    return { label: this.label, icon: this.icon, href: this.href }
  }
}

// Composite — groupe avec enfants
export class MenuGroup implements MenuItem {
  private children: MenuItem[] = []

  constructor(
    public label: string,
    public icon?: string
  ) {}

  add(item: MenuItem): this {
    this.children.push(item)
    return this
  }

  remove(label: string): this {
    this.children = this.children.filter(c => c.label !== label)
    return this
  }

  isLeaf(): boolean {
    return false
  }

  render(): MenuItemRendered {
    return {
      label:    this.label,
      icon:     this.icon,
      children: this.children.map(c => c.render())
    }
  }
}

// Builder de menu utilisant le Composite
export class MenuBuilder {
  private items: MenuItem[] = []

  addLeaf(label: string, href: string, icon?: string): this {
    this.items.push(new MenuLeaf(label, href, icon))
    return this
  }

  addGroup(label: string, icon?: string, build?: (group: MenuGroup) => void): this {
    const group = new MenuGroup(label, icon)
    if (build) build(group)
    this.items.push(group)
    return this
  }

  build(): MenuItemRendered[] {
    return this.items.map(item => item.render())
  }
}

export const createMenu = (): MenuBuilder => new MenuBuilder()
```

### composables/useNavigation.ts

```typescript
// composables/useNavigation.ts
// Utilisation du Composite pour construire la navigation
import { createMenu } from '~/utils/composite/menuTree'

export const useNavigation = () => {
  const authStore = useAuthStore()

  const menu = computed(() => {
    const builder = createMenu()
      .addLeaf('Accueil', '/', 'mdi-home')
      .addGroup('Contenu', 'mdi-file-document', group => {
        group
          .add(new (require('~/utils/composite/menuTree').MenuLeaf)('Articles', '/articles', 'mdi-newspaper'))
          .add(new (require('~/utils/composite/menuTree').MenuLeaf)('Projets', '/projects', 'mdi-briefcase'))
      })

    if (authStore.isAuthenticated) {
      builder.addGroup('Administration', 'mdi-cog', group => {
        group
          .add(new (require('~/utils/composite/menuTree').MenuLeaf)('Utilisateurs', '/admin/users', 'mdi-account-group'))
          .add(new (require('~/utils/composite/menuTree').MenuLeaf)('Paramètres', '/admin/settings', 'mdi-tune'))
      })
    }

    return builder.build()
  })

  return { menu }
}
```

### utils/composite/permissionTree.ts

```typescript
// utils/composite/permissionTree.ts
// Composite — arbre de permissions hiérarchiques

export interface Permission {
  name: string
  includes(permission: string): boolean
}

// Feuille — permission atomique
export class AtomicPermission implements Permission {
  constructor(public name: string) {}

  includes(permission: string): boolean {
    return this.name === permission
  }
}

// Composite — groupe de permissions
export class PermissionGroup implements Permission {
  private permissions: Permission[] = []

  constructor(public name: string) {}

  add(permission: Permission): this {
    this.permissions.push(permission)
    return this
  }

  includes(permission: string): boolean {
    // Un groupe inclut une permission si l'un de ses enfants l'inclut
    return this.name === permission ||
      this.permissions.some(p => p.includes(permission))
  }
}

// Définition des permissions du projet
export const PERMISSIONS = {
  admin: new PermissionGroup('admin')
    .add(new AtomicPermission('articles.create'))
    .add(new AtomicPermission('articles.edit'))
    .add(new AtomicPermission('articles.delete'))
    .add(new AtomicPermission('users.manage')),

  editor: new PermissionGroup('editor')
    .add(new AtomicPermission('articles.create'))
    .add(new AtomicPermission('articles.edit')),

  reader: new PermissionGroup('reader')
    .add(new AtomicPermission('articles.read'))
} as const
```

---

## Règles d'utilisation

- Feuilles et groupes implémentent la même interface — le client les traite identiquement
- `render()` ou `includes()` traversent l'arbre récursivement de façon transparente
- Utiliser un Builder pour construire l'arbre — jamais de construction inline dans les composants
- Les arbres pré-définis sont des constantes immuables (`as const`)
- Maximum 3 niveaux de profondeur pour la navigation — au-delà, repenser l'architecture