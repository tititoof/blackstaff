# Exemple appris — server-api (nuxt)

> Fichier d'origine : `server/api/auth/logout.delete.ts`
> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — révoke token Rails + clearUserSession

## Ce qui a été corrigé

Fichier absent de la génération mais requis par la description (révocation token Rails + clearUserSession).

```
import { defineEventHandler, createError } from 'h3';
import { getUserSession, clearUserSession } from '#auth-utils';

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  const token = session.secure?.rails_token;
  const railsApiUrl = useRuntimeConfig().railsApiUrl as string;

  if (token) {
    await fetch(`${railsApiUrl}/api/auth/logout`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }).catch(() => {
      // best-effort revocation
    });
  }

  await clearUserSession(event);
  return { statusCode: 200 };
});

```