# Exemple appris — composable (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — signIn, signUp, signOut

## Ce qui a été corrigé

Fichier absent dans les fichiers générés, mais requis par la description.

```
import { navigateTo } from '#app';
import type { ILoginInput, IRegisterInput } from '~/app/types/auth';

export function useAuthApi() {
  const signIn = async (credentials: ILoginInput) => {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: credentials,
    }).catch((err) => err?.data ?? err);
    return response;
  };

  const signUp = async (payload: IRegisterInput) => {
    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      body: payload,
    }).catch((err) => err?.data ?? err);
    return response;
  };

  const signOut = async () => {
    await $fetch('/api/auth/logout', { method: 'DELETE' }).catch(() => {});
    await navigateTo('/login');
  };

  return { signIn, signUp, signOut };
}

```