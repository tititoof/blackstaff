# Exemple appris — types (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — augmentation UserSession : user + secure.rails_token

## Ce qui a été corrigé

L'augmentation doit étendre le module 'nuxt-auth-utils' via declare module, pas créer une interface custom. La syntaxe `secure.rails_token` est invalide en TypeScript.

```
import type { IUserInfo } from './user'

declare module '#auth-utils' {
  interface UserSession {
    user?: IUserInfo
  }

  interface SecureSessionData {
    rails_token?: string | null
  }
}

export {}
```