# Pattern — Fabrique (Factory Method)
# Catégorie : Patron de création
# Définit une interface pour la création d'objets, délègue aux sous-classes le choix du type.
# Référence : https://refactoring.guru/fr/design-patterns/factory-method

---

## Quand l'utiliser dans ce projet

- Créer différents types de notifications (email, toast, push)
- Créer différents types de validators selon le domaine
- Créer différents types de formatters selon le contexte
- Créer différents renderers de composants selon le type de contenu

---

## Template TypeScript — Nuxt 3

### utils/factories/notificationFactory.ts

```typescript
// utils/factories/notificationFactory.ts
// Factory Method — création de notifications selon le type

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  type: NotificationType
  title: string
  message: string
  duration: number
  show(): void
}

// Produit abstrait
abstract class BaseNotification implements Notification {
  abstract type: NotificationType
  abstract duration: number

  constructor(
    public title: string,
    public message: string
  ) {}

  show(): void {
    console.log(`[${this.type.toUpperCase()}] ${this.title}: ${this.message}`)
  }
}

// Produits concrets
class SuccessNotification extends BaseNotification {
  type: NotificationType = 'success'
  duration = 3000
}

class ErrorNotification extends BaseNotification {
  type: NotificationType = 'error'
  duration = 6000
}

class WarningNotification extends BaseNotification {
  type: NotificationType = 'warning'
  duration = 4000
}

class InfoNotification extends BaseNotification {
  type: NotificationType = 'info'
  duration = 3000
}

// Factory Method
export const createNotification = (
  type: NotificationType,
  title: string,
  message: string
): Notification => {
  const map: Record<NotificationType, new (t: string, m: string) => Notification> = {
    success: SuccessNotification,
    error:   ErrorNotification,
    warning: WarningNotification,
    info:    InfoNotification
  }
  return new map[type](title, message)
}
```

### composables/useNotification.ts

```typescript
// composables/useNotification.ts
// Utilisation du Factory Method pour les notifications
import { createNotification, type NotificationType } from '~/utils/factories/notificationFactory'

export const useNotification = () => {
  const notify = (type: NotificationType, title: string, message: string) => {
    const notification = createNotification(type, title, message)
    notification.show()
    // Intégration Vuetify Snackbar ou autre système de notification
  }

  const success = (message: string) => notify('success', 'Succès', message)
  const error   = (message: string) => notify('error', 'Erreur', message)
  const warning = (message: string) => notify('warning', 'Attention', message)
  const info    = (message: string) => notify('info', 'Information', message)

  return { notify, success, error, warning, info }
}
```

---

## Règles d'utilisation

- La factory centralise la logique de création — jamais de `new` direct dans les composables ou pages
- Chaque type concret étend la classe abstraite et implémente ses spécificités
- La factory retourne toujours l'interface, jamais la classe concrète
- Utilisé via un composable — jamais appelé directement dans les composants