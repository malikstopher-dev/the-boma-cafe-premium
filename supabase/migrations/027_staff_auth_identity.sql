-- ============================================================
-- Migration 027: Staff Identity, PINs, Sessions, Audit
-- Restaurant-grade authentication system
-- SELF-CONTAINED: Creates base tables if they don't exist
-- ============================================================

-- ============================================================
-- 0. Create base staff tables if they don't exist (from 001)
-- ============================================================

-- Staff Profiles (base table)
CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'kitchen', 'waiter', 'bar', 'manager')),
  avatar_url TEXT,
  phone TEXT,
  on_duty BOOLEAN DEFAULT false,
  online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Staff Conversations (base table)
CREATE TABLE IF NOT EXISTS staff_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  is_group BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Staff Conversation Members (base table)
CREATE TABLE IF NOT EXISTS staff_conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES staff_conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Staff Messages (base table)
CREATE TABLE IF NOT EXISTS staff_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES staff_conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  message TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'system')),
  voice_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Staff Notifications (base table)
CREATE TABLE IF NOT EXISTS staff_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 1. Extend staff_profiles with Employee ID, PIN, session fields
-- ============================================================

DO $$ BEGIN
  -- employee_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_profiles' AND column_name = 'employee_id') THEN
    ALTER TABLE staff_profiles ADD COLUMN employee_id TEXT UNIQUE;
  END IF;
  -- pin_hash
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_profiles' AND column_name = 'pin_hash') THEN
    ALTER TABLE staff_profiles ADD COLUMN pin_hash TEXT;
  END IF;
  -- pin_salt
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_profiles' AND column_name = 'pin_salt') THEN
    ALTER TABLE staff_profiles ADD COLUMN pin_salt TEXT;
  END IF;
  -- pin_set_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_profiles' AND column_name = 'pin_set_at') THEN
    ALTER TABLE staff_profiles ADD COLUMN pin_set_at TIMESTAMPTZ;
  END IF;
  -- pin_expires_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_profiles' AND column_name = 'pin_expires_at') THEN
    ALTER TABLE staff_profiles ADD COLUMN pin_expires_at TIMESTAMPTZ;
  END IF;
  -- failed_attempts
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_profiles' AND column_name = 'failed_attempts') THEN
    ALTER TABLE staff_profiles ADD COLUMN failed_attempts INTEGER DEFAULT 0;
  END IF;
  -- locked_until
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_profiles' AND column_name = 'locked_until') THEN
    ALTER TABLE staff_profiles ADD COLUMN locked_until TIMESTAMPTZ;
  END IF;
  -- last_login_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_profiles' AND column_name = 'last_login_at') THEN
    ALTER TABLE staff_profiles ADD COLUMN last_login_at TIMESTAMPTZ;
  END IF;
  -- device_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_profiles' AND column_name = 'device_id') THEN
    ALTER TABLE staff_profiles ADD COLUMN device_id TEXT;
  END IF;
  -- session_started_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_profiles' AND column_name = 'session_started_at') THEN
    ALTER TABLE staff_profiles ADD COLUMN session_started_at TIMESTAMPTZ;
  END IF;
END $$;

-- Index on employee_id
CREATE INDEX IF NOT EXISTS idx_staff_profiles_employee_id ON staff_profiles(employee_id);

-- ============================================================
-- 2. Staff Sessions table
-- ============================================================

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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_sessions' AND policyname = 'Staff can read all sessions') THEN
    CREATE POLICY "Staff can read all sessions" ON staff_sessions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_sessions' AND policyname = 'Staff can insert sessions') THEN
    CREATE POLICY "Staff can insert sessions" ON staff_sessions FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_sessions' AND policyname = 'Staff can update sessions') THEN
    CREATE POLICY "Staff can update sessions" ON staff_sessions FOR UPDATE USING (true);
  END IF;
END $$;

-- ============================================================
-- 3. Shifts table
-- ============================================================

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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shifts' AND policyname = 'Staff can read all shifts') THEN
    CREATE POLICY "Staff can read all shifts" ON shifts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shifts' AND policyname = 'Staff can insert shifts') THEN
    CREATE POLICY "Staff can insert shifts" ON shifts FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shifts' AND policyname = 'Staff can update shifts') THEN
    CREATE POLICY "Staff can update shifts" ON shifts FOR UPDATE USING (true);
  END IF;
