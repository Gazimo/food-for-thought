-- ============================================================================
-- CREATE PASTA-TILES STORAGE BUCKET
-- ============================================================================
-- This migration creates the missing pasta-tiles bucket for storing
-- pre-generated pasta tile images (both regular and blurred versions).
--
-- This bucket was missing from the initial pasta migration and is required
-- for optimal performance when serving pasta tiles.
--
-- Date: 2025-12-29
-- ============================================================================

-- Create storage bucket for pasta tiles
INSERT INTO storage.buckets (id, name, public)
VALUES ('pasta-tiles', 'pasta-tiles', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICY: Public read access for pasta-tiles
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Public Access pasta-tiles'
  ) THEN
    CREATE POLICY "Public Access pasta-tiles"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'pasta-tiles');
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  bucket_count INTEGER;
BEGIN
  -- Verify storage bucket
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets
  WHERE id = 'pasta-tiles';

  IF bucket_count = 1 THEN
    RAISE NOTICE 'SUCCESS: pasta-tiles storage bucket created';
  ELSE
    RAISE WARNING 'WARNING: pasta-tiles bucket not found';
  END IF;

  RAISE NOTICE 'Migration completed successfully!';
END $$;
