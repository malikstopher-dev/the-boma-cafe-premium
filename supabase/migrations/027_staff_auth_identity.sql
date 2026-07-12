-- ============================================================
-- Migration 027: Staff Identity, PINs, Sessions, Audit
-- Restaurant-grade authentication system
-- ============================================================

-- 1. Extend staff_profiles with Employee ID, PIN hash, session fields
ALTER TABLE staff_profiles
  ADD COLUMN IF NOT EXISTS employee_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS pin_salt TEXT,
  ADD COLUMN IF NOT EXISTS pin_set_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pin_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS device_id TEXT,
  ADD COLUMN IF NOT EXISTS session_started_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_profiles_employee_id ON staff_profiles(employee_id);

-- Allow 'bar' role (existing constraint only allows admin/kitchen/waiter)
ALTER TABLE staff_profiles DROP CONSTRAINT IF EXISTS staff_profiles_role_check;
ALTER TABLE staff_profiles ADD CONSTRAINT staff_profiles_role_check
  CHECK (role IN ('admin', 'kitchen', 'waiter', 'bar', 'manager'));

-- 2. Active sessions (for multi-device tracking + remote sign-out)
CREATE TABLE IF NOT EXISTS staff_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  device_fingerprint TEXT,
  device_name TEXT,
  user_agent TEXT,
  ip_address TEXT,
  role TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  signed_out_at TIMESTAMPTZ,
  signed_out_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_staff_sessions_staff ON staff_sessions(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_token ON staff_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_expires ON staff_sessions(expires_at);

ALTER TABLE staff_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read all sessions"
  ON staff_sessions FOR SELECT
  USING (true);

CREATE POLICY "Staff can insert sessions"
  ON staff_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff can update sessions"
  ON staff_sessions FOR UPDATE
  USING (true);

-- 3. Shifts (track open/close, hours worked)
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  ending_cash DECIMAL(10,2),
  expected_cash DECIMAL(10,2),
  variance DECIMAL(10,2),
  notes TEXT,
  closed_by UUID REFERENCES staff_profiles(id),
  closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_shifts_staff ON shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_shifts_active ON shifts(ended_at) WHERE ended_at IS NULL;

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read all shifts"
  ON shifts FOR SELECT
  USING (true);

CREATE POLICY "Staff can insert shifts"
  ON shifts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff can update shifts"
  ON shifts FOR UPDATE
  USING (true);

-- 4. Universal audit log
CREATE TABLE IF NOT EXISTS staff_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES staff_profiles(id),
  actor_name TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB,
  ip_address TEXT,
  device_fingerprint TEXT,
  manager_approval_id UUID REFERENCES staff_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON staff_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON staff_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON staff_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target ON staff_audit_log(target_type, target_id);

ALTER TABLE staff_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read all audit log"
  ON staff_audit_log FOR SELECT
  USING (true);

CREATE POLICY "Staff can insert audit log"
  ON staff_audit_log FOR INSERT
  WITH CHECK (true);

-- 5. Manager PIN overrides (track who approved what)
CREATE TABLE IF NOT EXISTS manager_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES staff_profiles(id),
  manager_employee_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  reason TEXT,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE manager_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read all manager approvals"
  ON manager_approvals FOR SELECT
  USING (true);

CREATE POLICY "Staff can insert manager approvals"
  ON manager_approvals FOR INSERT
  WITH CHECK (true);

-- 6. Add employee_id tracking to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES staff_profiles(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_by_employee_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_by_employee_id TEXT;

-- 7. Add actor tracking to order_events
ALTER TABLE order_events ADD COLUMN IF NOT EXISTS actor_employee_id TEXT;

-- 8. Add voice_duration to staff_messages
ALTER TABLE staff_messages ADD COLUMN IF NOT EXISTS voice_duration INTEGER;
