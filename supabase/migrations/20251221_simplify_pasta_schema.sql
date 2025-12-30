-- ============================================================================
-- SIMPLIFY PASTA SCHEMA - Remove JSONB, Add Description Fields
-- ============================================================================
-- This migration simplifies the pasta table schema by:
--   1. Removing pasta_color (not needed - color is in description)
--   2. Removing sauce_recipe JSONB (replacing with simpler sauce_instructions array)
--   3. Adding pasta_description TEXT (for image generation)
--   4. Adding sauce_description TEXT (for image generation)
--   5. Adding sauce_instructions TEXT[] (for recipe steps)
--
-- This aligns the database schema with the TypeScript types and code expectations.
--
-- Author: Schema Simplification
-- Date: 2025-12-21
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP BAD COLUMNS
-- ============================================================================

-- Drop pasta_color column (from bad migration)
ALTER TABLE pasta
DROP COLUMN IF EXISTS pasta_color;

-- Drop sauce_recipe constraint first (if exists)
ALTER TABLE pasta
DROP CONSTRAINT IF EXISTS sauce_recipe_structure_check;

-- Drop sauce_recipe JSONB column (replacing with simpler structure)
ALTER TABLE pasta
DROP COLUMN IF EXISTS sauce_recipe;

-- ============================================================================
-- STEP 2: ADD NEW COLUMNS
-- ============================================================================

-- Add pasta_description for visual description of raw pasta (used in image generation)
ALTER TABLE pasta
ADD COLUMN IF NOT EXISTS pasta_description TEXT;

COMMENT ON COLUMN pasta.pasta_description IS 'Visual description of raw, uncooked pasta for image generation (2-3 sentences describing shape, dimensions, texture, features)';

-- Add sauce_description for visual description of plated sauce (used in image generation)
ALTER TABLE pasta
ADD COLUMN IF NOT EXISTS sauce_description TEXT;

COMMENT ON COLUMN pasta.sauce_description IS 'Visual description of plated pasta with sauce for image generation (2-3 sentences describing color, texture, visible ingredients)';

-- Add sauce_instructions for full recipe preparation steps
ALTER TABLE pasta
ADD COLUMN IF NOT EXISTS sauce_instructions TEXT[] DEFAULT '{}';

COMMENT ON COLUMN pasta.sauce_instructions IS 'Array of cooking instructions for the traditional sauce recipe (4-6 steps with timing and techniques)';

-- ============================================================================
-- STEP 3: UPDATE VALIDATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_pasta_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure pasta_about has exactly 6 hints
  IF array_length(NEW.pasta_about, 1) IS NOT NULL AND array_length(NEW.pasta_about, 1) != 6 THEN
    RAISE EXCEPTION 'pasta_about must contain exactly 6 hints, got %', array_length(NEW.pasta_about, 1);
  END IF;

  -- Ensure sauce_ingredients has exactly 6 ingredients
  IF array_length(NEW.sauce_ingredients, 1) IS NOT NULL AND array_length(NEW.sauce_ingredients, 1) != 6 THEN
    RAISE EXCEPTION 'sauce_ingredients must contain exactly 6 ingredients, got %', array_length(NEW.sauce_ingredients, 1);
  END IF;

  -- Validate region_coordinates structure
  IF NEW.region_coordinates IS NOT NULL THEN
    IF NOT (NEW.region_coordinates ? 'lat' AND NEW.region_coordinates ? 'lng') THEN
      RAISE EXCEPTION 'region_coordinates must contain both lat and lng fields';
    END IF;
  END IF;

  -- Validate Italian region
  IF NEW.region NOT IN (
    'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
    'Friuli Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
    'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia',
    'Toscana', 'Trentino-Alto Adige', 'Umbria', 'Valle d''Aosta', 'Veneto'
  ) THEN
    RAISE EXCEPTION 'Invalid Italian region: %. Must be one of the 20 official regions.', NEW.region;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: The trigger validate_pasta_data_trigger already exists from the previous migration
-- and will automatically use this updated function

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  -- Check that pasta_color is gone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pasta' AND column_name = 'pasta_color'
  ) THEN
    RAISE NOTICE 'SUCCESS: pasta_color column removed';
  ELSE
    RAISE WARNING 'WARNING: pasta_color column still exists';
  END IF;

  -- Check that sauce_recipe is gone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pasta' AND column_name = 'sauce_recipe'
  ) THEN
    RAISE NOTICE 'SUCCESS: sauce_recipe column removed';
  ELSE
    RAISE WARNING 'WARNING: sauce_recipe column still exists';
  END IF;

  -- Check that new columns exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pasta' AND column_name = 'pasta_description'
  ) THEN
    RAISE NOTICE 'SUCCESS: pasta_description column added';
  ELSE
    RAISE WARNING 'WARNING: pasta_description column not found';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pasta' AND column_name = 'sauce_description'
  ) THEN
    RAISE NOTICE 'SUCCESS: sauce_description column added';
  ELSE
    RAISE WARNING 'WARNING: sauce_description column not found';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pasta' AND column_name = 'sauce_instructions'
  ) THEN
    RAISE NOTICE 'SUCCESS: sauce_instructions column added';
  ELSE
    RAISE WARNING 'WARNING: sauce_instructions column not found';
  END IF;

  RAISE NOTICE 'Migration 20251221_simplify_pasta_schema completed!';
END $$;
