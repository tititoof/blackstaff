---
type: Recipe
title: Adapter Nuxt — générique
tags: [nuxt, frontend, adapter, design-pattern]
---

# Quand utiliser ce pattern

Intégrer une API externe avec un format différent du format attendu par
tes composables, ou normaliser des données entre différentes sources
(snake_case/camelCase, formats de date, structures imbriquées différentes).

Exemples concrets :
- [Adapter une API externe incompatible](/patterns/adapter/recipes/frontend/examples/api-adapter.md)
- [Adapter un format de données](/patterns/adapter/recipes/frontend/examples/format-adapter.md)

# Dépendances

- [Conventions Nuxt générales](/frameworks/nuxt.md)
- Chemins selon la version : [v3](/frameworks/nuxt/v3.md) / [v4](/frameworks/nuxt/v4.md)

# Structure des fichiers

```
app/adapters/{domain}s/          ← (v4) ou adapters/{domain}s/ (v3)
├── types.ts                     ← interfaces Target + types Adaptee
├── {Adapter}.ts                 ← Adapter concret
└── index.ts                     ← export point unique
app/composables/
└── use{Domain}.ts               ← utilise l'Adapter, expose l'interface Target
```

# Interface Target et types Adaptee

```ts
// adapters/{domain}s/types.ts

// Ce que TON app attend (Target) — format normalisé, camelCase
export interface {Target} {
  id: number
  {fieldA}: {TypeA}
  {fieldB}: {TypeB}
  createdAt: string   // ISO 8601, toujours string côté frontend
}

// Ce que l'API externe retourne (Adaptee) — format propriétaire
export interface {Adaptee}Raw {
  {field_a}: {TypeA}      // snake_case
  {field_b}: {TypeB}
  created_at: string      // format différent possible
  // champs supplémentaires non nécessaires...
  _internal_id: string    // format d'id différent
}
```

# Adapter par composition

```ts
// adapters/{domain}s/{Adapter}.ts
import type { {Target}, {Adaptee}Raw } from './types'

export class {Adapter} {
  // Convertit un objet Adaptee brut vers le format Target normalisé
  toTarget(raw: {Adaptee}Raw): {Target} {
    return {
      id:        this.parseId(raw._internal_id),
      {fieldA}:  this.translate{FieldA}(raw.{field_a}),
      {fieldB}:  raw.{field_b},
      createdAt: this.normalizeDate(raw.created_at),
    }
  }

  // Convertit une collection
  toTargetList(rawList: {Adaptee}Raw[]): {Target}[] {
    return rawList.map(raw => this.toTarget(raw))
  }

  // Convertit du format Target vers le format Adaptee (pour les envois POST/PUT)
  toAdaptee(target: Partial<{Target}>): Partial<{Adaptee}Raw> {
    return {
      {field_a}: target.{fieldA},
      {field_b}: target.{fieldB},
    }
  }

  private parseId(rawId: string): number {
    return parseInt(rawId.replace(/\D/g, ''), 10)
  }

  private translate{FieldA}(value: {Adaptee}Raw['{field_a}']): {TypeA} {
    // Traduction spécifique si nécessaire
    return value as {TypeA}
  }

  private normalizeDate(dateStr: string): string {
    // Normaliser vers ISO 8601 si le format source est différent
    return new Date(dateStr).toISOString()
  }
}

// Export d'une instance singleton (sans état = pas besoin de réinstancier)
export const {adapter} = new {Adapter}()
```

# Composable utilisant l'Adapter

```ts
// composables/use{Domain}.ts
import { {adapter} } from '~~/adapters/{domain}s/{Adapter}'
import type { {Target} } from '~~/adapters/{domain}s/types'

export function use{Domain}() {
  const items   = ref<{Target}[]>([])
  const loading = ref(false)
  const error   = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value   = null
    try {
      // L'API retourne le format Adaptee brut
      const rawData = await $fetch<{Adaptee}Raw[]>('/external-api/{domain}s')

      // L'Adapter traduit vers le format Target
      items.value = {adapter}.toTargetList(rawData)
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function create(data: Partial<{Target}>) {
    // L'Adapter traduit le format Target vers le format Adaptee pour l'envoi
    const payload  = {adapter}.toAdaptee(data)
    const rawResult = await $fetch<{Adaptee}Raw>('/external-api/{domain}s', {
      method: 'POST',
      body: payload,
    })
    // Retourner le format Target normalisé
    return {adapter}.toTarget(rawResult)
  }

  return { items, loading, error, fetchAll, create }
}
```

# Alternative légère — fonctions pures (sans classe)

Pour des adaptations simples sans état ni méthodes multiples :

```ts
// Fonctions de transformation pures — plus légères qu'une classe
export function adapt{Domain}(raw: {Adaptee}Raw): {Target} {
  return {
    id:        parseInt(raw._internal_id),
    {fieldA}:  raw.{field_a},
    createdAt: new Date(raw.created_at).toISOString(),
  }
}

export function adapt{Domain}List(rawList: {Adaptee}Raw[]): {Target}[] {
  return rawList.map(adapt{Domain})
}
```

# Choisir entre classe et fonctions pures

| | Classe | Fonctions pures |
|---|---|---|
| État interne (config, cache) | ✅ | ❌ |
| Transformation bidirectionnelle | ✅ (méthodes `to` et `from`) | ✅ (deux fonctions) |
| Injection dans des tests | Via mock de la classe | Via remplacement direct |
| Lisibilité | Regroupement logique | Imports explicites |

# Règles à respecter

- L'Adapter ne contient que de la **traduction** — pas d'appels `$fetch`,
  pas de logique métier. Les appels réseau restent dans le composable.
- Toujours normaliser vers un format cohérent (camelCase, ISO 8601,
  nombres en unités métier) — le reste de l'app ne doit jamais
  connaître le format propriétaire de l'API externe.
- Tester l'Adapter avec des fixtures JSON de l'API réelle — pas besoin
  de mocker le réseau, juste la transformation des données.