---
type: Example
title: Factory Method Nuxt — exemple Notification
tags: [nuxt, frontend, factory-method, notification]
---

# Application du pattern sur un service de notification Nuxt

Applique la recipe générique au cas d'un déclenchement de notification
depuis le frontend.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Domain}` | `Notification` |
| `{Product}` | `NotificationChannel` |
| `{Creator}` | `NotificationDispatcher` |
| `{ConcreteA}` | `Email` |
| `{ConcreteB}` | `Sms` |
| `{ConcreteC}` | `InApp` |
| `use{Domain}()` | `useNotification()` |
| Méthode run | `notify({ to, message, subject? })` |

# Note sur InApp vs Push

Côté **frontend**, le canal "In-App" (notification dans l'interface Nuxt
elle-même, via toast/snackbar) est plus pertinent que "Push" (notification
navigateur Web Push). Le canal Push navigateur est techniquement possible
mais nécessite l'inscription à un service worker — c'est un cas avancé
hors périmètre de cet exemple de base.

# Structure concrète des fichiers

```
app/services/notifications/
├── types.ts
│     NotificationChannelType = 'email' | 'sms' | 'in-app'
│     NotificationPayload = { to: string; message: string; subject?: string }
├── products/
│     AbstractNotificationChannel.ts
│       abstract send(payload: NotificationPayload): Promise<void>
│       abstract supports(target: string): boolean
│     EmailChannel.ts
│       send → POST /api/notifications/email
│       supports(target) → /^[^@]+@[^@]+\.[^@]+$/.test(target)
│     SmsChannel.ts
│       send → POST /api/notifications/sms
│       supports(target) → /^\+[1-9]\d{7,14}$/.test(target)
│     InAppChannel.ts
│       send → useToast().show(payload.message) (notification locale, pas d'API)
│       supports(_) → true (toujours supporté)
├── creators/
│     AbstractNotificationDispatcher.ts
│       protected abstract createNotificationChannel(): AbstractNotificationChannel
│       async execute(args: NotificationPayload)
│         → channel = createNotificationChannel()
│         → if (!channel.supports(args.to)) throw Error(...)
│         → channel.send(args)
│     EmailNotificationDispatcher.ts → new EmailChannel()
│     SmsNotificationDispatcher.ts   → new SmsChannel()
│     InAppNotificationDispatcher.ts → new InAppChannel()
└── NotificationDispatcherResolver.ts
app/composables/
└── useNotification.ts
      useNotification(channel?) → { loading, error, notify }
```

# Particularité InApp

`InAppChannel` est la seule implémentation qui n'appelle pas `$fetch` —
elle utilise un composable de toast (ex: Vuetify Snackbar, ou une lib
comme `vue-toast-notification`) directement. Cela illustre que les
Produits concrets peuvent avoir des natures très différentes tout en
respectant la même interface `send()`.

# Utilisation dans un composant

```vue
<script setup lang="ts">
// Canal email pour le formulaire de contact
const { loading, error, notify } = useNotification('email')

// Canal in-app pour les feedbacks utilisateur immédiats
const { notify: notifyInApp } = useNotification('in-app')

async function handleContact(form: { to: string; message: string; subject: string }) {
  await notify(form)
  await notifyInApp({ to: '', message: 'Message envoyé avec succès !' })
}
</script>
```

# Différence avec les autres exemples Nuxt

L'exemple Notification illustre qu'**un même composant peut utiliser
plusieurs canaux simultanément** (email pour l'envoi réel + in-app pour
le feedback visuel) — ce sont deux appels à `useNotification()` distincts,
pas une logique multi-canal dans un seul Dispatcher.