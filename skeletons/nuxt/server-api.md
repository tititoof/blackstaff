# Squelette : route API serveur Nuxt (Nitro)

```typescript
// server/api/xxx.post.ts  (ou .get.ts / .delete.ts / .put.ts selon la méthode)
export default defineEventHandler(async (event) => {
  const body = await readBody(event) // uniquement pour POST/PUT

  // logique métier

  return {
    // réponse
  }
})
```

Règles :
- Le nom de fichier porte la méthode HTTP en suffixe (`.post.ts`, `.get.ts`, `.delete.ts`)
- Toujours `defineEventHandler`, jamais `defineController` ni équivalent inexistant
- `readBody(event)` pour lire le corps, `getUserSession`/`setUserSession`/`clearUserSession` pour la session
