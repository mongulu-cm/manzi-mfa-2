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
  const rule = Object.prototype.hasOwnProperty.call(RULES, bucket) ? RULES[bucket] : undefined
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

export function buildStoragePath(userId: string, bucket: StorageBucket, filename: string): string {
  const sanitized = filename
    .replace(/[\\/]+/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/^[._]+|[._]+$/g, '')
  const fallback = bucket === 'avatars' ? 'avatar' : 'cv.pdf'
  return `${userId}/${sanitized || fallback}`
}

export async function createSignedDocumentUrl(
  client: SupabaseClient,
  userId: string,
  path: string,
  expiresInSeconds = 3600,
): Promise<string> {
  // userId vient de l'identité vérifiée ; le chemin doit rester identique après normalisation HTTP.
  const [folder, filename, ...remaining] = path.split('/')
  if (folder !== userId || !userId || /[^A-Za-z0-9-]/.test(userId)
    || !filename || /[^A-Za-z0-9._-]/.test(filename)
    || filename === '.' || filename === '..' || remaining.length > 0) {
    throw new Error('Accès non autorisé au document')
  }
  const { data, error } = await client.storage.from('documents').createSignedUrl(path, expiresInSeconds)
  if (error || !data?.signedUrl) {
    throw new Error('Impossible de générer l\'URL signée du document')
  }
  return data.signedUrl
}

export function getPublicAvatarUrl(client: SupabaseClient, path: string): string {
  return client.storage.from('avatars').getPublicUrl(path).data.publicUrl
}
