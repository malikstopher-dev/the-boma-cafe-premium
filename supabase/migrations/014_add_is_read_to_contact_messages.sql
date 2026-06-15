-- Add is_read tracking to contact_messages
ALTER TABLE contact_messages
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE contact_messages
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
