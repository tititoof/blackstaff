# Exemple appris — other (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — 

## Ce qui a été corrigé

Utilise defineNuxtRouteModule qui n'existe pas, require('axios'), et une API contexte fictive. Doit utiliser defineEventHandler, readBody, setUserSession et $fetch comme login.

```
import { defineEventHandler, readBody, createError } from 'h3';
import { setUserSession } from '#auth-utils';

export default defineEventHandler(async (event) => {
  const { email, password, username } = await readBody(event);
  const config = useRuntimeConfig(event);

  if (!email || !password || !username) {
    throw createError({ statusCode: 422, message: 'Email, password and username are required' });
  }

  const response = await $fetch<{ token: string; user: { id: number; email: string; username: string } }>(
    `${config.railsApiUrl}/api/auth/register`,
    {
      method: 'POST',
      body: { email, password, username },
    }
  ).catch(() => {
    throw createError({ statusCode: 422, message: 'Registration failed' });
  });

  await setUserSession(event, {
    user: {
      id: response.user.id,
      email: response.user.email,
      username: response.user.username,
    },
    secure: {
      rails_token: response.token,
    },
  });

  return { user: response.user };
});

```