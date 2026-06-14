-- Add order_ref column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_ref TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_ref ON orders (order_ref);
