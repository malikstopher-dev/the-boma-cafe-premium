-- ============================================================
-- Migration 030: Bar items in orders + Pickup restrictions
-- ============================================================

-- 1. Add available_for_pickup to bar_items
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bar_items' AND column_name = 'available_for_pickup') THEN
    ALTER TABLE bar_items ADD COLUMN available_for_pickup BOOLEAN DEFAULT true;
  END IF;
END $$;

-- 2. Backfill: Block pickup for items in restricted categories (menu_items side)
-- Using available_for_all_order_types (already exists from migration 028)
-- false = NOT available for all order types = pickup blocked
UPDATE menu_items
SET available_for_all_order_types = false
WHERE category_id IN (
  SELECT id FROM menu_categories
  WHERE is_bar = true
  AND LOWER(name) IN (
    'hot beverages', 'drnk freezos', 'milkshakes',
    'classic cocktails', 'non-alcoholic cocktails',
    'ice cream', 'ice cream & chocolate sauce', 'freezos'
  )
);

-- 3. Backfill: Block pickup for cocktails in bar_items
UPDATE bar_items
SET available_for_pickup = false
WHERE category_id IN (
  SELECT id FROM bar_categories
  WHERE LOWER(name) IN (
    'classic cocktails', 'signature cocktails', 'cocktails',
    'non-alcoholic cocktails', 'mocktails'
  )
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_menu_items_available
  ON menu_items(is_available, available_for_all_order_types);
CREATE INDEX IF NOT EXISTS idx_bar_items_available
  ON bar_items(is_available, available_for_pickup);
CREATE INDEX IF NOT EXISTS idx_menu_categories_is_bar
  ON menu_categories(is_bar) WHERE is_bar = true;
