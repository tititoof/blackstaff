# Exemple appris — config (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — module nuxt-auth-utils, runtimeConfig.railsApiUrl privé

## Ce qui a été corrigé

Fichier absent de la génération.

```
export default defineNuxtConfig({
  modules: ['nuxt-auth-utils'],
  runtimeConfig: {
    railsApiUrl: process.env.NUXT_RAILS_API_URL ?? '',
  },
});

```