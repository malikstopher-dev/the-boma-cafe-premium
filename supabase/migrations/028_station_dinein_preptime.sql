-- ============================================================
-- Migration 028: Station Assignment, Dine-in Only, Prep Time
-- ============================================================

-- 1. Data-driven station assignment: is_bar on menu_categories
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_categories' AND column_name = 'is_bar') THEN
    ALTER TABLE menu_categories ADD COLUMN is_bar BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Mark all drinkable categories as bar
UPDATE menu_categories SET is_bar = true
WHERE LOWER(name) IN (
  'cold beverages', 'hot beverages', 'beverages', 'drinks',
  'milkshakes', 'milkshake',
  'classic cocktails', 'non-alcoholic cocktails',
  'soft drinks', 'juices', 'juice',
  'drnk', 'drnk freezos', 'freezos',
  'smoothies', 'mocktails',
  'ice cream & chocolate sauce', 'ice cream',
  'desserts'
);

-- 2. available_for_all_order_types on menu_items
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'available_for_all_order_types') THEN
    ALTER TABLE menu_items ADD COLUMN available_for_all_order_types BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 3. Preparation time tracking on orders
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'estimated_prep_minutes') THEN
    ALTER TABLE orders ADD COLUMN estimated_prep_minutes INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'prep_started_at') THEN
    ALTER TABLE orders ADD COLUMN prep_started_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'estimated_ready_at') THEN
    ALTER TABLE orders ADD COLUMN estimated_ready_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'actual_ready_at') THEN
    ALTER TABLE orders ADD COLUMN actual_ready_at TIMESTAMPTZ;
  END IF;
END $$;
