const TRANSITIONS = [
  { from: 'pending',    to: 'confirmed',  action: 'accept',          role: 'admin',   source: 'online' },
  { from: 'confirmed',  to: 'preparing',  action: 'start_prep',      role: 'kitchen', source: 'any' },
  { from: 'preparing',  to: 'ready',      action: 'mark_ready',      role: 'kitchen', source: 'any' },
  { from: 'ready',      to: 'completed',  action: 'pay',             role: 'foh',     source: 'any' },
  { from: 'pending',    to: 'preparing',  action: 'start_prep',      role: 'kitchen', source: 'waiter' },
  { from: 'pending',    to: 'preparing',  action: 'start_prep',      role: 'bar',     source: 'waiter' },
  { from: 'preparing',  to: 'ready',      action: 'mark_ready',      role: 'kitchen', source: 'waiter' },
  { from: 'preparing',  to: 'ready',      action: 'mark_ready',      role: 'bar',     source: 'waiter' },
  { from: 'ready',      to: 'served',     action: 'mark_served',     role: 'waiter',  source: 'waiter' },
  { from: 'served',     to: 'completed',  action: 'pay',             role: 'waiter',  source: 'waiter' },
  { from: 'pending',    to: 'cancelled',  action: 'cancel',          role: 'either',  source: 'any' },
  { from: 'completed',  to: 'completed',  action: 'archive',         role: 'foh',     source: 'any' },
  { from: 'packing',    to: 'ready',      action: 'mark_ready',      role: 'kitchen', source: 'any' },
]

function roleMatches(tRole, cRole) {
  if (!cRole) return true
  if (tRole === 'either') return true
  if (cRole === 'either') return true
  if (tRole === cRole) return true
  if (tRole === 'foh' && cRole === 'admin') return true
  return false
}

function sourceMatches(tSrc, cSrc) {
  if (!cSrc) return tSrc === 'any' || tSrc === 'online'
  if (tSrc === 'any') return true
  return tSrc === cSrc
}

function can(from, to, role, src) {
  return TRANSITIONS.some(t => t.from === from && t.to === to && roleMatches(t.role, role) && sourceMatches(t.source, src))
}

function actions(from, role, src) {
  return TRANSITIONS.filter(t => t.from === from && roleMatches(t.role, role) && sourceMatches(t.source, src)).map(t => t.action)
}

let p = 0, f = 0
function t(name, fn) {
  try {
    fn()
    p++
    console.log('  OK ' + name)
  } catch (e) {
    f++
    console.log('  FAIL ' + name + ': ' + e.message)
  }
}

console.log('--- Online Workflow ---')
t('online pending->confirmed (admin)', () => { if (!can('pending','confirmed','admin','online')) throw Error('1') })
t('online pending->confirmed (kitchen FAIL)', () => { if (can('pending','confirmed','kitchen','online')) throw Error('1') })
t('online confirmed->preparing (kitchen)', () => { if (!can('confirmed','preparing','kitchen','online')) throw Error('1') })
t('online preparing->ready (kitchen)', () => { if (!can('preparing','ready','kitchen','online')) throw Error('1') })
t('online ready->completed (admin)', () => { if (!can('ready','completed','admin','online')) throw Error('1') })
t('online ready->completed (kitchen FAIL)', () => { if (can('ready','completed','kitchen','online')) throw Error('1') })

console.log('--- Waiter Workflow ---')
t('waiter pending->preparing (kitchen)', () => { if (!can('pending','preparing','kitchen','waiter')) throw Error('1') })
t('waiter pending->preparing (bar)', () => { if (!can('pending','preparing','bar','waiter')) throw Error('1') })
t('waiter pending->preparing (waiter FAIL)', () => { if (can('pending','preparing','waiter','waiter')) throw Error('1') })
t('waiter pending->confirmed (admin FAIL)', () => { if (can('pending','confirmed','admin','waiter')) throw Error('1') })
t('waiter preparing->ready (kitchen)', () => { if (!can('preparing','ready','kitchen','waiter')) throw Error('1') })
t('waiter ready->served (waiter)', () => { if (!can('ready','served','waiter','waiter')) throw Error('1') })
t('waiter ready->served (kitchen FAIL)', () => { if (can('ready','served','kitchen','waiter')) throw Error('1') })
t('waiter served->completed (waiter)', () => { if (!can('served','completed','waiter','waiter')) throw Error('1') })
t('waiter served->completed (admin FAIL)', () => { if (can('served','completed','admin','waiter')) throw Error('1') })

console.log('--- Payment Rules ---')
t('confirm_payment online pending->confirmed', () => { if (!can('pending','confirmed','admin','online')) throw Error('1') })
t('confirm_payment NOT for waiter', () => { const a = actions('pending','admin','waiter'); if (a.includes('confirm_payment')) throw Error('1') })

console.log('--- Legacy Packing ---')
t('packing->ready (kitchen)', () => { if (!can('packing','ready','kitchen','any')) throw Error('1') })

console.log('--- Negative ---')
t('online pending->served FAIL', () => { if (can('pending','served','kitchen','online')) throw Error('1') })
t('online ready->served FAIL', () => { if (can('ready','served','admin','online')) throw Error('1') })
t('waiter pending->confirmed FAIL', () => { if (can('pending','confirmed','kitchen','waiter')) throw Error('1') })
t('completed->anything FAIL', () => { if (can('completed','preparing','admin','any')) throw Error('1') })
t('admin not start_prep waiter', () => { if (can('pending','preparing','admin','waiter')) throw Error('1') })
t('admin not mark_served waiter', () => { if (can('ready','served','admin','waiter')) throw Error('1') })
t('admin not mark_ready waiter', () => { const a = actions('preparing','admin','waiter'); if (a.includes('mark_ready')) throw Error('1') })

console.log('')
console.log(p + ' passed, ' + f + ' failed')
process.exit(f > 0 ? 1 : 0)
