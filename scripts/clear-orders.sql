-- WARNING: This will permanently delete ALL orders and order events.
-- Run this in Supabase Dashboard > SQL Editor.

BEGIN;

-- Verify we're not in production accidentally
DO $$
BEGIN
  IF current_database() = 'postgres' AND current_user = 'postgres' THEN
    RAISE EXCEPTION 'Refusing to run on postgres database';
  END IF;
END $$;

-- Delete all order_events (cascaded from orders, but delete explicitly for safety)
DELETE FROM order_events;

-- Delete all orders
DELETE FROM orders;

COMMIT;
