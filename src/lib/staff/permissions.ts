// Staff Permissions — Role-based access control matrix
// Defines who can do what, and which actions require manager approval

export type Role = 'admin' | 'kitchen' | 'waiter' | 'bar' | 'manager'

export type Action =
  | 'order.create'
  | 'order.edit_before_send'
  | 'order.edit_after_send'
  | 'order.cancel_before_send'
  | 'order.cancel_after_send'
  | 'order.void'
  | 'order.mark_food_accepted'
  | 'order.mark_food_preparing'
  | 'order.mark_food_ready'
  | 'order.mark_food_served'
  | 'order.mark_drink_accepted'
  | 'order.mark_drink_preparing'
  | 'order.mark_drink_ready'
  | 'order.mark_drink_served'
  | 'discount.apply'
  | 'refund.issue'
  | 'table.transfer'
  | 'table.reattach'
  | 'menu.create'
  | 'menu.update'
  | 'menu.delete'
  | 'staff.manage'
  | 'announcement.send'
  | 'session.force_logout'

// Actions that require manager PIN approval
export const MANAGER_REQUIRED_ACTIONS: Action[] = [
  'order.edit_after_send',
  'order.cancel_after_send',
  'order.void',
  'discount.apply',
  'refund.issue',
  'table.transfer',
  'table.reattach',
  'session.force_logout',
]

// Permission matrix: role → allowed actions
const PERMISSIONS: Record<Role, Action[]> = {
  admin: [
    'order.create', 'order.edit_before_send', 'order.edit_after_send',
    'order.cancel_before_send', 'order.cancel_after_send', 'order.void',
    'order.mark_food_accepted', 'order.mark_food_preparing', 'order.mark_food_ready', 'order.mark_food_served',
    'order.mark_drink_accepted', 'order.mark_drink_preparing', 'order.mark_drink_ready', 'order.mark_drink_served',
    'discount.apply', 'refund.issue', 'table.transfer', 'table.reattach',
    'menu.create', 'menu.update', 'menu.delete',
    'staff.manage', 'announcement.send', 'session.force_logout',
  ],
  manager: [
    'order.create', 'order.edit_before_send', 'order.edit_after_send',
    'order.cancel_before_send', 'order.cancel_after_send', 'order.void',
    'order.mark_food_accepted', 'order.mark_food_preparing', 'order.mark_food_ready', 'order.mark_food_served',
    'order.mark_drink_accepted', 'order.mark_drink_preparing', 'order.mark_drink_ready', 'order.mark_drink_served',
    'discount.apply', 'refund.issue', 'table.transfer', 'table.reattach',
    'menu.create', 'menu.update', 'menu.delete',
    'staff.manage', 'announcement.send', 'session.force_logout',
  ],
  waiter: [
    'order.create',
    'order.edit_before_send',
    'order.cancel_before_send',
    'order.mark_food_served',
    'order.mark_drink_served',
  ],
  kitchen: [
    'order.mark_food_accepted',
    'order.mark_food_preparing',
    'order.mark_food_ready',
  ],
  bar: [
    'order.mark_drink_accepted',
    'order.mark_drink_preparing',
    'order.mark_drink_ready',
  ],
}

export function canPerform(role: Role, action: Action): boolean {
  return PERMISSIONS[role]?.includes(action) ?? false
}

export function requiresManagerApproval(action: Action): boolean {
  return MANAGER_REQUIRED_ACTIONS.includes(action)
}

export function getManagerRequiredMessage(action: Action): string {
  const messages: Record<string, string> = {
    'order.edit_after_send': 'Editing a sent order requires manager approval',
    'order.cancel_after_send': 'Cancelling a sent order requires manager approval',
    'order.void': 'Voiding an order requires manager approval',
    'discount.apply': 'Applying a discount requires manager approval',
    'refund.issue': 'Issuing a refund requires manager approval',
    'table.transfer': 'Transferring a table requires manager approval',
    'table.reattach': 'Reattaching a table requires manager approval',
    'session.force_logout': 'Force logout requires manager approval',
  }
  return messages[action] || 'This action requires manager approval'
}

export function isWaiter(role: Role): boolean {
  return role === 'waiter'
}

export function isKitchen(role: Role): boolean {
  return role === 'kitchen'
}

export function isBar(role: Role): boolean {
  return role === 'bar'
}

export function isAdmin(role: Role): boolean {
  return role === 'admin' || role === 'manager'
}
