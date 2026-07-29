# Exemple appris — composable (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — signIn, signUp, signOut

## Ce qui a été corrigé

Fichier absent de la génération.

```
import type { ILoginInput, IRegisterInput } from '~/types/auth';

export function useAuthApi() {
  const router = useRouter();

  async function signIn(credentials: ILoginInput) {
    try {
      const data = await $fetch('/api/auth/login', {
        method: 'POST',
        body: credentials,
      });
      return { statusCode: 200, data };
    } catch (err: any) {
      return { statusCode: err?.response?.status ?? 401, error: err };
    }
  }

  async function signUp(input: IRegisterInput) {
    try {
      const data = await $fetch('/api/auth/register', {
        method: 'POST',
        body: input,
      });
      return { statusCode: 200, data };
    } catch (err: any) {
      return { statusCode: err?.response?.status ?? 422, error: err };
    }
  }

  async function signOut() {
    await $fetch('/api/auth/logout', { method: 'DELETE' });
    await router.push('/login');
  }

  return { signIn, signUp, signOut };
}

```