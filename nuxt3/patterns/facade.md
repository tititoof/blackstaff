# Pattern — Façade (Facade)
# Catégorie : Patron structurel
# Fournit une interface simplifiée à un ensemble complexe de classes.
# Référence : https://refactoring.guru/fr/design-patterns/facade

---

## Quand l'utiliser dans ce projet

- Simplifier l'accès à plusieurs composables depuis une page
- Fournir une interface unifiée pour les opérations d'authentification complètes
- Simplifier l'accès à un ensemble de services tiers (analytics, monitoring)
- Créer un point d'entrée unique pour toutes les opérations d'un domaine complexe

---

## Template TypeScript — Nuxt 3

### composables/useArticleFacade.ts

```typescript
// composables/useArticleFacade.ts
// Facade — interface unifiée pour toutes les opérations sur les articles

import type { Article, CreateArticlePayload, UpdateArticlePayload } from '~/types/Article'

export interface ArticleOperationResult {
  success: boolean
  data?: Article
  error?: string
}

export const useArticleFacade = () => {
  // Sous-systèmes internes — la facade les orchestre
  const { list, get, create, update, remove } = useArticles()
  const { form, reset, isValid }              = useArticleForm()
  const { success, error: notifyError }       = useNotification()
  const { duplicate }                         = useArticleDuplicate()

  // Opération complexe — création avec notification et reset
  const createArticle = async (
    payload: CreateArticlePayload
  ): Promise<ArticleOperationResult> => {
    try {
      const article = await create(payload)
      reset()
      success('Article créé avec succès')
      await navigateTo('/articles')
      return { success: true, data: article }
    } catch {
      notifyError('Impossible de créer l\'article')
      return { success: false, error: 'Création échouée' }
    }
  }

  // Opération complexe — mise à jour avec notification
  const updateArticle = async (
    id: number,
    payload: UpdateArticlePayload
  ): Promise<ArticleOperationResult> => {
    try {
      const article = await update(id, payload)
      success('Article mis à jour')
      return { success: true, data: article }
    } catch {
      notifyError('Impossible de mettre à jour l\'article')
      return { success: false, error: 'Mise à jour échouée' }
    }
  }

  // Opération complexe — suppression avec confirmation
  const deleteArticle = async (id: number): Promise<ArticleOperationResult> => {
    try {
      await remove(id)
      success('Article supprimé')
      return { success: true }
    } catch {
      notifyError('Impossible de supprimer l\'article')
      return { success: false, error: 'Suppression échouée' }
    }
  }

  // Opération complexe — duplication avec navigation
  const duplicateArticle = async (article: Article): Promise<ArticleOperationResult> => {
    try {
      const copy = await duplicate(article)
      success(`Article dupliqué : "${copy.title}"`)
      return { success: true, data: copy }
    } catch {
      notifyError('Impossible de dupliquer l\'article')
      return { success: false, error: 'Duplication échouée' }
    }
  }

  return {
    // Lecture — délèguent directement au composable
    list,
    get,
    // Écriture — orchestration via la facade
    createArticle,
    updateArticle,
    deleteArticle,
    duplicateArticle,
    // Formulaire — exposé pour les pages
    form,
    isValid
  }
}
```

### composables/useAuthFacade.ts

```typescript
// composables/useAuthFacade.ts
// Facade — simplifie toutes les opérations d'authentification

import type { LoginPayload } from '~/types/Auth'

export const useAuthFacade = () => {
  const authStore                          = useAuthStore()
  const { login: loginApi, logout: logoutApi } = useAuth()
  const { success, error: notifyError }    = useNotification()

  const login = async (payload: LoginPayload): Promise<boolean> => {
    try {
      await loginApi(payload)
      success(`Bienvenue ${authStore.user?.email ?? ''}`)
      return true
    } catch {
      notifyError('Email ou mot de passe incorrect')
      return false
    }
  }

  const logout = async (): Promise<void> => {
    await logoutApi()
    success('Déconnexion réussie')
  }

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const currentUser     = computed(() => authStore.user)

  return { login, logout, isAuthenticated, currentUser }
}
```

### Utilisation dans une page — simplicité maximale

```vue
<!-- pages/articles/create.vue -->
<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

// La page n'interagit qu'avec la facade — pas avec les sous-systèmes
const { createArticle, form, isValid } = useArticleFacade()

const loading = ref(false)

const onSubmit = async () => {
  if (!isValid.value) return
  loading.value = true
  await createArticle(form)
  loading.value = false
}
</script>

<template>
  <v-container>
    <h1 class="mb-4">Créer un article</h1>
    <ArticleForm
      v-model="form"
      :loading="loading"
      @submit="onSubmit"
    />
  </v-container>
</template>
```

---

## Règles d'utilisation

- La facade orchestre les sous-systèmes — elle ne contient pas de logique métier propre
- Les pages utilisent la facade — jamais les sous-systèmes directement
- Une facade par domaine complexe (ArticleFacade, AuthFacade)
- La facade retourne des types simples (boolean, résultat unifié) — jamais les types internes des sous-systèmes
- Les sous-systèmes restent accessibles directement pour les cas avancés