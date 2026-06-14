-- ============================================================
-- Migration 004: Add dine-in to order_type CHECK + pricing audit trail
-- ============================================================

-- 1. Fix order_type CHECK constraint to include 'dine-in'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
ALTER TABLE orders ADD CONSTRAINT orders_order_type_check
  CHECK (order_type IN ('pickup', 'delivery', 'dine-in'));

-- 2. Add pricing audit columns (optional, for traceability)
--    server_computed_total: verified against menu prices at creation time
--    total is always server-computed — client trust ratio = 0
ALTER TABLE orders ADD COLUMN IF NOT EXISTS server_computed_total NUMERIC(10, 2);

-- 3. Backfill server_computed_total = total for existing orders
UPDATE orders SET server_computed_total = total WHERE server_computed_total IS NULL;

-- Note: total >= 0 CHECK already exists from migration 001.
-- Note: order_ref UNIQUE and NOT NULL added in migration 003.
-- The POST handler now rejects client-supplied 'total' and 'items_json' pricing fields.
-- All monetary values are server-authoritative from SQLite menu_items.price.

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- -- Check constraints on orders table
-- SELECT conname, contype, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'orders'::regclass;
--
-- -- Check current RLS policies
-- SELECT schemaname, tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('orders', 'bookings', 'contact_messages')
-- ORDER BY tablename, cmd;
-- ============================================================
