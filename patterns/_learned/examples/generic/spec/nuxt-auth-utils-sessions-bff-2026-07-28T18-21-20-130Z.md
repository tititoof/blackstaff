# Exemple appris — spec (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — 

## Ce qui a été corrigé

Fichier absent dans les fichiers générés, mais requis par la description.

```
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchRails } from '~/server/utils/rails-client';

const mockFetch = vi.fn();
vi.stubGlobal('$fetch', mockFetch);

vi.mock('#imports', () => ({
  useRuntimeConfig: () => ({ railsApiUrl: 'http://rails.test' }),
}));

describe('fetchRails', () => {
  beforeEach(() => mockFetch.mockReset());

  it('retries automatically on 401 with getNewToken', async () => {
    mockFetch
      .mockRejectedValueOnce({ statusCode: 401 })
      .mockResolvedValueOnce({ data: 'ok' });

    const getNewToken = vi.fn().mockResolvedValue('new_token');
    const result = await fetchRails('/protected', { method: 'GET', token: 'old_token' }, getNewToken);

    expect(getNewToken).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ data: 'ok' });
  });

  it('throws if getNewToken returns null (clearUserSession path)', async () => {
    mockFetch.mockRejectedValueOnce({ statusCode: 401 });
    const getNewToken = vi.fn().mockResolvedValue(null);

    await expect(
      fetchRails('/protected', { token: 'old' }, getNewToken)
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe('login.post handler', () => {
  it('stores session and returns user without token', async () => {
    const mockSetUserSession = vi.fn();
    vi.doMock('#auth-utils', () => ({ setUserSession: mockSetUserSession }));
    vi.doMock('~/server/utils/rails-client', () => ({
      fetchRails: vi.fn().mockResolvedValue({ token: 'tok', user: { id: '1', email: 'a@b.com' } }),
    }));

    const { default: handler } = await import('~/server/api/auth/login.post');
    const event = { node: { req: {}, res: {} } } as never;
    vi.spyOn(await import('h3'), 'readBody').mockResolvedValue({ email: 'a@b.com', password: 'pass' });

    const result = await handler(event);
    expect(result).toMatchObject({ statusCode: 200, user: { id: '1' } });
    expect(result).not.toHaveProperty('token');
    expect(mockSetUserSession).toHaveBeenCalledWith(event, expect.objectContaining({ secure: { rails_token: 'tok' } }));
  });
});

describe('logout.delete handler', () => {
  it('revokes token and clears session', async () => {
    const mockClear = vi.fn();
    const mockFetchRails = vi.fn().mockResolvedValue({});
    vi.doMock('#auth-utils', () => ({
      getUserSession: vi.fn().mockResolvedValue({ secure: { rails_token: 'tok' } }),
      clearUserSession: mockClear,
    }));
    vi.doMock('~/server/utils/rails-client', () => ({ fetchRails: mockFetchRails }));

    const { default: handler } = await import('~/server/api/auth/logout.delete');
    const event = {} as never;
    await handler(event);

    expect(mockFetchRails).toHaveBeenCalledWith('/auth/logout', expect.objectContaining({ method: 'DELETE', token: 'tok' }));
    expect(mockClear).toHaveBeenCalledWith(event);
  });
});

```