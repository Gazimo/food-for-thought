-- ============================================================================
-- ADD PASTA COLOR AND SAUCE RECIPE FIELDS
-- ============================================================================
-- This migration adds two missing fields to the pasta table:
--   1. pasta_color - Descriptive color of the raw pasta dough
--   2. sauce_recipe - Complete traditional recipe (ingredients + instructions)
--
-- Author: Schema Enhancement
-- Date: 2025-12-20
-- ============================================================================

-- Add pasta_color column
-- Stores a descriptive color phrase for the raw pasta dough
-- Used in image generation prompts for accurate visual representation
ALTER TABLE pasta
ADD COLUMN IF NOT EXISTS pasta_color TEXT;

-- Add comment for documentation
COMMENT ON COLUMN pasta.pasta_color IS 'Descriptive color of the raw pasta dough (e.g., "pale ivory with golden undertones", "rich golden yellow"). Used in image generation.';

-- Add sauce_recipe column
-- Stores the complete traditional recipe as JSONB
-- Structure: {"ingredients": ["string"], "instructions": ["string"]}
ALTER TABLE pasta
ADD COLUMN IF NOT EXISTS sauce_recipe JSONB;

-- Add comment for documentation
COMMENT ON COLUMN pasta.sauce_recipe IS 'Complete traditional sauce recipe as JSONB with ingredients (4-8 items with quantities), instructions (4-6 steps), and visualDescription (color, texture, visibleIngredients, consistency, optional garnish). Displayed after Phase 2 completion.';

-- Add validation constraint for sauce_recipe structure
ALTER TABLE pasta
ADD CONSTRAINT sauce_recipe_structure_check
CHECK (
  sauce_recipe IS NULL OR (
    sauce_recipe ? 'ingredients' AND
    sauce_recipe ? 'instructions' AND
    sauce_recipe ? 'visualDescription' AND
    jsonb_typeof(sauce_recipe->'ingredients') = 'array' AND
    jsonb_typeof(sauce_recipe->'instructions') = 'array' AND
    jsonb_typeof(sauce_recipe->'visualDescription') = 'object' AND
    sauce_recipe->'visualDescription' ? 'color' AND
    sauce_recipe->'visualDescription' ? 'texture' AND
    sauce_recipe->'visualDescription' ? 'visibleIngredients' AND
    sauce_recipe->'visualDescription' ? 'consistency'
  )
);

-- Update the validation function to check pasta_color
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

  -- Validate pasta_color (if not null, must be at least 10 characters)
  IF NEW.pasta_color IS NOT NULL AND length(NEW.pasta_color) < 10 THEN
    RAISE EXCEPTION 'pasta_color must be at least 10 characters, got %', length(NEW.pasta_color);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pasta'
    AND column_name IN ('pasta_color', 'sauce_recipe')
  ) THEN
    RAISE NOTICE 'SUCCESS: pasta_color and sauce_recipe columns added successfully';
  ELSE
    RAISE WARNING 'WARNING: Column addition may have failed';
  END IF;
END $$;
