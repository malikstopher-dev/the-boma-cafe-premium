import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { count, error } = await supabase
  .from('orders')
  .delete()
  .neq('id', '00000000-0000-0000-0000-000000000000')

if (error) {
  console.error('Delete error:', error.message)
  process.exit(1)
}

console.log(`✓ ${count ?? 0} orders deleted (order_events cascaded)`)
