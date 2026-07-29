# Exemple appris — config (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — module nuxt-auth-utils, runtimeConfig.railsApiUrl privé

## Ce qui a été corrigé

Fichier absent dans les fichiers générés, mais requis par la description.

```
export default defineNuxtConfig({
  modules: ['nuxt-auth-utils', '@pinia/nuxt', '@nuxtjs/i18n'],
  runtimeConfig: {
    railsApiUrl: process.env.RAILS_API_URL ?? 'http://localhost:3000',
    session: {
      password: process.env.NUXT_SESSION_PASSWORD ?? '',
    },
  },
});

```