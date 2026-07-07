import { getAdminClient } from '../src/lib/supabase'

async function main() {
  const client = getAdminClient()

  // order_events has ON DELETE CASCADE from orders — deleting orders auto-cleans events
  console.log('Clearing orders (and cascaded order_events)...')
  const { count, error } = await client
    .from('orders')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) {
    console.error('Delete error:', error.message)
    process.exit(1)
  }

  console.log(`  ✓ ${count ?? 0} orders deleted (order_events cascaded)`)
  console.log('Analytics will now show zero data.')
}

main().catch(console.error)
