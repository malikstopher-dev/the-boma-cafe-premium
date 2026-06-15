-- Add subject column to contact_messages
ALTER TABLE contact_messages
  ADD COLUMN IF NOT EXISTS subject TEXT;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
