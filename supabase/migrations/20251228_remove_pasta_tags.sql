-- ============================================================================
-- REMOVE PASTA TAGS FIELD
-- ============================================================================
-- This migration removes the orphaned tags field from the pasta table.
-- The tags field was never populated by the generation script and is not
-- used anywhere in the application.
--
-- Author: Schema Cleanup
-- Date: 2025-12-28
-- ============================================================================

-- Drop GIN index first
DROP INDEX IF EXISTS idx_pasta_tags;

-- Drop tags column
ALTER TABLE pasta DROP COLUMN IF EXISTS tags;

-- Verification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pasta' AND column_name = 'tags'
  ) THEN
    RAISE NOTICE 'SUCCESS: tags column removed';
  ELSE
    RAISE WARNING 'WARNING: tags column still exists';
  END IF;

  RAISE NOTICE 'Migration 20251228_remove_pasta_tags completed!';
END $$;
