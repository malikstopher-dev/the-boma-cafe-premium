-- ============================================================
-- Migration 022: Add station and parent_order_id to orders
-- ============================================================
-- station: 'kitchen' | 'bar' — which station handles this order
-- parent_order_id: links split orders (a waiter order with both
--   food and bar items is split into two rows sharing this)
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS station TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS parent_order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

-- Index for filtering by station
CREATE INDEX IF NOT EXISTS idx_orders_station ON orders (station);
CREATE INDEX IF NOT EXISTS idx_orders_parent ON orders (parent_order_id);

-- Add check constraint for valid station values
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_station_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_station_check
  CHECK (station IN ('kitchen', 'bar') OR station IS NULL);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
