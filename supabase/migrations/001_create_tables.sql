-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  guests INTEGER NOT NULL CHECK (guests > 0),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('pickup', 'delivery')),
  requested_time TEXT NOT NULL,
  items_json TEXT NOT NULL,
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

-- 1. Enable RLS on all tables
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (for idempotent re-runs)
DROP POLICY IF EXISTS "Allow anon insert bookings" ON bookings;
DROP POLICY IF EXISTS "Allow anon insert orders" ON orders;
DROP POLICY IF EXISTS "Allow anon insert contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow anon select bookings" ON bookings;
DROP POLICY IF EXISTS "Allow anon select orders" ON orders;
DROP POLICY IF EXISTS "Allow anon select contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow authenticated read bookings" ON bookings;
DROP POLICY IF EXISTS "Allow authenticated read orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated read contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow authenticated update bookings" ON bookings;
DROP POLICY IF EXISTS "Allow authenticated update orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated delete bookings" ON bookings;
DROP POLICY IF EXISTS "Allow authenticated delete orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated delete contact_messages" ON contact_messages;

-- 3. Public / anon INSERT policies (for website form submissions)
CREATE POLICY "Allow anon insert bookings"
  ON bookings FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon insert orders"
  ON orders FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon insert contact_messages"
  ON contact_messages FOR INSERT
  TO anon
  WITH CHECK (true);

-- Fallback: public role insert policies (compatible with publishable keys)
CREATE POLICY "Allow public insert bookings"
  ON bookings FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public insert orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public insert contact_messages"
  ON contact_messages FOR INSERT
  TO public
  WITH CHECK (true);

-- 4. Authenticated SELECT policies (for admin panel read access)
CREATE POLICY "Allow authenticated read bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read contact_messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (true);

-- 5. Authenticated UPDATE policies (for admin panel status changes)
CREATE POLICY "Allow authenticated update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Authenticated DELETE policies (for admin panel record deletion)
CREATE POLICY "Allow authenticated delete bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete contact_messages"
  ON contact_messages FOR DELETE
  TO authenticated
  USING (true);
