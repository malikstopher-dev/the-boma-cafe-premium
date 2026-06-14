import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

console.log('URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  const { data: sample, error: sampleError } = await supabase
    .from('orders')
    .select('*')
    .limit(1)

  if (sampleError) {
    console.error('Sample error:', sampleError.message)
    process.exit(1)
  }

  if (sample && sample.length > 0) {
    console.log('\nSAMPLE ORDER:')
    console.log(JSON.stringify(sample[0], null, 2))
    console.log('\nCOLUMNS:')
    console.log(Object.keys(sample[0]).join('\n'))
  } else {
    console.log('Orders table is empty (0 rows)')
    // Try to get column info by doing an insert attempt
    const { error: insertErr } = await supabase
      .from('orders')
      .insert({ customer_name: '__test__', phone: '__test__', order_type: 'pickup', request_time: 'now', items_json: '{}' })
      .select()
      .limit(1)
    if (insertErr) {
      console.log('Insert diagnostic error:', insertErr.message)
    }
  }
}

main().catch(console.error)
