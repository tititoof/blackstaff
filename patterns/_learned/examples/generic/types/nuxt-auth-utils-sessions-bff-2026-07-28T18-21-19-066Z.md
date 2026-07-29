# Exemple appris — types (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — augmentation UserSession : user + secure.rails_token

## Ce qui a été corrigé

La syntaxe `secure.rails_token` est invalide en TypeScript. Il faut utiliser une interface imbriquée `secure` avec `rails_token`. L'import de `UserSession` est incorrect (vient de nuxt-auth-utils, pas de auth.ts). L'augmentation doit être un `declare module`.

```
import 'nuxt-auth-utils';
import type { IUserInfo } from './user';

declare module '#auth-utils' {
  interface UserSession {
    user?: IUserInfo;
  }

  interface SecureSessionData {
    rails_token?: string | null;
  }
}

export {};

```