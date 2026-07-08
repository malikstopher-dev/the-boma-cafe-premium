import { OrderStatus } from '@/types/pos'

export type Role = 'admin' | 'kitchen' | 'waiter' | 'foh' | 'either'
export type OrderSource = 'online' | 'waiter' | 'any'

export type AllowedAction =
  | 'accept'
  | 'start_prep'
  | 'start_packing'
  | 'mark_ready'
  | 'pay'
  | 'cancel'
  | 'archive'
  | 'confirm_payment'
  | 'refund'

export interface Transition {
  from: OrderStatus
  to: OrderStatus
  action: AllowedAction
  label: string
  role: Role
  source: OrderSource
}

const TRANSITIONS: Transition[] = [
  // Online orders: admin must accept
  { from: 'pending',    to: 'confirmed',  action: 'accept',          label: 'Accept',          role: 'admin',   source: 'online' },
  // Waiter orders: kitchen can accept
  { from: 'pending',    to: 'confirmed',  action: 'accept',          label: 'Accept',          role: 'kitchen', source: 'waiter' },
  // Kitchen flow
  { from: 'confirmed',  to: 'preparing',  action: 'start_prep',      label: 'Start Prep',      role: 'kitchen', source: 'any' },
  { from: 'preparing',  to: 'packing',    action: 'start_packing',   label: 'Start Packing',   role: 'kitchen', source: 'any' },
  { from: 'packing',    to: 'ready',      action: 'mark_ready',      label: 'Mark Ready',      role: 'kitchen', source: 'any' },
  // Cancel: either role, any source
  { from: 'pending',    to: 'cancelled',  action: 'cancel',          label: 'Cancel',          role: 'either',  source: 'any' },
  { from: 'confirmed',  to: 'cancelled',  action: 'cancel',          label: 'Cancel',          role: 'either',  source: 'any' },
  { from: 'preparing',  to: 'cancelled',  action: 'cancel',          label: 'Cancel',          role: 'either',  source: 'any' },
  { from: 'packing',    to: 'cancelled',  action: 'cancel',          label: 'Cancel',          role: 'either',  source: 'any' },
  // Payment / completion
  { from: 'ready',      to: 'completed',  action: 'pay',             label: 'Mark Paid',       role: 'foh',     source: 'any' },
  { from: 'completed',  to: 'completed',  action: 'archive',         label: 'Archive',         role: 'foh',     source: 'any' },
  { from: 'pending',    to: 'confirmed',  action: 'confirm_payment', label: 'Confirm Payment', role: 'foh',     source: 'any' },
  { from: 'confirmed',  to: 'confirmed',  action: 'confirm_payment', label: 'Confirm Payment', role: 'foh',     source: 'any' },
  // Admin-only: reject online orders
  { from: 'pending',    to: 'rejected',   action: 'cancel',          label: 'Reject',          role: 'admin',   source: 'online' },
]

function roleMatches(transitionRole: Role, checkRole: Role | undefined): boolean {
  if (!checkRole) return true
  if (transitionRole === 'either') return true
  if (checkRole === 'either') return true
  if (transitionRole === checkRole) return true
  // Admin can perform foh (front-of-house) actions (pay, archive, confirm_payment)
  if (transitionRole === 'foh' && checkRole === 'admin') return true
  return false
}

function sourceMatches(transitionSource: OrderSource, checkSource: string | undefined): boolean {
  if (!checkSource) return transitionSource === 'any' || transitionSource === 'online'
  if (transitionSource === 'any') return true
  return transitionSource === checkSource
}

export function getAvailableTransitions(
  currentStatus: OrderStatus,
  role: Role = 'either',
  source: string = 'online',
): Transition[] {
  return TRANSITIONS.filter(
    (t) => t.from === currentStatus && roleMatches(t.role, role) && sourceMatches(t.source, source)
  )
}

export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
  role?: Role,
  source?: string,
): boolean {
  return TRANSITIONS.some(
    (t) => t.from === from && t.to === to && roleMatches(t.role, role) && sourceMatches(t.source, source)
  )
}

export function transition(
  currentStatus: OrderStatus,
  action: AllowedAction,
  role: Role,
  source: string = 'online',
): OrderStatus | null {
  const t = TRANSITIONS.find(
    (t) => t.from === currentStatus && t.action === action && roleMatches(t.role, role) && sourceMatches(t.source, source)
  )
  return t?.to ?? null
}

export function getNextStatus(currentStatus: OrderStatus, action: AllowedAction): OrderStatus | null {
  const t = TRANSITIONS.find((t) => t.from === currentStatus && t.action === action)
  return t?.to ?? null
}

export function getTransitionLabel(currentStatus: OrderStatus, action: AllowedAction): string | null {
  const t = TRANSITIONS.find((t) => t.from === currentStatus && t.action === action)
  return t?.label ?? null
}

/** Order types that require payment confirmation before processing */
export function requiresPaymentConfirmation(orderType: string): boolean {
  return orderType !== 'dine-in'
}

/** Status transitions that require payment confirmation */
export function paymentRequiredForTransition(toStatus: string): boolean {
  return ['confirmed', 'preparing', 'packing', 'ready', 'completed'].includes(toStatus)
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'NEW',
  confirmed: 'ACCEPTED',
  preparing: 'IN PREP',
  packing: 'PACKING',
  ready: 'READY',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
  rejected: 'REJECTED',
}

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  preparing: '#8b5cf6',
  packing: '#f97316',
  ready: '#10b981',
  completed: '#6b7280',
  cancelled: '#ef4444',
  rejected: '#ef4444',
}

export function getAllowedTransitions(
  currentStatus: OrderStatus,
  role: Role,
  source: string = 'online',
): AllowedAction[] {
  return getAvailableTransitions(currentStatus, role, source).map(t => t.action)
}
