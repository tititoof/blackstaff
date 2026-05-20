# Design Patterns — chartman2.fr
# Templates exacts pour chaque pattern du projet.
# BLACKSTAFF lit la section correspondante avant de générer chaque fichier.

---

## Pattern — API Proxy Nitro

Utilisé pour : tous les fichiers dans /server/api/

Règles absolues :
- Le browser n'appelle JAMAIS Rails directement
- Nitro lit le cookie httpOnly et injecte le Bearer token
- Validation minimale des entrées avant transmission
- Pas de logique métier dans Nitro

### Template GET liste

```typescript
// server/api/{domain}/index.get.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'auth_token')

  if (!token) {
    throw createError({ statusCode: 401, message: 'Non authentifié' })
  }

  const query = getQuery(event)

  return await $fetch(`${config.railsApiBase}/{domain}s`, {
    headers: { Authorization: `Bearer ${token}` },
    query
  })
})
```

### Template GET détail

```typescript
// server/api/{domain}/[id].get.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'auth_token')
  const id = getRouterParam(event, 'id')

  if (!token) throw createError({ statusCode: 401, message: 'Non authentifié' })
  if (!id)    throw createError({ statusCode: 400, message: 'ID manquant' })

  return await $fetch(`${config.railsApiBase}/{domain}s/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
})
```

### Template POST

```typescript
// server/api/{domain}/index.post.ts
import type { Create{Domain}Payload } from '~/types/{Domain}'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'auth_token')

  if (!token) throw createError({ statusCode: 401, message: 'Non authentifié' })

  const body = await readBody<Create{Domain}Payload>(event)
  if (!body)  throw createError({ statusCode: 400, message: 'Body manquant' })

  return await $fetch(`${config.railsApiBase}/{domain}s`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body
  })
})
```

### Template PUT

```typescript
// server/api/{domain}/[id].put.ts
import type { Update{Domain}Payload } from '~/types/{Domain}'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'auth_token')
  const id = getRouterParam(event, 'id')

  if (!token) throw createError({ statusCode: 401, message: 'Non authentifié' })
  if (!id)    throw createError({ statusCode: 400, message: 'ID manquant' })

  const body = await readBody<Update{Domain}Payload>(event)

  return await $fetch(`${config.railsApiBase}/{domain}s/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body
  })
})
```

### Template DELETE

```typescript
// server/api/{domain}/[id].delete.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'auth_token')
  const id = getRouterParam(event, 'id')

  if (!token) throw createError({ statusCode: 401, message: 'Non authentifié' })
  if (!id)    throw createError({ statusCode: 400, message: 'ID manquant' })

  await $fetch(`${config.railsApiBase}/{domain}s/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })

  return { success: true }
})
```

### Template AUTH Login

```typescript
// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<{ email: string; password: string }>(event)

  if (!body?.email || !body?.password) {
    throw createError({ statusCode: 400, message: 'Email et mot de passe requis' })
  }

  const response = await $fetch<{ token: string; user: object }>(
    `${config.railsApiBase}/auth/login`,
    { method: 'POST', body }
  )

  setCookie(event, 'auth_token', response.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7
  })

  return { user: response.user }
})
```

### Template AUTH Logout

```typescript
// server/api/auth/logout.delete.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'auth_token')

  if (token) {
    await $fetch(`${config.railsApiBase}/auth/logout`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => {})
  }

  deleteCookie(event, 'auth_token')
  return { success: true }
})
```

### Template AUTH Me

```typescript
// server/api/auth/me.get.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'auth_token')

  if (!token) {
    throw createError({ statusCode: 401, message: 'Non authentifié' })
  }

  return await $fetch(`${config.railsApiBase}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
})
```

---

## Pattern — useApi

Utilisé pour : tous les appels réseau côté client.

Règles absolues :
- Jamais de `$fetch` direct dans les pages ou composants
- Jamais d'URL Rails dans le client
- Toujours `credentials: 'include'` pour envoyer le cookie

### Template useApi.ts

```typescript
// composables/useApi.ts
export const useApi = () => {
  const apiFetch = <T>(
    endpoint: string,
    options: Parameters<typeof $fetch>[1] = {}
  ): Promise<T> => {
    return $fetch<T>(`/api${endpoint}`, {
      ...options,
      credentials: 'include'
    })
  }

  return { apiFetch }
}
```

---

## Pattern — Domain Composable

Utilisé pour : composables/use{Domain}s.ts

Règles absolues :
- Un composable par domaine métier
- Fonctions nommées : list, get, create, update, remove
- Retours typés avec les interfaces du domaine
- Jamais de logique UI

### Template

```typescript
// composables/use{Domain}s.ts
import type {
  {Domain},
  {Domain}Paginated,
  Create{Domain}Payload,
  Update{Domain}Payload
} from '~/types/{Domain}'

export const use{Domain}s = () => {
  const { apiFetch } = useApi()

  const list = (page = 1) =>
    apiFetch<{Domain}Paginated>(`/{domain}s?page=${page}`)

  const get = (id: number) =>
    apiFetch<{Domain}>(`/{domain}s/${id}`)

  const create = (payload: Create{Domain}Payload) =>
    apiFetch<{Domain}>(`/{domain}s`, { method: 'POST', body: payload })

  const update = (id: number, payload: Update{Domain}Payload) =>
    apiFetch<{Domain}>(`/{domain}s/${id}`, { method: 'PUT', body: payload })

  const remove = (id: number) =>
    apiFetch<void>(`/{domain}s/${id}`, { method: 'DELETE' })

  return { list, get, create, update, remove }
}
```

---

## Pattern — Form Composable

Utilisé pour : composables/use{Domain}Form.ts

Règles absolues :
- `form` est un `reactive` typé avec le payload de création
- `rules` suit le format Vuetify : fonctions retournant `true` ou string d'erreur
- `reset()` remet à l'état initial
- `isValid` est un `computed`
- Jamais d'appel API

### Template

```typescript
// composables/use{Domain}Form.ts
import type { Create{Domain}Payload } from '~/types/{Domain}'

export const use{Domain}Form = () => {
  const initialState: Create{Domain}Payload = {
    // valeurs par défaut pour chaque champ
  }

  const form = reactive<Create{Domain}Payload>({ ...initialState })

  const rules = {
    // format Vuetify : tableau de fonctions
    // champ: [(v: string) => !!v || 'Requis', (v: string) => v.length >= N || 'Min N caractères']
  }

  const reset = () => {
    Object.assign(form, initialState)
  }

  const isValid = computed(() =>
    Object.entries(rules).every(([key, fieldRules]) =>
      (fieldRules as Array<(v: unknown) => true | string>)
        .every(rule => rule((form as Record<string, unknown>)[key]) === true)
    )
  )

  return { form, rules, reset, isValid }
}
```

---

## Pattern — Smart / Dumb Split

### Smart — Page (orchestration)

Règles absolues :
- `definePageMeta` avec middleware approprié
- `useAsyncData` pour les données SSR
- Délègue aux composables pour la logique
- Délègue aux composants pour l'affichage
- Gère les états : loading, error, confirmation

### Template page liste (Smart)

```vue
<!-- pages/{domain}/index.vue -->
<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { list, remove } = use{Domain}s()

const page = ref(1)
const deleteId = ref<number | null>(null)
const deleteLoading = ref(false)
const showDeleteDialog = ref(false)

const { data, refresh } = await useAsyncData(
  '{domain}s-list',
  () => list(page.value),
  { watch: [page] }
)

const onDeleteRequest = (id: number) => {
  deleteId.value = id
  showDeleteDialog.value = true
}

const onDeleteConfirm = async () => {
  if (!deleteId.value) return
  deleteLoading.value = true
  try {
    await remove(deleteId.value)
    await refresh()
    showDeleteDialog.value = false
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <v-container>
    <div class="d-flex justify-space-between align-center mb-4">
      <h1>Liste</h1>
      <v-btn color="primary" :to="`/{domain}s/create`">Créer</v-btn>
    </div>
    <{Domain}Card
      v-for="item in data?.{domain}s ?? []"
      :key="item.id"
      :item="item"
      @edit="navigateTo(`/{domain}s/${$event}`)"
      @delete="onDeleteRequest"
    />
    <v-pagination
      v-model="page"
      :length="Math.ceil((data?.meta.total ?? 0) / (data?.meta.per_page ?? 10))"
    />
    <{Domain}DeleteDialog
      v-model="showDeleteDialog"
      :loading="deleteLoading"
      @confirm="onDeleteConfirm"
    />
  </v-container>
</template>
```

### Template page création (Smart)

```vue
<!-- pages/{domain}/create.vue -->
<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { create } = use{Domain}s()
const { form, reset, isValid } = use{Domain}Form()

const loading = ref(false)
const error = ref<string | null>(null)

const onSubmit = async () => {
  if (!isValid.value) return
  loading.value = true
  error.value = null
  try {
    await create(form)
    reset()
    await navigateTo('/{domain}s')
  } catch {
    error.value = 'Une erreur est survenue'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-container>
    <h1 class="mb-4">Créer</h1>
    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
    <{Domain}Form
      v-model="form"
      :loading="loading"
      @submit="onSubmit"
    />
  </v-container>
</template>
```

### Template page édition (Smart)

```vue
<!-- pages/{domain}/[id].vue -->
<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const id = Number(route.params.id)

const { get, update } = use{Domain}s()
const { form, isValid } = use{Domain}Form()

const saveLoading = ref(false)
const error = ref<string | null>(null)

const { data } = await useAsyncData(
  `{domain}-${id}`,
  () => get(id)
)

watchEffect(() => {
  if (data.value) Object.assign(form, data.value)
})

const onSubmit = async () => {
  if (!isValid.value) return
  saveLoading.value = true
  error.value = null
  try {
    await update(id, form)
    await navigateTo('/{domain}s')
  } catch {
    error.value = 'Une erreur est survenue'
  } finally {
    saveLoading.value = false
  }
}
</script>

<template>
  <v-container>
    <h1 class="mb-4">Éditer</h1>
    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
    <{Domain}Form
      v-model="form"
      :loading="saveLoading"
      @submit="onSubmit"
    />
  </v-container>
</template>
```

### Dumb — Component (présentation)

Règles absolues :
- `defineProps` avec interface typée
- `defineEmits` avec interface typée
- Aucun appel API
- Aucun accès store
- Aucune logique métier
- Maximum 200 lignes

### Template composant Card (Dumb)

```vue
<!-- components/{domain}/{Domain}Card.vue -->
<script setup lang="ts">
import type { {Domain} } from '~/types/{Domain}'

interface Props {
  item: {Domain}
}

interface Emits {
  (e: 'edit', id: number): void
  (e: 'delete', id: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <v-card class="mb-3">
    <v-card-title>{{ props.item.id }}</v-card-title>
    <v-card-actions>
      <v-btn size="small" @click="emit('edit', props.item.id)">Éditer</v-btn>
      <v-btn size="small" color="error" @click="emit('delete', props.item.id)">Supprimer</v-btn>
    </v-card-actions>
  </v-card>
</template>
```

### Template composant Form (Dumb)

```vue
<!-- components/{domain}/{Domain}Form.vue -->
<script setup lang="ts">
import type { Create{Domain}Payload } from '~/types/{Domain}'

interface Props {
  modelValue: Create{Domain}Payload
  loading?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: Create{Domain}Payload): void
  (e: 'submit'): void
}

const props = withDefaults(defineProps<Props>(), { loading: false })
const emit = defineEmits<Emits>()

const { rules } = use{Domain}Form()

const update = (field: keyof Create{Domain}Payload, value: unknown) => {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}
</script>

<template>
  <v-form @submit.prevent="emit('submit')">
    <!-- un v-text-field par champ du payload -->
    <!-- :model-value="props.modelValue.field" @update:model-value="update('field', $event)" -->
    <!-- :rules="rules.field" -->
    <v-btn type="submit" color="primary" :loading="props.loading" block>
      Enregistrer
    </v-btn>
  </v-form>
</template>
```

### Template composant DeleteDialog (Dumb)

```vue
<!-- components/{domain}/{Domain}DeleteDialog.vue -->
<script setup lang="ts">
interface Props {
  modelValue: boolean
  loading?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
}

const props = withDefaults(defineProps<Props>(), { loading: false })
const emit = defineEmits<Emits>()
</script>

<template>
  <v-dialog
    :model-value="props.modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    max-width="400"
  >
    <v-card>
      <v-card-title>Confirmer la suppression</v-card-title>
      <v-card-text>Cette action est irréversible.</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="emit('update:modelValue', false)">Annuler</v-btn>
        <v-btn color="error" :loading="props.loading" @click="emit('confirm')">
          Supprimer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
```

---

## Pattern — Type Centralization

Utilisé pour : tous les fichiers dans /types/

Règles absolues :
- Une interface par concept
- PascalCase pour les noms
- Pas de `any`
- Les champs Rails en snake_case
- Payload Create ≠ Payload Update (Update = tous champs optionnels)

### Template types/{Domain}.ts

```typescript
// types/{Domain}.ts

export interface {Domain} {
  id: number
  // champs du domaine — snake_case pour correspondre à Rails
  created_at: string
  updated_at: string
}

export interface {Domain}Paginated {
  {domain}s: {Domain}[]
  meta: {
    total: number
    page: number
    per_page: number
  }
}

export interface Create{Domain}Payload {
  // champs obligatoires uniquement
  // sans id, created_at, updated_at
}

export interface Update{Domain}Payload {
  // identique à Create mais tous les champs optionnels
  [K in keyof Create{Domain}Payload]?: Create{Domain}Payload[K]
}
```

---

## Pattern — Authentication Boundary

Utilisé pour : stores/useAuthStore.ts, plugins/auth.ts, middleware/auth.ts, middleware/guest.ts

Règles absolues :
- Le store ne contient JAMAIS le token JWT
- Le token vit uniquement dans le cookie httpOnly côté Nitro
- Le store contient uniquement `user`
- La rehydratation se fait via le plugin auth.ts au démarrage

### Template stores/useAuthStore.ts

```typescript
// stores/useAuthStore.ts
import type { User } from '~/types/Auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.user
  },

  actions: {
    setUser(user: User) {
      this.user = user
    },
    logout() {
      this.user = null
    }
  }
  // Pas de persist — rehydratation via plugins/auth.ts
})
```

### Template plugins/auth.ts

```typescript
// plugins/auth.ts
// Rehydrate le user depuis le cookie au démarrage de l'app
export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()

  if (!authStore.user) {
    try {
      const { user } = await $fetch<{ user: User }>('/api/auth/me', {
        credentials: 'include'
      })
      authStore.setUser(user)
    } catch {
      // Cookie absent ou expiré — user reste null
    }
  }
})
```

### Template middleware/auth.ts

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
```

### Template middleware/guest.ts

```typescript
// middleware/guest.ts
export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()

  if (authStore.isAuthenticated) {
    return navigateTo('/')
  }
})
```

### Template composables/useAuth.ts

```typescript
// composables/useAuth.ts
import type { LoginPayload } from '~/types/Auth'

