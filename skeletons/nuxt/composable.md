# Squelette : composable Nuxt

```typescript
// app/composables/useXxx.ts
export function useXxx() {
  // state interne (ref/reactive)

  // fonctions exposées

  return {
    // valeurs et fonctions exposées
  }
}
```

Règles :
- Nom de fichier et nom de fonction doivent correspondre (useXxx.ts → useXxx())
- Toujours un `export function`, jamais `export default`
- Utiliser `$fetch`/`useFetch` pour les appels HTTP, jamais `axios`
