---
type: Example
title: Factory Method — exemple Notification (Email, SMS, Push)
tags: [factory-method, notification, rails, laravel, symfony]
---

# Application du pattern sur un service de notification

Applique la recipe générique au cas d'un service de notification
avec 3 canaux : Email, SMS, Push.

# Correspondance avec les placeholders génériques

| Placeholder | Valeur concrète |
|---|---|
| `{Domain}` | `Notification` |
| `{Product}` | `NotificationChannel` |
| `{Creator}` | `NotificationDispatcher` |
| `{ConcreteA}` | `Email` |
| `{ConcreteB}` | `Sms` |
| `{ConcreteC}` | `Push` |
| Méthode du produit | `send(to, message, options)` |
| Variable d'env | `NOTIFICATION_CHANNEL` |

# Interface Produit

```
send(to: string, message: string, options: hash/array) → void
  ← envoie la notification via le canal concret
supports?(target: string) → bool
  ← ex: vérifie que l'email est valide, ou que le téléphone a le bon format
```

# Particularités par canal

- **Email** : natif dans tous les frameworks (ActionMailer, Laravel Mail,
  Symfony Mailer) — pas de dépendance externe au-delà du framework.
- **SMS** : nécessite un provider externe (Twilio, Vonage, OVH SMS).
  Le Créateur concret `SmsNotificationDispatcher` peut surcharger
  `validate()` pour vérifier le format E.164 du numéro de téléphone.
- **Push** : nécessite Firebase Cloud Messaging (FCM) ou Apple Push
  Notification Service (APNs). Le Produit `PushNotificationChannel`
  gère la sélection FCM/APNs selon la plateforme du device cible.

# Rails — nommage concret

```
app/services/notifications/
├── base_notification_channel.rb
│     def send(to:, message:, options: {}) → raise NotImplementedError
│     def supports?(target)               → raise NotImplementedError
├── email_notification_channel.rb
│     def send(to:, message:, options: {})
│       UserMailer.notification(to, message, options[:subject]).deliver_later
│     def supports?(target) → URI::MailTo::EMAIL_REGEXP.match?(target)
├── sms_notification_channel.rb
│     def send(to:, message:, **)
│       TwilioClient.messages.create(to: to, from: ENV['TWILIO_FROM'], body: message)
│     def supports?(target) → target.match?(/\A\+[1-9]\d{7,14}\z/)
├── push_notification_channel.rb
├── base_notification_dispatcher.rb
│     def create_notification_channel → raise NotImplementedError
│     def execute(to:, message:, options: {})
│       channel = create_notification_channel
│       raise ArgumentError, "Destinataire non supporté" unless channel.supports?(to)
│       channel.send(to: to, message: message, options: options)
│       log_notification(to: to, channel: channel.class.name)
├── email_notification_dispatcher.rb  → create_notification_channel → EmailNotificationChannel.new
├── sms_notification_dispatcher.rb
│     → create_notification_channel → SmsNotificationChannel.new
│     → validate!(to:, **) { raise unless to.match?(/\A\+.../) }
├── push_notification_dispatcher.rb
└── notification_dispatcher_resolver.rb
      IMPLEMENTATIONS = { 'email' => ..., 'sms' => ..., 'push' => ... }
```

# Laravel — nommage concret

```
app/Services/Notifications/
├── Contracts/NotificationChannelInterface.php
│     send(string $to, string $message, array $options): void
│     supports(string $target): bool
├── Products/EmailChannel.php, SmsChannel.php, PushChannel.php
├── Creators/AbstractNotificationDispatcher.php
│     abstract protected function createNotificationChannel(): NotificationChannelInterface
│     public function execute(array $args): void
│       $channel = $this->createNotificationChannel()
│       if (! $channel->supports($args['to'])) {
│           throw new \InvalidArgumentException('Destinataire non supporté')
│       }
│       $channel->send($args['to'], $args['message'], $args['options'] ?? [])
├── Creators/EmailNotificationDispatcher.php → createNotificationChannel() → app(EmailChannel::class)
├── Creators/SmsNotificationDispatcher.php
│     → createNotificationChannel() → app(SmsChannel::class)
│     → validate(['to' => ...]) : vérifie format E.164
├── Creators/PushNotificationDispatcher.php
└── NotificationDispatcherFactory.php
```

# Symfony — nommage concret

```
src/Service/Notification/
├── Channel/NotificationChannelInterface.php
├── Channel/EmailChannel.php   → autowire MailerInterface
├── Channel/SmsChannel.php     → autowire HttpClientInterface (Twilio/Vonage)
├── Channel/PushChannel.php    → autowire HttpClientInterface (FCM)
├── Dispatcher/AbstractNotificationDispatcher.php
│     → execute(array $args): void
├── Dispatcher/EmailNotificationDispatcher.php
│     __construct(EmailChannel $channel, LoggerInterface $logger)
│     createNotificationChannel() → $this->channel
├── Dispatcher/SmsNotificationDispatcher.php, PushNotificationDispatcher.php

# config/services.yaml
# parameters: notification_channel: '%env(NOTIFICATION_CHANNEL)%'
# alias: AbstractNotificationDispatcher → '%notification_channel%NotificationDispatcher'
```

# Différence avec les cas Paiement et Export

La Notification illustre un cas où **le Produit lui-même effectue une
validation de la cible** (`supports?` / `supports()`) — ce n'est pas
seulement le Créateur qui valide. Cette validation remonte jusqu'à la
classe de base `execute()` pour être commune à tous les canaux, plutôt
que répétée dans chaque Créateur concret.

# Multi-canal (envoyer sur plusieurs canaux en parallèle)

Si le besoin est d'envoyer sur plusieurs canaux simultanément (email +
SMS de confirmation), ce n'est plus Factory Method mais Composite ou
Observer. Ne pas forcer Factory Method pour ce cas — c'est un pattern
différent.

# Endpoint API attendu

```
POST /api/notifications
Body: { to: "user@example.com", message: "Votre commande est prête", channel: "email" }
Response: 204 No Content
```

# Tests à écrire

```
- EmailChannel#send        → mock mailer, vérifie l'envoi
- SmsChannel#send          → mock Twilio client, vérifie le payload
- EmailChannel#supports?   → valide/invalide avec différents emails
- SmsChannel#supports?     → valide/invalide format E.164
- AbstractDispatcher#execute → mock channel#supports (false) → exception
- AbstractDispatcher#execute → mock channel#supports (true) → délègue à send
- NotificationDispatcherResolver → résout le bon Créateur
```