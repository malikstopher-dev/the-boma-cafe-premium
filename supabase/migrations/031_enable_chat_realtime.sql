-- ============================================================
-- Migration 031: Enable Realtime for Staff Chat Tables
-- Required for live message updates, unread badges, and
-- real-time chat functionality.
-- ============================================================

-- Add staff_messages to Supabase Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE staff_messages;

-- Use REPLICA IDENTITY FULL so Realtime sends the full row on UPDATE/DELETE
ALTER TABLE staff_messages REPLICA IDENTITY FULL;