END $$;

-- ============================================================
-- 4. Universal Audit Log
-- ============================================================

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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_audit_log' AND policyname = 'Staff can read all audit log') THEN
    CREATE POLICY "Staff can read all audit log" ON staff_audit_log FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_audit_log' AND policyname = 'Staff can insert audit log') THEN
    CREATE POLICY "Staff can insert audit log" ON staff_audit_log FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 5. Manager Approvals
-- ============================================================

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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'manager_approvals' AND policyname = 'Staff can read all manager approvals') THEN
    CREATE POLICY "Staff can read all manager approvals" ON manager_approvals FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'manager_approvals' AND policyname = 'Staff can insert manager approvals') THEN
    CREATE POLICY "Staff can insert manager approvals" ON manager_approvals FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 6. Extend orders with staff tracking
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'staff_id') THEN
    ALTER TABLE orders ADD COLUMN staff_id UUID REFERENCES staff_profiles(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'created_by_employee_id') THEN
    ALTER TABLE orders ADD COLUMN created_by_employee_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'updated_by_employee_id') THEN
    ALTER TABLE orders ADD COLUMN updated_by_employee_id TEXT;
  END IF;
END $$;

-- ============================================================
-- 7. Extend order_events with actor tracking
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_events' AND column_name = 'actor_employee_id') THEN
    ALTER TABLE order_events ADD COLUMN actor_employee_id TEXT;
  END IF;
END $$;

-- ============================================================
-- 8. Extend staff_messages with voice_duration
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_messages' AND column_name = 'voice_duration') THEN
    ALTER TABLE staff_messages ADD COLUMN voice_duration INTEGER;
  END IF;
END $$;

-- ============================================================
-- 9. RLS for base tables (if not already set)
-- ============================================================

-- staff_profiles RLS
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_profiles' AND policyname = 'Staff can read all profiles') THEN
    CREATE POLICY "Staff can read all profiles" ON staff_profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_profiles' AND policyname = 'Staff can insert own profile') THEN
    CREATE POLICY "Staff can insert own profile" ON staff_profiles FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_profiles' AND policyname = 'Staff can update own profile') THEN
    CREATE POLICY "Staff can update own profile" ON staff_profiles FOR UPDATE USING (true);
  END IF;
END $$;

-- staff_conversations RLS
ALTER TABLE staff_conversations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_conversations' AND policyname = 'Members can view conversations') THEN
    CREATE POLICY "Members can view conversations" ON staff_conversations FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_conversations' AND policyname = 'Members can create conversations') THEN
    CREATE POLICY "Members can create conversations" ON staff_conversations FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- staff_conversation_members RLS
ALTER TABLE staff_conversation_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_conversation_members' AND policyname = 'Members can view members') THEN
    CREATE POLICY "Members can view members" ON staff_conversation_members FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_conversation_members' AND policyname = 'Members can add members') THEN
    CREATE POLICY "Members can add members" ON staff_conversation_members FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- staff_messages RLS
ALTER TABLE staff_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_messages' AND policyname = 'Members can read messages') THEN
    CREATE POLICY "Members can read messages" ON staff_messages FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_messages' AND policyname = 'Members can send messages') THEN
    CREATE POLICY "Members can send messages" ON staff_messages FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- staff_notifications RLS
ALTER TABLE staff_notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_notifications' AND policyname = 'Users can view own notifications') THEN
    CREATE POLICY "Users can view own notifications" ON staff_notifications FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_notifications' AND policyname = 'Users can update own notifications') THEN
    CREATE POLICY "Users can update own notifications" ON staff_notifications FOR UPDATE USING (true);
  END IF;
END $$;

-- ============================================================
-- 10. Base table indexes (if not already set)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_staff_messages_conversation ON staff_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_staff_conversation_members_user ON staff_conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_notifications_user ON staff_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_role ON staff_profiles(role);
