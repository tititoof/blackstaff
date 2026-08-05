# Exemple appris — types (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — augmentation UserSession : user + secure.rails_token

## Ce qui a été corrigé

Import incorrect (UserSession n'est pas dans ./user), export dupliqué, et l'augmentation doit étendre le module 'nuxt-auth-utils' avec user: IUserInfo et secure.rails_token: string.

```
import { IUserInfo } from './user';

declare module 'nuxt-auth-utils' {
  interface UserSession {
    user?: IUserInfo;
  }

  interface SecureSessionData {
    rails_token: string;
  }
}

export {};

```