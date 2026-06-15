-- Waiter System + Payment Rule Alignment
-- Creates waiters table and adds waiter_name to orders

-- 1. Create waiters table
CREATE TABLE IF NOT EXISTS waiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add waiter_name to orders if missing
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS waiter_name TEXT;

-- 3. Enable RLS on waiters table
ALTER TABLE waiters ENABLE ROW LEVEL SECURITY;

-- 4. Allow admin access to waiters
CREATE POLICY "Admin full access to waiters"
  ON waiters
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Enable realtime for waiters
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE waiters;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END;
$$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
