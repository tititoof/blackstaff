# Exemple appris — spec (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — 

## Ce qui a été corrigé

Fichier absent de la génération.

```
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthApi } from '~/app/composables/useAuthApi';

const mockFetch = vi.fn();
vi.stubGlobal('$fetch', mockFetch);

const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('useAuthApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('signIn success : retourne statusCode 200', async () => {
    mockFetch.mockResolvedValue({ user: { id: '1', email: 'a@b.com' } });
    const { signIn } = useAuthApi();
    const result = await signIn({ email: 'a@b.com', password: 'pass' });
    expect(result.statusCode).toBe(200);
  });

  it('signIn failure : retourne statusCode 401', async () => {
    mockFetch.mockRejectedValue(Object.assign(new Error(), { response: { status: 401 } }));
    const { signIn } = useAuthApi();
    const result = await signIn({ email: 'a@b.com', password: 'wrong' });
    expect(result.statusCode).toBe(401);
  });

  it('signUp success : retourne statusCode 200', async () => {
    mockFetch.mockResolvedValue({ user: { id: '2', email: 'b@b.com' } });
    const { signUp } = useAuthApi();
    const result = await signUp({
      firstName: 'Jane', lastName: 'Doe', email: 'b@b.com', password: 'pass',
    });
    expect(result.statusCode).toBe(200);
  });

  it('signUp validation : retourne statusCode 422', async () => {
    mockFetch.mockRejectedValue(Object.assign(new Error(), { response: { status: 422 } }));
    const { signUp } = useAuthApi();
    const result = await signUp({
      firstName: '', lastName: '', email: 'bad', password: '',
    });
    expect(result.statusCode).toBe(422);
  });

  it('signOut : appelle DELETE /api/auth/logout et navigue vers /login', async () => {
    mockFetch.mockResolvedValue({});
    const { signOut } = useAuthApi();
    await signOut();
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'DELETE' });
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});

```