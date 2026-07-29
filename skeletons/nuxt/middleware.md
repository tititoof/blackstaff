# Squelette : middleware de route Nuxt

```typescript
// app/middleware/xxx.ts
export default defineNuxtRouteMiddleware((to, from) => {
  // logique de garde (redirection via navigateTo si besoin)
})
```

Règles :
- Toujours `export default defineNuxtRouteMiddleware(...)`
- `return navigateTo('/chemin')` pour rediriger, jamais `router.push`
