# Exemple appris — composable (nuxt)

> Fichier d'origine : `app/composables/useAuthApi.ts`
> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — signIn, signUp, signOut

## Ce qui a été corrigé

Importe `useFetch` depuis un chemin interne non public, appelle l'API Rails directement (violation du pattern BFF), le fichier est tronqué, et expose le token via header côté client.

```
export function useAuthApi() {
  const router = useRouter();

  const signIn = async (credentials: { email: string; password: string }) => {
    const { data, error, status } = await useFetch('/api/auth/login', {
      method: 'POST',
      body: credentials,
    });
    if (error.value) {
      return { statusCode: error.value.statusCode ?? 500 };
    }
    return { statusCode: 200, data: data.value };
  };

  const signUp = async (payload: { email: string; password: string; password_confirmation?: string }) => {
    const { data, error } = await useFetch('/api/auth/register', {
      method: 'POST',
      body: payload,
    });
    if (error.value) {
      return { statusCode: error.value.statusCode ?? 500 };
    }
    return { statusCode: 200, data: data.value };
  };

  const signOut = async () => {
    await useFetch('/api/auth/logout', { method: 'DELETE' });
    await router.push('/login');
  };

  return { signIn, signUp, signOut };
}

```