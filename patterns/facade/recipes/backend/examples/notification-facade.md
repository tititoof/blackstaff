---
type: Example
title: Facade — exemple Notifications multi-canal
tags: [facade, notification, rails, laravel, symfony]
---

# Application du pattern sur les notifications multi-canal

Envoyer une notification via email ET SMS ET push (selon les préférences
utilisateur) derrière une seule méthode `notify(user, event, payload)`.

# Correspondance avec les placeholders

| Placeholder | Valeur concrète |
|---|---|
| `{Facade}` | `NotificationFacade` |
| `{SubsystemA}` | `EmailNotificationService` |
| `{SubsystemB}` | `SmsNotificationService` |
| `{SubsystemC}` | `PushNotificationService` |
| Méthode simplifiée | `notify(user, event, payload)` |

# Rails

```ruby
# app/facades/notification_facade.rb
class NotificationFacade
  CHANNEL_MAP = {
    email: :send_email,
    sms:   :send_sms,
    push:  :send_push,
  }.freeze

  def initialize(
    email_service: EmailNotificationService.new,
    sms_service:   SmsNotificationService.new,
    push_service:  PushNotificationService.new
  )
    @channels = {
      email: email_service,
      sms:   sms_service,
      push:  push_service,
    }
  end

  # Envoie sur tous les canaux activés pour cet utilisateur et cet événement
  def notify(user:, event:, payload: {})
    enabled_channels(user, event).each do |channel|
      service = @channels[channel]
      method  = CHANNEL_MAP[channel]
      service.public_send(method, user: user, event: event, payload: payload)
    rescue => e
      # Un canal en échec ne bloque pas les autres
      Rails.logger.error("[Notif] #{channel} failed for user #{user.id}: #{e.message}")
    end
  end

  # Raccourcis pour les événements courants
  def notify_order_placed(order:)
    notify(user: order.user, event: :order_placed, payload: { order_id: order.id })
  end

  def notify_password_reset(user:, token:)
    notify(user: user, event: :password_reset, payload: { token: token })
  end

  private

  def enabled_channels(user, event)
    prefs = user.notification_preferences
    CHANNEL_MAP.keys.select { |ch| prefs.enabled?(channel: ch, event: event) }
  end
end
```

# Laravel

```php
// app/Services/NotificationFacadeService.php
class NotificationFacadeService
{
    public function __construct(
        private readonly EmailNotificationService $emailService,
        private readonly SmsNotificationService   $smsService,
        private readonly PushNotificationService  $pushService,
    ) {}

    public function notify(User $user, string $event, array $payload = []): void
    {
        $channels = $this->enabledChannels($user, $event);

        foreach ($channels as $channel) {
            try {
                match($channel) {
                    'email' => $this->emailService->send($user, $event, $payload),
                    'sms'   => $this->smsService->send($user, $event, $payload),
                    'push'  => $this->pushService->send($user, $event, $payload),
                };
            } catch (\Throwable $e) {
                Log::error("[Notif] {$channel} failed for user {$user->id}", [
                    'error' => $e->getMessage(),
                ]);
                // Continue avec les autres canaux
            }
        }
    }

    public function notifyOrderPlaced(Order $order): void
    {
        $this->notify($order->user, 'order_placed', ['order_id' => $order->id]);
    }

    public function notifyPasswordReset(User $user, string $token): void
    {
        $this->notify($user, 'password_reset', ['token' => $token]);
    }

    private function enabledChannels(User $user, string $event): array
    {
        return $user->notificationPreferences()
            ->where('event', $event)
            ->where('enabled', true)
            ->pluck('channel')
            ->toArray();
    }
}
```

# Symfony

```php
// src/Facade/NotificationFacade.php
class NotificationFacade
{
    private array $channels;

    public function __construct(
        private readonly EmailNotificationService $emailService,
        private readonly SmsNotificationService   $smsService,
        private readonly PushNotificationService  $pushService,
        private readonly PreferenceRepository     $preferences,
        private readonly LoggerInterface          $logger,
    ) {
        $this->channels = [
            'email' => $this->emailService,
            'sms'   => $this->smsService,
            'push'  => $this->pushService,
        ];
    }

    public function notify(User $user, string $event, array $payload = []): void
    {
        $enabledChannels = $this->preferences->findEnabledChannels($user, $event);

        foreach ($enabledChannels as $channel) {
            if (! isset($this->channels[$channel])) continue;
            try {
                $this->channels[$channel]->send($user, $event, $payload);
            } catch (\Throwable $e) {
                $this->logger->error("[Notif] {$channel} failed", [
                    'user_id' => $user->getId(),
                    'event'   => $event,
                    'error'   => $e->getMessage(),
                ]);
            }
        }
    }

    public function notifyOrderPlaced(Order $order): void
    {
        $this->notify($order->getUser(), 'order_placed', ['order_id' => $order->getId()]);
    }
}
```

# Règle clé : isolation des échecs de canal

Un canal qui échoue (SMS down, push token expiré) **ne doit pas empêcher**
les autres canaux de délivrer la notification. Le bloc `rescue`/`catch`
par canal avec logging est non-négociable — sans lui, un service SMS
indisponible bloque l'email de confirmation de commande.