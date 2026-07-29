# Exemple appris — other (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — révoke token Rails + clearUserSession

## Ce qui a été corrigé

Fichier absent de la génération. Doit révoquer le token Rails puis clearUserSession.

```
import { getUserSession, clearUserSession } from '#auth-utils';

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  const token = session.secure?.rails_token;
  const railsApiUrl = process.env.NUXT_RAILS_API_URL ?? useRuntimeConfig().railsApiUrl;

  if (token) {
    try {
      await $fetch(`${railsApiUrl}/auth/logout`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // On continue même si la révocation échoue
    }
  }

  await clearUserSession(event);

  return { success: true };
});

```