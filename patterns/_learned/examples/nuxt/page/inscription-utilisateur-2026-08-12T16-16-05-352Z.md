# Exemple appris — page (nuxt)

> Fichier d'origine : `app/pages/login.vue`
> Corrigé par Claude suite à une revue automatique.
> Contexte : Inscription utilisateur — formulaire de connexion — email + mot de passe, validation, redirection vers la page principale après succès

## Ce qui a été corrigé

Fichier absent alors qu'il est requis par la description (formulaire de connexion email + mot de passe avec validation et redirection).

```
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { loginSchema } from '~/shared/types/auth';

const router = useRouter();
const form = ref({ email: '', password: '' });
const error = ref('');
const loading = ref(false);

async function handleLogin() {
  error.value = '';
  const parsed = loginSchema.safeParse(form.value);
  if (!parsed.success) {
    error.value = 'Veuillez remplir correctement les champs.';
    return;
  }
  loading.value = true;
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: parsed.data });
    router.push('/');
  } catch (e: any) {
    error.value = e?.data?.statusMessage ?? 'Identifiants invalides.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <h1>Connexion</h1>
    <form @submit.prevent="handleLogin">
      <div>
        <label for="email">Email</label>
        <input id="email" v-model="form.email" type="email" required />
      </div>
      <div>
        <label for="password">Mot de passe</label>
        <input id="password" v-model="form.password" type="password" required />
      </div>
      <p v-if="error" style="color:red">{{ error }}</p>
      <button type="submit" :disabled="loading">Se connecter</button>
    </form>
  </div>
</template>

```