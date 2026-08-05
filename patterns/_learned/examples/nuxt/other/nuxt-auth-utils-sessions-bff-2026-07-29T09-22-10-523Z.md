# Exemple appris — other (nuxt)

> Fichier d'origine : `server/utils/rails-client.ts`
> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — fetchRails avec retry automatique sur 401

## Ce qui a été corrigé

La logique de retry est incorrecte : les headers sont reconstruits avec le même token périmé au lieu d'un token rafraîchi. La description ne mentionne pas de refresh token, juste clearUserSession si 401 persiste — le code actuel est cohérent avec ça mais envoie une seconde requête identique sans raison. À simplifier.

```
import type { H3Event } from 'h3';
import { clearUserSession, getUserSession } from '#auth-utils';
import { createError } from 'h3';

const getRailsApiUrl = () => useRuntimeConfig().railsApiUrl as string;

async function doFetch(url: string, options: RequestInit, token?: string): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };
  return fetch(`${getRailsApiUrl()}${url}`, { ...options, headers });
}

export async function fetchRails<T>(
  event: H3Event,
  url: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const session = await getUserSession(event);
  const token = session.secure?.rails_token;

  const response = await doFetch(url, options, token);

  if (response.status === 401 && retry) {
    // Retry once; if still 401, clear session and throw
    const retried = await doFetch(url, options, token);
    if (retried.status === 401) {
      await clearUserSession(event);
      throw createError({ statusCode: 401, message: 'Session expired' });
    }
    if (!retried.ok) {
      throw createError({ statusCode: retried.status, message: retried.statusText });
    }
    return retried.json() as Promise<T>;
  }

  if (!response.ok) {
    throw createError({ statusCode: response.status, message: response.statusText });
  }

  return response.json() as Promise<T>;
}

```