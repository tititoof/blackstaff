# Exemple appris — other (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — appelle Rails, stocke token dans session scellée

## Ce qui a été corrigé

N'utilise pas nuxt-auth-utils (setUserSession), hard-code l'URL Rails au lieu de runtimeConfig, et n'implémente pas le pattern BFF (token stocké dans secure session). Manque aussi readBody et les imports h3 corrects.

```
import { defineEventHandler, readBody, createError } from 'h3';
import { setUserSession } from '#auth-utils';

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event);
  const config = useRuntimeConfig(event);

  const response = await $fetch<{ token: string; user: { id: number; email: string; username: string } }>(
    `${config.railsApiUrl}/api/auth/login`,
    {
      method: 'POST',
      body: { email, password },
    }
  ).catch(() => {
    throw createError({ statusCode: 401, message: 'Invalid credentials' });
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