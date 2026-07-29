# Exemple appris — other (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — appelle Rails, stocke token dans session scellée

## Ce qui a été corrigé

Imports inexistants, syntaxe invalide (userSession.secure[railsApiUrl]), logique incorrecte. Doit utiliser readBody, appeler Rails via $fetch, stocker le token dans la session scellée via setUserSession et retourner uniquement les infos user.

```
import { setUserSession } from '#auth-utils';
import type { ILoginInput } from '~/types/auth';
import type { IUserInfo } from '~/types/user';

export default defineEventHandler(async (event) => {
  const body = await readBody<ILoginInput>(event);

  if (!body?.email || !body?.password) {
    throw createError({ statusCode: 422, statusMessage: 'Email and password are required' });
  }

  const railsApiUrl = process.env.NUXT_RAILS_API_URL ?? useRuntimeConfig().railsApiUrl;

  let data: { user: IUserInfo; token: string };

  try {
    data = await $fetch<{ user: IUserInfo; token: string }>(
      `${railsApiUrl}/auth/login`,
      {
        method: 'POST',
        body: { email: body.email, password: body.password },
      }
    );
  } catch (err: any) {
    const status = err?.response?.status ?? 401;
    throw createError({ statusCode: status, statusMessage: 'Invalid credentials' });
  }

  await setUserSession(event, {
    user: data.user,
    secure: { rails_token: data.token },
  });

  return { user: data.user };
});

```