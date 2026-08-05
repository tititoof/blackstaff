# Exemple appris — other (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — appelle Rails, stocke token dans session scellée

## Ce qui a été corrigé

Le fichier contient du texte parasite, importe des modules inexistants côté serveur, et n'implémente pas la logique BFF (appel Rails + stockage du token dans la session scellée).

```
import { defineEventHandler, readBody, createError } from 'h3'
import { setUserSession } from '#auth-utils'
import { $fetch } from 'ofetch'
import type { ILoginInput } from '~/types/auth'
import type { IUserInfo } from '~/types/user'

export default defineEventHandler(async (event) => {
  const body = await readBody<ILoginInput>(event)
  const config = useRuntimeConfig()

  let data: { user: IUserInfo; token: string }
  try {
    data = await $fetch<{ user: IUserInfo; token: string }>(
      `${config.railsApiUrl}/auth/login`,
      {
        method: 'POST',
        body: { email: body.email, password: body.password }
      }
    )
  } catch (err: any) {
    throw createError({
      statusCode: err?.response?.status ?? 401,
      message: err?.data?.message ?? 'Identifiants invalides'
    })
  }

  await setUserSession(event, {
    user: data.user,
    secure: { rails_token: data.token }
  })

  return { user: data.user }
})
```