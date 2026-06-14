import { createClient } from '@supabase/supabase-js'

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars')
    process.exit(1)
  }

  console.log('URL:', supabaseUrl)
  console.log('Key present:', !!supabaseKey)

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Get a sample order to see column structure
  const { data: sample, error: sampleError } = await supabase
    .from('orders')
    .select('*')
    .limit(1)

  if (sampleError) {
    console.error('Sample error:', sampleError.message)
    process.exit(1)
  }

  if (sample && sample.length > 0) {
    console.log('\n=== SAMPLE ORDER ===')
    console.log(JSON.stringify(sample[0], null, 2))
    console.log('\n=== COLUMNS ===')
    console.log(Object.keys(sample[0]).join('\n'))
  } else {
    console.log('Table is empty, trying to get column info via insert attempt...')
    // Try inserting a minimal row to see required columns
    const { error: insertError } = await supabase
      .from('orders')
      .insert({})
      .select('*')
      .limit(1)
    
    if (insertError) {
      console.log('Insert error (expected):', insertError.message)
    }
  }

  // Check if unique constraint exists on order_ref
  const { data: uniqCheck, error: uniqError } = await supabase
    .from('orders')
    .select('order_ref', { count: 'exact', head: true })

  if (uniqError) {
    console.error('Unique check error:', uniqError.message)
  } else {
    console.log('\nTotal orders:', uniqCheck?.length ?? 'unknown')
  }
}

main().catch(console.error)
