import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = typeof process !== 'undefined' ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined
const supabaseAnonKey = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined

let _adminClient: SupabaseClient<any> | null = null

export function getAdminClient(): SupabaseClient<any> {
  if (_adminClient) return _adminClient
  const key = supabaseServiceRoleKey
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  }
  _adminClient = createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return _adminClient
}

export function createBrowserClient(): SupabaseClient<any> {
  const key = supabaseAnonKey
  if (!key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required')
  }
  return createClient(supabaseUrl, key)
}
