# Exemple appris — middleware (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — loggedIn → navigateTo /login

## Ce qui a été corrigé

Fichier absent dans les fichiers générés, mais requis par la description.

```
import { defineNuxtRouteMiddleware, navigateTo } from '#app';

export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useUserSession();
  if (!loggedIn.value) {
    return navigateTo('/login');
  }
});

```