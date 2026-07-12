// Staff Audit Logging — Universal action tracking
import { getAdminClient } from '@/lib/supabase'

interface AuditEntry {
  actorId?: string
  actorName?: string
  actorRole?: string
  action: string
  targetType?: string
  targetId?: string
  details?: Record<string, any>
  ipAddress?: string
  deviceFingerprint?: string
  managerApprovalId?: string
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await getAdminClient()
      .from('staff_audit_log')
      .insert({
        actor_id: entry.actorId || null,
        actor_name: entry.actorName || null,
        actor_role: entry.actorRole || null,
        action: entry.action,
        target_type: entry.targetType || null,
        target_id: entry.targetId || null,
        details: entry.details || {},
        ip_address: entry.ipAddress || null,
        device_fingerprint: entry.deviceFingerprint || null,
        manager_approval_id: entry.managerApprovalId || null,
      })
  } catch (err) {
    // Audit logging should never block the main operation
    console.error('[Audit] Failed to log:', err)
  }
}

export async function logOrderAudit(
  orderId: string,
  action: string,
  actorId?: string,
  actorName?: string,
  actorRole?: string,
  details?: Record<string, any>,
  managerApprovalId?: string
): Promise<void> {
  await logAudit({
    actorId,
    actorName,
    actorRole,
    action,
    targetType: 'order',
    targetId: orderId,
    details,
    managerApprovalId,
  })
}

export async function logMenuAudit(
  itemId: string,
  action: string,
  actorId?: string,
  actorName?: string,
  details?: Record<string, any>
): Promise<void> {
  await logAudit({
    actorId,
    actorName,
    action,
    targetType: 'menu_item',
    targetId: itemId,
    details,
  })
}

export async function logAuthAudit(
  staffId: string,
  action: string,
  details?: Record<string, any>
): Promise<void> {
  await logAudit({
    actorId: staffId,
    action,
    targetType: 'staff',
    targetId: staffId,
    details,
  })
}

export async function getAuditLog(filters?: {
  actorId?: string
  action?: string
  targetType?: string
  targetId?: string
  limit?: number
  offset?: number
}): Promise<any[]> {
  let query = getAdminClient()
    .from('staff_audit_log')
    .select('*, staff_profiles!actor_id(name, employee_id, role)')
    .order('created_at', { ascending: false })

  if (filters?.actorId) query = query.eq('actor_id', filters.actorId)
  if (filters?.action) query = query.eq('action', filters.action)
  if (filters?.targetType) query = query.eq('target_type', filters.targetType)
  if (filters?.targetId) query = query.eq('target_id', filters.targetId)

  query = query.limit(filters?.limit || 100)
  if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1)

  const { data } = await query
  return data || []
}
