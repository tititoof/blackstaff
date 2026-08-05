# Exemple appris — server-api (nuxt)

> Fichier d'origine : `server/api/auth/login.post.ts`
> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — appelle Rails, stocke token dans session scellée

## Ce qui a été corrigé

Imports incorrects (#server n'existe pas, ~/utils/rails-client doit être server/utils), createRailsClient n'existe pas, setUserSession mal utilisé (signature incorrecte, le token doit aller dans secure).

```
import { defineEventHandler, readBody, createError } from 'h3';
import { setUserSession } from '#auth-utils';
import type { ILoginInput } from '~/types/auth';
import type { IUserInfo } from '~/types/user';

export default defineEventHandler(async (event) => {
  const body = await readBody<ILoginInput>(event);
  const railsApiUrl = useRuntimeConfig().railsApiUrl as string;

  const response = await fetch(`${railsApiUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw createError({ statusCode: response.status, message: 'Invalid credentials' });
  }

  const { token, user }: { token: string; user: IUserInfo } = await response.json();

  await setUserSession(event, {
    user,
    secure: { rails_token: token },
  });

  return { statusCode: 200, data: user };
});

```