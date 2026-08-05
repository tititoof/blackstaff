# Exemple appris — server-api (nuxt)

> Fichier d'origine : `server/api/auth/register.post.ts`
> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — 

## Ce qui a été corrigé

`createUserSession` n'existe pas dans nuxt-auth-utils (c'est `setUserSession`). `ILoginInput` et `IUserInfo` ne sont pas importés. `response` est inaccessible dans le bloc catch.

```
import { defineEventHandler, readBody, createError } from 'h3';
import { setUserSession } from '#auth-utils';
import type { IRegisterInput } from '~/types/auth';
import type { IUserInfo } from '~/types/user';

export default defineEventHandler(async (event) => {
  const body = await readBody<IRegisterInput>(event);
  const railsApiUrl = useRuntimeConfig().railsApiUrl as string;

  const response = await fetch(`${railsApiUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (response.status === 422) {
    throw createError({ statusCode: 422, message: 'Validation failed' });
  }

  if (!response.ok) {
    throw createError({ statusCode: response.status, message: 'Registration failed' });
  }

  const { token, user }: { token: string; user: IUserInfo } = await response.json();

  await setUserSession(event, {
    user,
    secure: { rails_token: token },
  });

  return { statusCode: 200, data: user };
});

```