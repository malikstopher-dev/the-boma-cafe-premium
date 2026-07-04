-- Bar Menu CMS tables
-- Separate from food menu tables because bar pricing model
-- (bottle, single, glass, shot per item) is fundamentally different.

CREATE TABLE IF NOT EXISTS bar_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES bar_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bottle numeric(10,2),
  single_price numeric(10,2),
  glass_price numeric(10,2),
  shot_price numeric(10,2),
  price TEXT,
  order_index INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_bar_items_category_order ON bar_items(category_id, order_index);
CREATE INDEX IF NOT EXISTS idx_bar_categories_order ON bar_categories(order_index);

-- Enable RLS
ALTER TABLE bar_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bar_items ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
DROP POLICY IF EXISTS "Anyone can read bar categories" ON bar_categories;
CREATE POLICY "Anyone can read bar categories"
  ON bar_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read bar items" ON bar_items;
CREATE POLICY "Anyone can read bar items"
  ON bar_items FOR SELECT USING (true);

-- Allow authenticated users (service role) full access
DROP POLICY IF EXISTS "Service role full access bar categories" ON bar_categories;
CREATE POLICY "Service role full access bar categories"
  ON bar_categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access bar items" ON bar_items;
CREATE POLICY "Service role full access bar items"
  ON bar_items FOR ALL USING (true) WITH CHECK (true);