export const useAuth = () => {
  const authStore = useAuthStore()
  const { apiFetch } = useApi()

  const login = async (payload: LoginPayload) => {
    const { user } = await apiFetch<{ user: User }>('/auth/login', {
      method: 'POST',
      body: payload
    })
    authStore.setUser(user)
    await navigateTo('/')
  }

  const logout = async () => {
    await apiFetch('/auth/logout', { method: 'DELETE' })
    authStore.logout()
    await navigateTo('/login')
  }

  return { login, logout }
}
```

---

## Pattern — SSR First

Utilisé pour : toutes les pages qui chargent des données

Règles absolues :
- `useAsyncData` pour les données critiques (SEO, first paint)
- `await` dans `<script setup>` — pas dans `onMounted`
- `onMounted` uniquement pour les données non-critiques (analytics, widgets)
- Clé unique par `useAsyncData` pour éviter les collisions

### Correct

```typescript
// ✅ SSR — données disponibles au premier rendu
const { data } = await useAsyncData('articles-list', () => list(page.value))
```

### Incorrect

```typescript
// ❌ Client-only — page vide au premier rendu, mauvais SEO
onMounted(async () => {
  articles.value = await list()
})
```

---

## Pattern — Pure Utils

Utilisé pour : tous les fichiers dans /utils/

Règles absolues :
- Fonctions pures uniquement (même entrée = même sortie)
- Aucun effet de bord
- Aucun accès réseau, store, ou DOM
- Exportées nommément, pas de default export

### Template utils/format.ts

```typescript
// utils/format.ts

export const formatDate = (date: string, locale = 'fr-FR'): string => {
  return new Date(date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
```

---

## Instructions pour BLACKSTAFF

Avant de générer un fichier :

1. Identifie le pattern correspondant dans ce document
2. Copie le template exact
3. Remplace {domain} → nom en minuscule (ex: article)
4. Remplace {Domain} → nom en PascalCase (ex: Article)
5. Ajoute les champs spécifiques à la place des commentaires
6. Respecte les règles absolues du pattern — aucune exception
7. Vérifie que les imports correspondent aux types définis dans /types/