# Exemple appris — store (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — notifications globales

## Ce qui a été corrigé

Fichier absent dans les fichiers générés, mais requis par la description.

```
import { defineStore } from 'pinia';

export interface INotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export const useApplicationStore = defineStore('application', () => {
  const notifications = ref<INotification[]>([]);

  function addNotification(notification: Omit<INotification, 'id'>) {
    notifications.value.push({ ...notification, id: crypto.randomUUID() });
  }

  function removeNotification(id: string) {
    notifications.value = notifications.value.filter((n) => n.id !== id);
  }

  return { notifications, addNotification, removeNotification };
});

```