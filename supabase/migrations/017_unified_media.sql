-- Migration 017: Unified Media Management
-- Adds storage metadata columns to marketing_brand_assets
-- Ensures boma-images bucket exists with proper RLS policies
-- Fully idempotent — safe to run multiple times

-- ── Extend marketing_brand_assets ─────────────────────────────────────────────
-- url column remains unchanged for backward compatibility with /public/... and external URLs
-- New columns track storage metadata without breaking existing records

ALTER TABLE marketing_brand_assets ADD COLUMN IF NOT EXISTS bucket TEXT DEFAULT 'boma-images';
ALTER TABLE marketing_brand_assets ADD COLUMN IF NOT EXISTS storage_path TEXT NULL;
ALTER TABLE marketing_brand_assets ADD COLUMN IF NOT EXISTS module TEXT NULL;

-- ── Index for module-based queries ────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_marketing_brand_assets_module ON marketing_brand_assets(module);
CREATE INDEX IF NOT EXISTS idx_marketing_brand_assets_storage_path ON marketing_brand_assets(storage_path);

-- ── Ensure boma-images bucket exists ──────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'boma-images',
  'boma-images',
  true,
  false,
  52428800,
  '{image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/webm,application/pdf}'
)
ON CONFLICT (id) DO NOTHING;

-- ── RLS policies on storage.objects for boma-images ──────────────────────────
-- Each wrapped in exception block for idempotency across PG versions

DO $$ BEGIN
  CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'boma-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role write access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'boma-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role write access" ON storage.objects FOR UPDATE USING (bucket_id = 'boma-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role write access" ON storage.objects FOR DELETE USING (bucket_id = 'boma-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
