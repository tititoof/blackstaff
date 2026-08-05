# Exemple appris — spec (nuxt)

> Fichier d'origine : `tests/composables/useAuthApi.test.ts`
> Corrigé par Claude suite à une revue automatique.
> Contexte : nuxt-auth-utils — sessions BFF — 

## Ce qui a été corrigé

Le fichier est un stub inachevé sans aucun test réel. Aucun des cas décrits (signIn success/failure, signUp success/422, signOut) n'est implémenté.

```
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()

vi.stubGlobal('$fetch', mockFetch)

const mockNavigateTo = vi.fn()
vi.stubGlobal('navigateTo', mockNavigateTo)

async function useAuthApi() {
  const { default: mod } = await import('@/composables/useAuthApi')
  return mod()
}

describe('useAuthApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signIn', () => {
    it('success : retourne statusCode 200', async () => {
      mockFetch.mockResolvedValueOnce({ statusCode: 200, user: { id: 1, email: 'a@b.com' } })
      const { signIn } = await useAuthApi()
      const result = await signIn({ email: 'a@b.com', password: 'secret' })
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }))
      expect(result.statusCode).toBe(200)
    })

    it('failure : retourne statusCode 401', async () => {
      mockFetch.mockRejectedValueOnce({ statusCode: 401, message: 'Unauthorized' })
      const { signIn } = await useAuthApi()
      await expect(signIn({ email: 'a@b.com', password: 'wrong' })).rejects.toMatchObject({ statusCode: 401 })
    })
  })

  describe('signUp', () => {
    it('success : retourne statusCode 200', async () => {
      mockFetch.mockResolvedValueOnce({ statusCode: 200, user: { id: 2, email: 'new@b.com' } })
      const { signUp } = await useAuthApi()
      const result = await signUp({ email: 'new@b.com', password: 'secret', passwordConfirmation: 'secret' })
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({ method: 'POST' }))
      expect(result.statusCode).toBe(200)
    })

    it('validation : retourne statusCode 422', async () => {
      mockFetch.mockRejectedValueOnce({ statusCode: 422, message: 'Unprocessable Entity' })
      const { signUp } = await useAuthApi()
      await expect(signUp({ email: 'bad', password: '123', passwordConfirmation: '456' })).rejects.toMatchObject({ statusCode: 422 })
    })
  })

  describe('signOut', () => {
    it('appelle DELETE /api/auth/logout et navigue vers /login', async () => {
      mockFetch.mockResolvedValueOnce({})
      const { signOut } = await useAuthApi()
      await signOut()
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({ method: 'DELETE' }))
      expect(mockNavigateTo).toHaveBeenCalledWith('/login')
    })
  })
})

```