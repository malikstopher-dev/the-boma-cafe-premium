import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { getAdminClient } from './supabase'

export const BUCKET = 'boma-images'

export const VALID_MODULES = [
  'menu', 'gallery', 'heroes', 'promotions', 'events',
  'logos', 'marketing', 'staff', 'videos', 'temp',
] as const

export type MediaModule = typeof VALID_MODULES[number]

export const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'video/mp4', 'video/webm', 'application/pdf',
]

let _urlClient: ReturnType<typeof createClient> | null = null

function getUrlClient() {
  if (!_urlClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
    _urlClient = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
  }
  return _urlClient
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .toLowerCase()
    .replace(/_{2,}/g, '_')
}

export function generateStoragePath(module: string, filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
  const uuid = uuidv4()
  const base = sanitizeFilename(filename.replace(`.${ext}`, ''))
  return `${module}/${uuid}-${base}.${ext}`
}

export function getAssetUrl(asset: {
  url?: string | null
  storage_path?: string | null
  storagePath?: string | null
  bucket?: string | null
}): string {
  const storagePath = asset.storage_path || asset.storagePath
  if (storagePath) {
    const bucket = asset.bucket || BUCKET
    const client = getUrlClient()
    const { data } = client.storage.from(bucket).getPublicUrl(storagePath)
    return data.publicUrl
  }
  return asset.url || ''
}

export async function uploadFile(
  storagePath: string,
  file: File | Blob,
): Promise<void> {
  const client = await getAdminClient()
  const { error } = await client.storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type || undefined,
    upsert: true,
  })
  if (error) throw error
}

export async function deleteFile(storagePath: string): Promise<void> {
  const client = await getAdminClient()
  const { error } = await client.storage.from(BUCKET).remove([storagePath])
  if (error) throw error
}
