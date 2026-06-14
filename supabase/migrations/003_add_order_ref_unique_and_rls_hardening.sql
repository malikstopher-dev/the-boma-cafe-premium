-- ============================================================
-- Migration 003: order_ref UNIQUE constraint + RLS hardening
-- ============================================================

-- 1. Clean up duplicate order_ref values before adding constraint
--    (keep the most recent row for any duplicates, if they exist)
DELETE FROM orders a
USING orders b
WHERE a.id < b.id
  AND a.order_ref = b.order_ref;

-- 2. Add UNIQUE constraint on order_ref
ALTER TABLE orders ADD CONSTRAINT orders_order_ref_key UNIQUE (order_ref);

-- 3. Make order_ref NOT NULL (all new orders have it)
ALTER TABLE orders ALTER COLUMN order_ref SET NOT NULL;

-- ============================================================
-- RLS HARDENING — Replace broad policies with role-scoped ones
-- ============================================================

-- Drop overly broad authenticated policies (SELECT, UPDATE, DELETE
-- on all rows for any authenticated user).
DROP POLICY IF EXISTS "Allow authenticated read bookings" ON bookings;
DROP POLICY IF EXISTS "Allow authenticated read orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated read contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow authenticated update bookings" ON bookings;
DROP POLICY IF EXISTS "Allow authenticated update orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated delete bookings" ON bookings;
DROP POLICY IF EXISTS "Allow authenticated delete orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated delete contact_messages" ON contact_messages;

-- Drop any anon SELECT policies (defense-in-depth — none should exist)
DROP POLICY IF EXISTS "Allow anon select bookings" ON bookings;
DROP POLICY IF EXISTS "Allow anon select orders" ON orders;
DROP POLICY IF EXISTS "Allow anon select contact_messages" ON contact_messages;

-- ============================================================
-- ROLE-SCOPED POLICIES
-- These are defense-in-depth. The app uses service_role (bypasses RLS).
-- These policies protect against leaked anon key / direct Supabase access.
--
-- Role model (via auth.jwt() ->> 'role'):
--   admin  → full access to everything
--   kitchen → SELECT on orders only (cannot mutate)
--   anon/public → INSERT only on orders, bookings, contact_messages
-- ============================================================

-- =====================
-- ORDERS
-- =====================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Public: customers can place orders only
CREATE POLICY "orders_public_insert"
ON orders FOR INSERT
TO anon, public
WITH CHECK (true);

-- Admin: full access (read, update status, delete old orders)
CREATE POLICY "orders_admin_all"
ON orders FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Kitchen: read only (cannot mutate)
CREATE POLICY "orders_kitchen_select"
ON orders FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'kitchen');

-- =====================
-- BOOKINGS
-- =====================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Public: customers can submit bookings
CREATE POLICY "bookings_public_insert"
ON bookings FOR INSERT
TO anon, public
WITH CHECK (true);

-- Admin: full access
CREATE POLICY "bookings_admin_all"
ON bookings FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Kitchen: read only
CREATE POLICY "bookings_kitchen_select"
ON bookings FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'kitchen');

-- =====================
-- CONTACT_MESSAGES
-- =====================
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Public: customers can submit contact messages
CREATE POLICY "contact_public_insert"
ON contact_messages FOR INSERT
TO anon, public
WITH CHECK (true);

-- Admin: full access
CREATE POLICY "contact_admin_all"
ON contact_messages FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Kitchen: read only
CREATE POLICY "contact_kitchen_select"
ON contact_messages FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'kitchen');

-- ============================================================
-- VERIFICATION: Query to confirm policies are correct
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('orders', 'bookings', 'contact_messages')
-- ORDER BY tablename, cmd;
-- ============================================================
