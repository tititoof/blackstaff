# Exemple appris — component (nuxt)

> Fichier d'origine : `app/components/articles/form.vue`
> Corrigé par Claude suite à une revue automatique.
> Contexte : Gestion des articles — formulaire commun à create et edit, un champ de formulaire par champ du type article — décris explicitement les champs de saisie attendus dans la description, en reprenant les mêmes noms/types que dans shared/types/article.ts

## Ce qui a été corrigé

Le fichier est tronqué, les imports de types manquent, la prop `onSubmit` est déclarée mais inutilisée (les emits font le travail), et `formRef.value.validate` n'existe pas nativement sur un HTMLFormElement. Le champ `createdAt` ne devrait pas être éditable.

```
<script setup lang="ts">
import type { Article, CreateArticleInput, UpdateArticleInput } from '~/shared/types/article'

interface Props {
  article?: Article | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update', id: number, input: UpdateArticleInput): void
  (e: 'create', input: CreateArticleInput): void
}>()

const articleForm = reactive({
  title: props.article?.title ?? '',
  content: props.article?.content ?? '',
  authorId: props.article?.authorId ?? 1,
  publishedAt: props.article?.publishedAt ?? null
})

const onSubmitForm = () => {
  if (props.article) {
    emit('update', props.article.id, articleForm)
  } else {
    emit('create', articleForm)
  }
}
</script>

<template>
  <form @submit.prevent="onSubmitForm">
    <div>
      <label for="title">Title</label>
      <input id="title" v-model="articleForm.title" required minlength="1" />
    </div>
    <div>
      <label for="content">Content</label>
      <textarea id="content" v-model="articleForm.content" required></textarea>
    </div>
    <div>
      <label for="authorId">Author ID</label>
      <input id="authorId" v-model.number="articleForm.authorId" type="number" required />
    </div>
    <div>
      <label for="publishedAt">Published At</label>
      <input id="publishedAt" v-model="articleForm.publishedAt" type="datetime-local" />
    </div>
    <button type="submit">{{ props.article ? 'Mettre à jour' : 'Créer' }}</button>
  </form>
</template>

```