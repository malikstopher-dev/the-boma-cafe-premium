// POST /api/staff/voice-upload — Get signed upload URL for voice note
// Body: { conversation_id: string, file_name: string, file_type: string }
// Returns: { upload_url, public_url }

import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole } from '@/lib/auth/requireRole'
import { getAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const role = await getRequestRole(request)
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { conversation_id, file_name, file_type } = body

    if (!conversation_id || !file_name) {
      return NextResponse.json({ error: 'conversation_id and file_name required' }, { status: 400 })
    }

    // Sanitize file name
    const safeName = file_name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `voice-notes/${conversation_id}/${safeName}`

    // Create signed upload URL using Supabase Storage
    const { data, error } = await getAdminClient()
      .storage
      .from('staff-media')
      .createSignedUploadUrl(filePath)

    if (error) {
      // If bucket doesn't exist, try to create it
      const { error: createError } = await getAdminClient()
        .storage
        .createBucket('staff-media', { public: true })

      if (createError && !createError.message?.includes('already exists')) {
        return NextResponse.json({ error: 'Failed to create storage bucket' }, { status: 500 })
      }

      // Retry signed URL
      const { data: retryData, error: retryError } = await getAdminClient()
        .storage
        .from('staff-media')
        .createSignedUploadUrl(filePath)

      if (retryError) {
        return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 })
      }

      const publicUrl = getAdminClient().storage.from('staff-media').getPublicUrl(filePath).data.publicUrl
      return NextResponse.json({ upload_url: retryData.signedUrl, public_url: publicUrl })
    }

    const publicUrl = getAdminClient().storage.from('staff-media').getPublicUrl(filePath).data.publicUrl
    return NextResponse.json({ upload_url: data.signedUrl, public_url: publicUrl })
  } catch (error) {
    console.error('[Voice Upload] Error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
