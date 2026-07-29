# Exemple appris — page (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — confirmationRules en computed(

## Ce qui a été corrigé

Fichier absent dans les fichiers générés, mais requis par la description.

```
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthApi } from '~/app/composables/useAuthApi';
import { useApplicationStore } from '~/app/stores/application';

definePageMeta({ layout: false });

const { signUp } = useAuthApi();
const store = useApplicationStore();
const { t } = useI18n();

const name = ref('');
const email = ref('');
const password = ref('');
const confirmation = ref('');
const loading = ref(false);

const confirmationRules = computed(() => [
  (v: string) => !!v || t('auth.confirmation_required'),
  (v: string) => v === password.value || t('auth.passwords_mismatch'),
]);

async function onSubmit() {
  loading.value = true;
  const result = await signUp({ name: name.value, email: email.value, password: password.value });
  loading.value = false;
  if (result?.statusCode === 200) {
    await navigateTo('/');
  } else {
    store.addNotification({ message: t('auth.register_failed'), type: 'error' });
  }
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card>
          <v-card-title>{{ t('auth.submit_register') }}</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="onSubmit">
              <v-text-field v-model="name" :label="t('auth.name')" />
              <v-text-field v-model="email" :label="t('auth.email')" type="email" required />
              <v-text-field v-model="password" :label="t('auth.password')" type="password" required />
              <v-text-field v-model="confirmation" :label="t('auth.password_confirmation')" type="password" :rules="confirmationRules" required />
              <v-btn type="submit" :loading="loading" block color="primary">
                {{ t('auth.submit_register') }}
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

```