# Exemple appris — server-api (nuxt)

> Fichier d'origine : `server/api/auth/login.post.ts`
> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — appelle Rails, stocke token dans session scellée

## Ce qui a été corrigé

Le fichier mélange deux implémentations (createRailsClient avec axios + handler fetch), importe axios non requis, utilise `response.ok` sur un objet axios, le JSON est tronqué, et `createRailsClient` appartient à server/utils pas ici.

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