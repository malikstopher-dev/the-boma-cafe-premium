-- ============================================================
-- Migration 033: Fix orders RLS for browser-side Realtime
--
-- The browser Supabase client (anon key) needs SELECT permission
-- on the orders table for Realtime subscriptions to work.
-- Without this, bar/kitchen displays can't receive live updates.
--
-- Admin client (service role) bypasses RLS for API routes.
-- ============================================================

-- Add permissive SELECT policy for public/anon role
CREATE POLICY "Allow public select orders"
  ON orders FOR SELECT
  TO public
  USING (true);

-- Also add for anon role explicitly (belt and suspenders)
CREATE POLICY "Allow anon select orders"
  ON orders FOR SELECT
  TO anon
  USING (true);
