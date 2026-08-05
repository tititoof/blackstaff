# Exemple appris — middleware (nuxt)

> Fichier d'origine : `app/middleware/auth.ts`
> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — loggedIn → navigateTo /login — implémentation réelle avec useUserSession(

## Ce qui a été corrigé

La déstructuration est incorrecte : useUserSession() retourne { loggedIn, user, session } pas { data }. La logique est inversée : il faut rediriger vers /login si NON connecté (loggedIn est false).

```
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})

```