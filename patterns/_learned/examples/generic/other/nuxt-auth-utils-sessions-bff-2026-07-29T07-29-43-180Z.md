# Exemple appris — other (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — fetchRails avec retry automatique sur 401

## Ce qui a été corrigé

Le fichier contient du texte parasite (ligne 'nuxt'), importe axios et une fonction inexistante, et n'implémente pas le retry sur 401 ni la signature attendue avec H3Event.

```
import { $fetch, type FetchOptions } from 'ofetch'
import type { H3Event } from 'h3'
import { getSession, clearUserSession } from '#auth-utils'

export async function fetchRails<T = unknown>(
  event: H3Event,
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const config = useRuntimeConfig()
  const session = await getSession(event)
  const token = session.secure?.rails_token

  const doFetch = (authToken?: string | null) =>
    $fetch<T>(`${config.railsApiUrl}${path}`, {
      ...options,
      headers: {
        ...options.headers,
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      }
    })

  try {
    return await doFetch(token)
  } catch (err: any) {
    if (err?.response?.status === 401) {
      try {
        // Retry sans token (ou logique de refresh à brancher ici)
        return await doFetch()
      } catch {
        await clearUserSession(event)
        throw createError({ statusCode: 401, message: 'Session expirée' })
      }
    }
    throw err
  }
}
```