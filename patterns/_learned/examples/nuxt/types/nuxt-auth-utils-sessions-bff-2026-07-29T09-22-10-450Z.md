# Exemple appris — types (nuxt)

> Fichier d'origine : `app/types/session.d.ts`
> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — augmentation UserSession : user + secure.rails_token

## Ce qui a été corrigé

L'interface étend UserSession en se référençant elle-même (circular). Supprimer le `extends UserSession` redondant.

```
import type { IUserInfo } from '~/types/user';

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