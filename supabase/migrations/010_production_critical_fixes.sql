-- ============================================================
-- Migration 010: Production-critical schema fixes
-- ============================================================

-- 1. Add idempotency_key column (back-end code already references it)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- 2. Fix order_type check constraint to allow dine-in
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
ALTER TABLE orders ADD CONSTRAINT orders_order_type_check
  CHECK (order_type IN ('pickup','delivery','dine-in'));

-- 3. DB-level NOT NULL enforcement for required fields
--    (must match frontend validation exactly)
ALTER TABLE orders ALTER COLUMN customer_name SET NOT NULL;
ALTER TABLE orders ALTER COLUMN phone SET NOT NULL;

-- 4. Add unique index on idempotency_key for fast dedup lookups
--    (nullable columns need a partial index)
CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key
  ON orders(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 5. Add unique constraint on idempotency_key for DB-level dedup
--    (only where the key is present — old rows may be null)
DROP INDEX IF EXISTS idx_orders_idempotency_key_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key_unique
  ON orders(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 6. Reload PostgREST schema cache so new columns are visible immediately
NOTIFY pgrst, 'reload schema';
