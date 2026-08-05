# Exemple appris — other (nuxt)

> Fichier d'origine : `server/utils/rails-client.ts`
> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — fetchRails avec retry automatique sur 401

## Ce qui a été corrigé

Dépendance inexistante '@blackstaff/nuxt-utils'. Le retry doit être manuel sur 401 spécifiquement, avec clearUserSession si le refresh échoue, en utilisant les utils H3/Nitro natifs.

```
import { H3Event } from 'h3';
import { clearUserSession, getUserSession } from '#auth-utils';

const RAILS_API_URL = () => useRuntimeConfig().railsApiUrl as string;

async function doFetch(url: string, options: RequestInit): Promise<Response> {
  return fetch(`${RAILS_API_URL()}${url}`, options);
}

export async function fetchRails<T>(
  event: H3Event,
  url: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const session = await getUserSession(event);
  const token = session.secure?.rails_token;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const response = await doFetch(url, { ...options, headers });

  if (response.status === 401 && retry) {
    // Retry once — if still 401, clear session
    const retried = await doFetch(url, { ...options, headers });
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