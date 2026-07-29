# Exemple appris — spec (generic)

> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — 

## Ce qui a été corrigé

Fichier absent de la génération.

```
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('$fetch', mockFetch);

const mockGetUserSession = vi.fn();
const mockSetUserSession = vi.fn();
const mockClearUserSession = vi.fn();

vi.mock('#auth-utils', () => ({
  getUserSession: mockGetUserSession,
  setUserSession: mockSetUserSession,
  clearUserSession: mockClearUserSession,
}));

describe('fetchRails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NUXT_RAILS_API_URL = 'http://rails.test';
  });

  it('retry automatique sur 401', async () => {
    const { fetchRails } = await import('~/server/utils/rails-client');
    const event = {} as any;
    mockGetUserSession.mockResolvedValue({ secure: { rails_token: 'old-token' } });

    const error401 = Object.assign(new Error('Unauthorized'), { response: { status: 401 } });
    mockFetch
      .mockRejectedValueOnce(error401)
      .mockResolvedValueOnce({ token: 'new-token' })
      .mockResolvedValueOnce({ data: 'ok' });

    const result = await fetchRails(event, '/some/path', { method: 'GET' });

    expect(result).toEqual({ data: 'ok' });
    expect(mockSetUserSession).toHaveBeenCalledWith(event, {
      secure: { rails_token: 'new-token' },
    });
  });

  it('clearUserSession si refresh échoue', async () => {
    const { fetchRails } = await import('~/server/utils/rails-client');
    const event = {} as any;
    mockGetUserSession.mockResolvedValue({ secure: { rails_token: 'old-token' } });

    const error401 = Object.assign(new Error('Unauthorized'), { response: { status: 401 } });
    mockFetch
      .mockRejectedValueOnce(error401)
      .mockRejectedValueOnce(new Error('refresh failed'));

    await expect(fetchRails(event, '/some/path', { method: 'GET' })).rejects.toMatchObject({
      statusCode: 401,
    });
    expect(mockClearUserSession).toHaveBeenCalledWith(event);
  });
});

describe('login.post', () => {
  it('stocke session et retourne user sans token', async () => {
    const event = { node: { req: {}, res: {} } } as any;
    vi.doMock('h3', async (orig) => ({
      ...(await orig<typeof import('h3')>()),
      readBody: async () => ({ email: 'a@b.com', password: 'pass' }),
    }));

    mockFetch.mockResolvedValue({ user: { id: '1', email: 'a@b.com' }, token: 'tok' });

    const handler = (await import('~/server/api/auth/login.post')).default;
    const result = await handler(event);

    expect(result).toEqual({ user: { id: '1', email: 'a@b.com' } });
    expect(result).not.toHaveProperty('token');
    expect(mockSetUserSession).toHaveBeenCalledWith(
      event,
      expect.objectContaining({ secure: { rails_token: 'tok' } })
    );
  });
});

describe('logout.delete', () => {
  it('révoque et efface session', async () => {
    const event = {} as any;
    mockGetUserSession.mockResolvedValue({ secure: { rails_token: 'tok' } });
    mockFetch.mockResolvedValue({});

    const handler = (await import('~/server/api/auth/logout.delete')).default;
    const result = await handler(event);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/logout'),
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(mockClearUserSession).toHaveBeenCalledWith(event);
    expect(result).toEqual({ success: true });
  });
});

```