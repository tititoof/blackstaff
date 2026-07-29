# Squelette : store Pinia

```typescript
// app/stores/xxx.ts
import { defineStore } from 'pinia'

interface XxxState {
  // champs typés
}

export const useXxxStore = defineStore('xxx', {
  state: (): XxxState => ({
    // valeurs initiales
  }),
  getters: {
    // getters typés
  },
  actions: {
    // actions
  },
})
```

Règles :
- Toujours `defineStore('id-unique', { state, getters, actions })`
- `state` toujours typé via une interface dédiée
- Pas de logique métier lourde (appels API) directement dans le store si un composable existe pour ça
