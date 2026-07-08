-- Push notification subscriptions for Firebase Cloud Messaging
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'kitchen', 'waiter')),
  fcm_token TEXT NOT NULL UNIQUE,
  device_type TEXT,
  is_active BOOLEAN DEFAULT true,
  app_version TEXT,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_role ON push_subscriptions(role);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);

-- RLS: only service role can manage push subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only"
  ON push_subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION set_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER trigger_set_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION set_push_subscriptions_updated_at();
