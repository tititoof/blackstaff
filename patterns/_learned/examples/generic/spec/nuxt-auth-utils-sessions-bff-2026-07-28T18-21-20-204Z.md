# Exemple appris — spec (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — 

## Ce qui a été corrigé

Fichier absent dans les fichiers générés, mais requis par la description.

```
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthApi } from '~/app/composables/useAuthApi';

const mockFetch = vi.fn();
const mockNavigateTo = vi.fn();

vi.stubGlobal('$fetch', mockFetch);
vi.mock('#app', () => ({ navigateTo: mockNavigateTo }));

describe('useAuthApi', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockNavigateTo.mockReset();
  });

  it('signIn success: returns statusCode 200', async () => {
    mockFetch.mockResolvedValue({ statusCode: 200, user: { id: '1' } });
    const { signIn } = useAuthApi();
    const result = await signIn({ email: 'a@b.com', password: 'pass' });
    expect(result?.statusCode).toBe(200);
  });

  it('signIn failure: returns statusCode 401', async () => {
    mockFetch.mockRejectedValue({ data: { statusCode: 401 } });
    const { signIn } = useAuthApi();
    const result = await signIn({ email: 'a@b.com', password: 'wrong' });
    expect(result?.statusCode).toBe(401);
  });

  it('signUp success: returns statusCode 200', async () => {
    mockFetch.mockResolvedValue({ statusCode: 200, user: { id: '2' } });
    const { signUp } = useAuthApi();
    const result = await signUp({ email: 'b@c.com', password: 'pass' });
    expect(result?.statusCode).toBe(200);
  });

  it('signUp validation: returns statusCode 422', async () => {
    mockFetch.mockRejectedValue({ data: { statusCode: 422 } });
    const { signUp } = useAuthApi();
    const result = await signUp({ email: '', password: '' });
    expect(result?.statusCode).toBe(422);
  });

  it('signOut: calls DELETE /api/auth/logout and navigates to /login', async () => {
    mockFetch.mockResolvedValue({});
    const { signOut } = useAuthApi();
    await signOut();
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'DELETE' });
    expect(mockNavigateTo).toHaveBeenCalledWith('/login');
  });
});

```