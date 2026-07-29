# Exemple appris — page (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — confirmationRules en computed(

## Ce qui a été corrigé

Fichier absent de la génération.

```
<script setup lang="ts">
import type { IRegisterInput } from '~/types/auth';

definePageMeta({ layout: false });

const { signUp } = useAuthApi();
const { t } = useI18n();

const form = reactive<IRegisterInput & { confirmPassword: string }>(
  { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' }
);
const loading = ref(false);
const error = ref<string | null>(null);

const confirmationRules = computed(() => [
  (v: string) => !!v || t('auth.confirm_password_required'),
  (v: string) => v === form.password || t('auth.passwords_mismatch'),
]);

async function onSubmit() {
  loading.value = true;
  error.value = null;
  const { confirmPassword, ...input } = form;
  const result = await signUp(input);
  loading.value = false;
  if (result.statusCode === 200) {
    await navigateTo('/');
  } else {
    error.value = t('auth.register_failed');
  }
}
</script>

<template>
  <v-app>
    <v-main>
      <v-container class="d-flex align-center justify-center fill-height">
        <v-card width="480">
          <v-card-title>{{ t('auth.register') }}</v-card-title>
          <v-card-text>
            <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
            <v-form @submit.prevent="onSubmit">
              <v-text-field v-model="form.firstName" :label="t('auth.first_name')" required />
              <v-text-field v-model="form.lastName" :label="t('auth.last_name')" required />
              <v-text-field v-model="form.email" :label="t('auth.email')" type="email" required />
              <v-text-field v-model="form.password" :label="t('auth.password')" type="password" required />
              <v-text-field
                v-model="form.confirmPassword"
                :label="t('auth.confirm_password')"
                type="password"
                :rules="confirmationRules"
                required
              />
              <v-btn type="submit" :loading="loading" block color="primary">
                {{ t('auth.submit_register') }}
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

```