# Squelette : nuxt.config.ts

```typescript
export default defineNuxtConfig({
  modules: [
    // modules
  ],
  runtimeConfig: {
    // clés privées (serveur uniquement)
    public: {
      // clés publiques (exposées au client)
    },
  },
})
```

Règles :
- Toujours `export default defineNuxtConfig({...})`
- Les secrets vont dans `runtimeConfig` (racine), jamais dans `runtimeConfig.public`
