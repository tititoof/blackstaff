# Exemple appris — page (nuxt)

> Fichier d'origine : `app/pages/register.vue`
> Corrigé par Claude suite à une revue automatique.
> Contexte : Inscription utilisateur — formulaire d'inscription — champs adaptés au besoin réel, redirection vers la page principale après succès

## Ce qui a été corrigé

Le champ 'name' est absent du formulaire alors que registerSchema l'exige, ce qui causera une erreur de validation systématique.

```
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { registerSchema } from '~/shared/types/auth';

const router = useRouter();
const form = ref({ name: '', email: '', password: '' });
const error = ref('');
const loading = ref(false);

async function handleRegister() {
  error.value = '';
  const parsed = registerSchema.safeParse(form.value);
  if (!parsed.success) {
    error.value = 'Veuillez remplir correctement les champs.';
    return;
  }
  loading.value = true;
  try {
    await $fetch('/api/auth/register', { method: 'POST', body: parsed.data });
    router.push('/');
  } catch (e: any) {
    error.value = e?.data?.statusMessage ?? 'Erreur lors de l\'inscription.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <h1>Inscription</h1>
    <form @submit.prevent="handleRegister">
      <div>
        <label for="name">Nom</label>
        <input id="name" v-model="form.name" type="text" required />
      </div>
      <div>
        <label for="email">Email</label>
        <input id="email" v-model="form.email" type="email" required />
      </div>
      <div>
        <label for="password">Mot de passe</label>
        <input id="password" v-model="form.password" type="password" required />
      </div>
      <p v-if="error" style="color:red">{{ error }}</p>
      <button type="submit" :disabled="loading">S'inscrire</button>
    </form>
  </div>
</template>

```