# Exemple appris — other (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — 

## Ce qui a été corrigé

Fichier absent de la génération. Voici l'implémentation complète.

```
import { setUserSession } from '#auth-utils';
import type { IRegisterInput } from '~/types/auth';
import type { IUserInfo } from '~/types/user';

export default defineEventHandler(async (event) => {
  const body = await readBody<IRegisterInput>(event);

  if (!body?.email || !body?.password || !body?.firstName || !body?.lastName) {
    throw createError({ statusCode: 422, statusMessage: 'All fields are required' });
  }

  const railsApiUrl = process.env.NUXT_RAILS_API_URL ?? useRuntimeConfig().railsApiUrl;

  let data: { user: IUserInfo; token: string };

  try {
    data = await $fetch<{ user: IUserInfo; token: string }>(
      `${railsApiUrl}/auth/register`,
      {
        method: 'POST',
        body,
      }
    );
  } catch (err: any) {
    const status = err?.response?.status ?? 422;
    throw createError({ statusCode: status, statusMessage: 'Registration failed' });
  }

  await setUserSession(event, {
    user: data.user,
    secure: { rails_token: data.token },
  });

  return { user: data.user };
});

```