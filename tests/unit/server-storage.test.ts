import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildStoragePath, createSignedDocumentUrl, getPublicAvatarUrl, validateFilePayload,
} from '../../apps/plateforme/server/utils/storage'

describe('validateFilePayload', () => {
  it('accepte les avatars valides et la limite exacte', () => {
    expect(validateFilePayload('image/png', 1000, 'avatars')).toEqual({ valid: true })
    expect(validateFilePayload('image/webp', 2097152, 'avatars').valid).toBe(true)
  })
  it('rejette avatar trop gros', () => {
    expect(validateFilePayload('image/jpeg', 2097153, 'avatars').valid).toBe(false)
  })
  it('rejette MIME non autorisés', () => {
    expect(validateFilePayload('application/x-msdownload', 10, 'avatars').valid).toBe(false)
    expect(validateFilePayload('text/javascript', 10, 'documents').valid).toBe(false)
    expect(validateFilePayload('image/png', 10, 'documents').error).toContain('non autorisé')
  })
  it('documents pdf et limites', () => {
    expect(validateFilePayload('application/pdf', 5242880, 'documents').valid).toBe(true)
    expect(validateFilePayload('application/pdf', 5242881, 'documents').valid).toBe(false)
  })
  it('rejette tailles invalides', () => {
    expect(validateFilePayload('application/pdf', 0, 'documents').valid).toBe(false)
    expect(validateFilePayload('application/pdf', NaN, 'documents').valid).toBe(false)
  })
  it('rejette un bucket inconnu', () => {
    expect(validateFilePayload('image/png', 1, 'x' as never).valid).toBe(false)
    expect(validateFilePayload('image/png', 1, 'constructor' as never).valid).toBe(false)
  })
})

describe('buildStoragePath', () => {
  it('construit un chemin simple', () => {
    expect(buildStoragePath('u1', 'documents', 'cv.pdf')).toBe('u1/cv.pdf')
  })
  it('neutralise la traversée de répertoire', () => {
    const p = buildStoragePath('u1', 'documents', '../../etc/passwd')
    expect(p).toBe('u1/etc_passwd')
    expect(p.split('/')).toHaveLength(2)
  })
  it('retire slashs et caractères spéciaux', () => {
    expect(buildStoragePath('u1', 'avatars', '/mon fichier*.png/')).toBe('u1/mon_fichier_.png')
  })
  it('utilise un nom par défaut si vide', () => {
    expect(buildStoragePath('u1', 'avatars', '../')).toBe('u1/avatar')
    expect(buildStoragePath('u1', 'documents', '../')).toBe('u1/cv.pdf')
  })
})

describe('createSignedDocumentUrl', () => {
  const make = (res: unknown) => {
    const createSignedUrl = vi.fn().mockResolvedValue(res)
    const from = vi.fn(() => ({ createSignedUrl }))
    return { client: { storage: { from } } as unknown as SupabaseClient, from, createSignedUrl }
  }
  it('retourne l\'URL signée pour un document du propriétaire', async () => {
    const m = make({ data: { signedUrl: 'https://s/x' }, error: null })
    await expect(createSignedDocumentUrl(m.client, 'u1', 'u1/a.pdf')).resolves.toBe('https://s/x')
    expect(m.from).toHaveBeenCalledWith('documents')
    expect(m.createSignedUrl).toHaveBeenCalledWith('u1/a.pdf', 3600)
  })
  it('interdit la signature pour le document d\'un tiers', async () => {
    const m = make({ data: { signedUrl: 'https://s/x' }, error: null })
    await expect(createSignedDocumentUrl(m.client, 'u1', 'u2/a.pdf')).rejects.toThrow('Accès non autorisé')
    expect(m.from).not.toHaveBeenCalled()
  })
  it('utilise l\'expiration fournie', async () => {
    const m = make({ data: { signedUrl: 'u' }, error: null })
    await createSignedDocumentUrl(m.client, 'u1', 'u1/p', 60)
    expect(m.createSignedUrl).toHaveBeenCalledWith('u1/p', 60)
  })
  it('lève une erreur propre', async () => {
    const m = make({ data: null, error: { message: 'secret' } })
    await expect(createSignedDocumentUrl(m.client, 'u1', 'u1/p')).rejects.toThrow('Impossible de générer')
  })
})

describe('getPublicAvatarUrl', () => {
  it('retourne l\'URL publique', () => {
    const getPublicUrl = vi.fn(() => ({ data: { publicUrl: 'https://p/a.png' } }))
    const from = vi.fn(() => ({ getPublicUrl }))
    const client = { storage: { from } } as unknown as SupabaseClient
    expect(getPublicAvatarUrl(client, 'u1/a.png')).toBe('https://p/a.png')
    expect(from).toHaveBeenCalledWith('avatars')
  })
})
