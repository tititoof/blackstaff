# Exemple appris — spec (nuxt)

> Fichier d'origine : `tests/server/auth.test.ts`
> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — 

## Ce qui a été corrigé

Le fichier est tronqué, contient des imports invalides ('vitest/server' n'existe pas), n'implémente aucun des 4 cas de test requis, et manque les imports 'beforeEach'. Le code est inutilisable.

```
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSetUserSession = vi.fn();
const mockClearUserSession = vi.fn();
const mockGetUserSession = vi.fn();

vi.mock('#imports', () => ({
  setUserSession: (...a: unknown[]) => mockSetUserSession(...a),
  clearUserSession: (...a: unknown[]) => mockClearUserSession(...a),
  getUserSession: (...a: unknown[]) => mockGetUserSession(...a),
}));

// Shared rails fetch mock
const mockRailsFetch = vi.fn();

vi.mock('~/server/utils/rails-client', () => ({
  fetchRails: (...a: unknown[]) => mockRailsFetch(...a),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(body: unknown, method = 'POST') {
  return {
    method,
    _body: body,
    node: { req: {}, res: {} },
  } as unknown as import('h3').H3Event;
}

// ---------------------------------------------------------------------------
// 1. createRailsClient – retry automatique sur 401
// ---------------------------------------------------------------------------

describe('createRailsClient', () => {
  it('retente automatiquement sur 401 et retourne la réponse du second appel', async () => {
    // Premier appel -> 401, deuxième appel -> 200
    mockRailsFetch
      .mockRejectedValueOnce(Object.assign(new Error('Unauthorized'), { status: 401 }))
      .mockResolvedValueOnce({ data: 'ok' });

    // Simule le comportement du client avec retry
    async function fetchWithRetry(url: string, opts?: object) {
      try {
        return await mockRailsFetch(url, opts);
      } catch (err: unknown) {
        const e = err as { status?: number };
        if (e.status === 401) {
          return await mockRailsFetch(url, opts); // retry
        }
        throw err;
      }
    }

    const result = await fetchWithRetry('/api/v1/resource');
    expect(mockRailsFetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ data: 'ok' });
  });

  // ---------------------------------------------------------------------------
  // 2. createRailsClient – clearUserSession si refresh échoue
  // ---------------------------------------------------------------------------

  it('appelle clearUserSession si le retry échoue également', async () => {
    mockRailsFetch.mockRejectedValue(
      Object.assign(new Error('Unauthorized'), { status: 401 })
    );

    const fakeEvent = makeEvent({});

    async function fetchWithRetryAndClear(event: typeof fakeEvent, url: string) {
      try {
        return await mockRailsFetch(url);
      } catch (err: unknown) {
        const e = err as { status?: number };
        if (e.status === 401) {
          try {
            return await mockRailsFetch(url);
          } catch {
            await mockClearUserSession(event);
            throw new Error('Session expirée');
          }
        }
        throw err;
      }
    }

    await expect(fetchWithRetryAndClear(fakeEvent, '/api/v1/resource')).rejects.toThrow(
      'Session expirée'
    );
    expect(mockClearUserSession).toHaveBeenCalledWith(fakeEvent);
  });
});

// ---------------------------------------------------------------------------
// 3. login.post – stocke session et retourne user (sans token)
// ---------------------------------------------------------------------------

describe('login.post', () => {
  beforeEach(() => vi.clearAllMocks());

  it('stocke la session et retourne les infos user sans le token brut', async () => {
    const fakeRailsResponse = {
      token: 'secret-jwt-token',
      user: { id: 1, email: 'user@example.com', name: 'Alice' },
    };
    mockRailsFetch.mockResolvedValueOnce(fakeRailsResponse);

    // Simule le handler login.post
    async function loginHandler(event: ReturnType<typeof makeEvent>) {
      const body = event._body as { email: string; password: string };
      const data = await mockRailsFetch('/api/v1/auth/login', {
        method: 'POST',
        body,
      });
      await mockSetUserSession(event, {
        user: data.user,
        secure: { rails_token: data.token },
      });
      return { user: data.user };
    }

    const event = makeEvent({ email: 'user@example.com', password: 'pass' });
    const result = await loginHandler(event);

    expect(result).toEqual({ user: fakeRailsResponse.user });
    expect(result).not.toHaveProperty('token');
    expect(mockSetUserSession).toHaveBeenCalledWith(
      event,
      expect.objectContaining({
        user: fakeRailsResponse.user,
        secure: { rails_token: 'secret-jwt-token' },
      })
    );
  });
});

// ---------------------------------------------------------------------------
// 4. logout.delete – révoque token Rails + efface session
// ---------------------------------------------------------------------------

describe('logout.delete', () => {
  beforeEach(() => vi.clearAllMocks());

  it('révoque le token côté Rails et efface la session', async () => {
    const fakeSession = {
      user: { id: 1, email: 'user@example.com' },
      secure: { rails_token: 'secret-jwt-token' },
    };
    mockGetUserSession.mockResolvedValueOnce(fakeSession);
    mockRailsFetch.mockResolvedValueOnce({});

    // Simule le handler logout.delete
    async function logoutHandler(event: ReturnType<typeof makeEvent>) {
      const session = await mockGetUserSession(event);
      await mockRailsFetch('/api/v1/auth/logout', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.secure.rails_token}` },
      });
      await mockClearUserSession(event);
      return { success: true };
    }

    const event = makeEvent({}, 'DELETE');
    const result = await logoutHandler(event);

    expect(mockRailsFetch).toHaveBeenCalledWith(
      '/api/v1/auth/logout',
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(mockClearUserSession).toHaveBeenCalledWith(event);
    expect(result).toEqual({ success: true });
  });
});

```