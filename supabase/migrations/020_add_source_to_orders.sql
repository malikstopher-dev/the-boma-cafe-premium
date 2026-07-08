-- ============================================================
-- Migration 020: Add source column to orders table
-- ============================================================
-- The codebase writes source ('online' | 'waiter') to orders
-- but the column was never added via migration. This creates
-- a production schema cache error:
--   "Could not find the 'source' column of 'orders'"
-- ============================================================

-- 1. Add source column with default 'online'
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'online';

-- 2. Backfill existing rows that were created before this migration
UPDATE orders
SET source = 'online'
WHERE source IS NULL;

-- 3. Make source NOT NULL after backfill
ALTER TABLE orders
  ALTER COLUMN source SET NOT NULL;

-- 4. Add constraint for valid source values
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_source_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_source_check
  CHECK (source IN ('online', 'waiter'));

-- 5. Create index for filtering by source
CREATE INDEX IF NOT EXISTS idx_orders_source ON orders (source);

-- 6. Refresh PostgREST schema cache so the column is visible immediately
NOTIFY pgrst, 'reload schema';
