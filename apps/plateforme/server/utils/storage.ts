import type { SupabaseClient } from '@supabase/supabase-js'

export type StorageBucket = 'avatars' | 'documents'

const RULES: Record<StorageBucket, { mimeTypes: string[], maxBytes: number }> = {
  avatars: { mimeTypes: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 2097152 },
  documents: { mimeTypes: ['application/pdf'], maxBytes: 5242880 },
}

export function validateFilePayload(
  mimeType: string,
  sizeBytes: number,
  bucket: StorageBucket,
): { valid: boolean, error?: string } {
  const rule = RULES[bucket]
  if (!rule) return { valid: false, error: 'Bucket inconnu' }
  if (!rule.mimeTypes.includes(mimeType)) {
    return { valid: false, error: `Type de fichier non autorisé : ${mimeType}` }
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return { valid: false, error: 'Taille de fichier invalide' }
  }
  if (sizeBytes > rule.maxBytes) {
    return { valid: false, error: `Fichier trop volumineux (max ${rule.maxBytes} octets)` }
  }
  return { valid: true }
}

export function buildStoragePath(userId: string, _bucket: StorageBucket, filename: string): string {
  const sanitized = filename
    .replace(/[\\/]+/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/^[._]+|[._]+$/g, '')
  return `${userId}/${sanitized || 'file'}`
}

export async function createSignedDocumentUrl(
  client: SupabaseClient,
  path: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const { data, error } = await client.storage.from('documents').createSignedUrl(path, expiresInSeconds)
  if (error || !data?.signedUrl) {
    throw new Error('Impossible de générer l\'URL signée du document')
  }
  return data.signedUrl
}

export function getPublicAvatarUrl(client: SupabaseClient, path: string): string {
  return client.storage.from('avatars').getPublicUrl(path).data.publicUrl
}
