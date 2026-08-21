# Exemple appris — middleware (nuxt)

> Fichier d'origine : `app/middleware/auth.ts`
> Corrigé par Claude suite à une revue automatique.
> Contexte : Inscription utilisateur — garde de route — TOUJOURS présent si des pages doivent être protégées

## Ce qui a été corrigé

Fichier absent alors qu'il est requis par la description.

```
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useUserSession();
  if (!loggedIn.value) {
    return navigateTo('/login');
  }
});

```