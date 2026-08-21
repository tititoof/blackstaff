# Exemple appris — page (nuxt)

> Fichier d'origine : `app/pages/register.vue`
> Corrigé par Claude suite à une revue automatique.
> Contexte : Inscription utilisateur — formulaire d'inscription — champs adaptés au besoin réel, redirection vers la page principale après succès

## Ce qui a été corrigé

Le fichier register.vue est absent alors qu'il est requis par la description.

```
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
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit">S'inscrire</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { registerSchema } from '~/shared/types/auth';

const form = reactive({ name: '', email: '', password: '' });
const error = ref('');
const router = useRouter();

async function handleRegister() {
  error.value = '';
  const parsed = registerSchema.safeParse(form);
  if (!parsed.success) {
    error.value = parsed.error.errors[0]?.message ?? 'Données invalides';
    return;
  }
  const res = await $fetch('/api/auth/register', {
    method: 'POST',
    body: parsed.data,
  }).catch((e) => ({ error: e?.data?.message ?? 'Erreur lors de l\'inscription' }));
  if ('error' in res) {
    error.value = res.error;
    return;
  }
  await router.push('/');
}
</script>
```