# Squelette : vitest.config.ts (Nuxt)

D'après la documentation officielle Nuxt (https://nuxt.com/docs/4.x/getting-started/testing)
et Vitest (coverage V8, provider par défaut) :

```typescript
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8', // par défaut, rapide, faible empreinte mémoire, natif V8
      reporter: ['text', 'json-summary'], // 'json-summary' pour parsing automatisé
      include: ['app/**/*.ts', 'server/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/*.config.ts'],
    },
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/unit/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['tests/**/*.{test,spec}.ts'],
          environment: 'nuxt',
        },
      }),
    ],
  },
})
```

Règles :
- Nécessite `"type": "module"` dans `package.json`, ou renommer ce fichier en `vitest.config.mts`
- Les tests de composables/composants Nuxt (auto-imports, `#imports`, `~/`) DOIVENT tourner avec `environment: 'nuxt'`
- Les tests utilitaires purs (sans dépendance Nuxt) peuvent rester en `environment: 'node'`, plus rapides
- `reporter: ['text', 'json-summary']` — le "text" pour lecture humaine, "json-summary" produit `coverage/coverage-summary.json`, exploitable automatiquement
- Dépendances requises : `@nuxt/test-utils`, `vitest`, `@vue/test-utils`, `happy-dom`, `playwright-core`, `@vitest/coverage-v8`