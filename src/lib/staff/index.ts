// Staff module — barrel export
export { hashPin, generateSalt, timingSafeCompare, verifyPin, setPin, resetPinByManager, getStaffByEmployeeId, getStaffById, isLocked, isPinExpired } from './auth'
export type { StaffProfile } from './auth'

export { createSession, validateSession, endSession, endAllSessionsForStaff, getActiveSessions, generateDeviceFingerprint } from './session'
export type { StaffSession } from './session'

export { canPerform, requiresManagerApproval, getManagerRequiredMessage, isAdmin, isWaiter, isKitchen, isBar } from './permissions'
export type { Role, Action } from './permissions'

export { logAudit, logOrderAudit, logMenuAudit, logAuthAudit, getAuditLog } from './audit'
