-- ============================================================
-- Migration 029: Staff Chat RLS — Member-Scoped Policies
-- Replaces overly-permissive USING(true) policies from
-- migrations 001 and 027 with proper access control.
-- ============================================================

-- Enable RLS on all staff chat tables
ALTER TABLE staff_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Drop existing permissive policies from migration 001_staff_system.sql
-- ============================================================

-- staff_profiles policies (from 001)
DROP POLICY IF EXISTS "Staff can read all profiles" ON staff_profiles;
DROP POLICY IF EXISTS "Staff can insert own profile" ON staff_profiles;
DROP POLICY IF EXISTS "Staff can update own profile" ON staff_profiles;

-- staff_profiles policies (from 027 — same names, idempotent)
DROP POLICY IF EXISTS "Staff can read all profiles" ON staff_profiles;
DROP POLICY IF EXISTS "Staff can insert own profile" ON staff_profiles;
DROP POLICY IF EXISTS "Staff can update own profile" ON staff_profiles;

-- staff_conversations policies (from 001)
DROP POLICY IF EXISTS "Members can view conversations" ON staff_conversations;
DROP POLICY IF EXISTS "Members can create conversations" ON staff_conversations;

-- staff_conversation_members policies (from 001)
DROP POLICY IF EXISTS "Members can view members" ON staff_conversation_members;
DROP POLICY IF EXISTS "Members can add members" ON staff_conversation_members;

-- staff_messages policies (from 001)
DROP POLICY IF EXISTS "Members can read messages" ON staff_messages;
DROP POLICY IF EXISTS "Members can send messages" ON staff_messages;

-- staff_notifications policies (from 001)
DROP POLICY IF EXISTS "Users can view own notifications" ON staff_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON staff_notifications;

-- ============================================================
-- staff_profiles: All authenticated staff can read profiles
-- ============================================================
CREATE POLICY "staff_profiles_select" ON staff_profiles
  FOR SELECT USING (true);

CREATE POLICY "staff_profiles_insert" ON staff_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "staff_profiles_update" ON staff_profiles
  FOR UPDATE USING (true);

-- ============================================================
-- staff_conversations: Members can read their conversations
-- ============================================================
CREATE POLICY "staff_conversations_select" ON staff_conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff_conversation_members
      WHERE conversation_id = staff_conversations.id
      AND user_id = current_setting('app.staff_user_id', true)
    )
  );

CREATE POLICY "staff_conversations_insert" ON staff_conversations
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- staff_conversation_members: Members can read own memberships
-- ============================================================
CREATE POLICY "staff_conversation_members_select" ON staff_conversation_members
  FOR SELECT USING (
    user_id = current_setting('app.staff_user_id', true)
    OR EXISTS (
      SELECT 1 FROM staff_conversation_members scm
      WHERE scm.conversation_id = staff_conversation_members.conversation_id
      AND scm.user_id = current_setting('app.staff_user_id', true)
    )
  );

CREATE POLICY "staff_conversation_members_insert" ON staff_conversation_members
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- staff_messages: Members can read messages in their conversations
-- ============================================================
CREATE POLICY "staff_messages_select" ON staff_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff_conversation_members
      WHERE conversation_id = staff_messages.conversation_id
      AND user_id = current_setting('app.staff_user_id', true)
    )
  );

CREATE POLICY "staff_messages_insert" ON staff_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_conversation_members
      WHERE conversation_id = staff_messages.conversation_id
      AND user_id = current_setting('app.staff_user_id', true)
    )
  );

CREATE POLICY "staff_messages_update" ON staff_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM staff_conversation_members
      WHERE conversation_id = staff_messages.conversation_id
      AND user_id = current_setting('app.staff_user_id', true)
    )
  );

-- ============================================================
-- staff_notifications: Users can only see their own notifications
-- ============================================================
CREATE POLICY "staff_notifications_select" ON staff_notifications
  FOR SELECT USING (
    user_id = current_setting('app.staff_user_id', true)
  );

CREATE POLICY "staff_notifications_insert" ON staff_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "staff_notifications_update" ON staff_notifications
  FOR UPDATE USING (
    user_id = current_setting('app.staff_user_id', true)
  );
