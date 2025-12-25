-- ============================================================================
-- ADD SAUCE_RECIPE COLUMN TO PASTA TABLE
-- ============================================================================
-- This migration adds the sauce_recipe JSONB column to store complete
-- traditional recipes that will be displayed after Phase 2 (Sauce) completion.
--
-- Structure: {"ingredients": [...], "instructions": [...]}
--
-- Author: Database Migration
-- Date: 2025-12-20
-- ============================================================================

-- Add sauce_recipe column
ALTER TABLE pasta
ADD COLUMN IF NOT EXISTS sauce_recipe JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN pasta.sauce_recipe IS 'Traditional recipe with ingredients (with quantities) and preparation instructions. Structure: {"ingredients": ["400g tomatoes", ...], "instructions": ["Step 1...", ...]}';

-- ============================================================================
-- UPDATE VALIDATION FUNCTION
-- ============================================================================
-- Update the validation trigger to check recipe structure

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

  -- Validate sauce_recipe structure (if present)
  IF NEW.sauce_recipe IS NOT NULL THEN
    IF NOT (NEW.sauce_recipe ? 'ingredients' AND NEW.sauce_recipe ? 'instructions') THEN
      RAISE EXCEPTION 'sauce_recipe must contain both ingredients and instructions fields';
    END IF;

    -- Ensure ingredients is a non-empty array
    IF jsonb_array_length(NEW.sauce_recipe->'ingredients') = 0 THEN
      RAISE EXCEPTION 'sauce_recipe.ingredients must contain at least one ingredient';
    END IF;

    -- Ensure instructions is a non-empty array
    IF jsonb_array_length(NEW.sauce_recipe->'instructions') = 0 THEN
      RAISE EXCEPTION 'sauce_recipe.instructions must contain at least one instruction';
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
  -- Check if column was added
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'pasta'
    AND column_name = 'sauce_recipe'
  ) THEN
    RAISE NOTICE 'SUCCESS: sauce_recipe column added to pasta table';
  ELSE
    RAISE WARNING 'WARNING: sauce_recipe column not found';
  END IF;

  RAISE NOTICE 'Migration completed successfully!';
END $$;
