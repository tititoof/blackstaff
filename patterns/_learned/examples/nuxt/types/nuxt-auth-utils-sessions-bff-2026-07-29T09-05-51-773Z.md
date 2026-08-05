# Exemple appris — types (nuxt)

> Fichier d'origine : `app/types/session.d.ts`
> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — augmentation UserSession : user + secure.rails_token

## Ce qui a été corrigé

L'augmentation doit étendre le module 'nuxt-auth-utils' pour augmenter UserSession, pas importer depuis ~/types/user. La structure secure doit être dans l'interface UserSession augmentée.

```
import type { IUserInfo } from '~/types/user';

declare module '#auth-utils' {
  interface UserSession {
    user?: IUserInfo;
    secure?: {
      rails_token: string;
    };
  }
}

export {};

```