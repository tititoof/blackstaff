# Exemple appris — types (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — augmentation UserSession : user + secure.rails_token

## Ce qui a été corrigé

L'augmentation de UserSession de nuxt-auth-utils doit utiliser declare module, pas des types custom inutilisables. L'import est incorrect et la structure ne correspond pas au pattern BFF décrit.

```
import type { IUserInfo } from './user';

declare module '#auth-utils' {
  interface UserSession {
    user?: IUserInfo;
  }

  interface SecureSessionData {
    rails_token: string;
  }
}

export {};

```