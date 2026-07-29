# Exemple appris — page (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — formulaire Vuetify, definePageMeta layout:false

## Ce qui a été corrigé

Fichier absent de la génération.

```
<script setup lang="ts">
import type { ILoginInput } from '~/types/auth';

definePageMeta({ layout: false });

const { signIn } = useAuthApi();
const { t } = useI18n();

const form = reactive<ILoginInput>({ email: '', password: '' });
const loading = ref(false);
const error = ref<string | null>(null);

async function onSubmit() {
  loading.value = true;
  error.value = null;
  const result = await signIn(form);
  loading.value = false;
  if (result.statusCode === 200) {
    await navigateTo('/');
  } else {
    error.value = t('auth.invalid_credentials');
  }
}
</script>

<template>
  <v-app>
    <v-main>
      <v-container class="d-flex align-center justify-center fill-height">
        <v-card width="400">
          <v-card-title>{{ t('auth.login') }}</v-card-title>
          <v-card-text>
            <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
            <v-form @submit.prevent="onSubmit">
              <v-text-field
                v-model="form.email"
                :label="t('auth.email')"
                type="email"
                required
              />
              <v-text-field
                v-model="form.password"
                :label="t('auth.password')"
                type="password"
                required
              />
              <v-btn type="submit" :loading="loading" block color="primary">
                {{ t('auth.submit_login') }}
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

```