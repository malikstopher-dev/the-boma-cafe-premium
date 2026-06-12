import { OrderStatus } from '@/types/pos'

export type AllowedAction =
  | 'accept'
  | 'start_prep'
  | 'mark_ready'
  | 'pay'
  | 'cancel'
  | 'archive'

export interface Transition {
  from: OrderStatus
  to: OrderStatus
  action: AllowedAction
  label: string
  role: 'foh' | 'kitchen' | 'either'
}

const TRANSITIONS: Transition[] = [
  { from: 'pending',    to: 'confirmed',  action: 'accept',     label: 'Accept',       role: 'kitchen' },
  { from: 'confirmed',  to: 'preparing',  action: 'start_prep', label: 'Start Prep',   role: 'kitchen' },
  { from: 'preparing',  to: 'ready',      action: 'mark_ready', label: 'Mark Ready',   role: 'kitchen' },
  { from: 'pending',    to: 'cancelled',  action: 'cancel',     label: 'Cancel',       role: 'either'  },
  { from: 'confirmed',  to: 'cancelled',  action: 'cancel',     label: 'Cancel',       role: 'either'  },
  { from: 'preparing',  to: 'cancelled',  action: 'cancel',     label: 'Cancel',       role: 'either'  },
  { from: 'ready',      to: 'completed',  action: 'pay',        label: 'Mark Paid',    role: 'foh'     },
  { from: 'completed',  to: 'completed',  action: 'archive',    label: 'Archive',      role: 'foh'     },
]

export function getAvailableTransitions(currentStatus: OrderStatus, role: 'foh' | 'kitchen' | 'either' = 'either'): Transition[] {
  return TRANSITIONS.filter(
    (t) => t.from === currentStatus && (t.role === role || t.role === 'either' || role === 'either')
  )
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS.some((t) => t.from === from && t.to === to)
}

export function getNextStatus(currentStatus: OrderStatus, action: AllowedAction): OrderStatus | null {
  const t = TRANSITIONS.find((t) => t.from === currentStatus && t.action === action)
  return t?.to ?? null
}

export function getTransitionLabel(currentStatus: OrderStatus, action: AllowedAction): string | null {
  const t = TRANSITIONS.find((t) => t.from === currentStatus && t.action === action)
  return t?.label ?? null
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'NEW',
  confirmed: 'ACCEPTED',
  preparing: 'IN PREP',
  ready: 'READY',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
}

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  preparing: '#8b5cf6',
  ready: '#10b981',
  completed: '#6b7280',
  cancelled: '#ef4444',
}
