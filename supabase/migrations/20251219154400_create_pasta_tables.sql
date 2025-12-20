-- ============================================================================
-- PASTA PERFETTO GAME SCHEMA MIGRATION
-- ============================================================================
-- This migration creates the database schema for the "Pasta Perfetto" game,
-- following the established patterns from the "Food for Thought" game.
--
-- Tables:
--   1. pasta - Core pasta data including phase information
--   2. pasta_leaderboard - Player scores and statistics
--
-- Storage:
--   - pasta-images bucket for tiles
--
-- Author: Supabase Schema Architect
-- Date: 2025-12-19
-- ============================================================================

-- ============================================================================
-- TABLE: pasta
-- ============================================================================
-- Stores all pasta data for the game including:
--   - Phase 1: Pasta identification (name, hints, image)
--   - Phase 2: Sauce identification (sauce name, ingredients, image)
--   - Phase 3: Region identification (Italian region, coordinates)
--   - Phase 4: Protein estimation (protein per serving)
--   - Content: Origin story and fun facts
-- ============================================================================

CREATE TABLE IF NOT EXISTS pasta (
  -- Primary Key
  id BIGSERIAL PRIMARY KEY,

  -- Phase 1: Pasta Identification Fields
  name TEXT NOT NULL,
  acceptable_guesses TEXT[] DEFAULT '{}',
  pasta_about TEXT[] DEFAULT '{}',              -- 6 hints about pasta (shape, ingredients, preparation, etymology, texture, classification)
  pasta_image_url TEXT,                         -- URL reference for plain pasta tiles

  -- Phase 2: Sauce Identification Fields
  sauce_name TEXT NOT NULL,
  sauce_acceptable_guesses TEXT[] DEFAULT '{}',
  sauce_ingredients TEXT[] DEFAULT '{}',         -- 6 ingredients revealed as hints
  sauce_image_url TEXT,                          -- URL reference for pasta with sauce tiles

  -- Phase 3: Region Identification Fields
  region TEXT NOT NULL,                          -- One of 20 Italian regions
  region_coordinates JSONB,                      -- {"lat": 43.77, "lng": 11.25}

  -- Phase 4: Protein Estimation
  protein_per_serving INTEGER DEFAULT 0,         -- Grams per 100g serving

  -- Content Fields
  origin_story TEXT,                             -- Historical background and legends
  fun_fact TEXT,                                 -- Interesting trivia

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  release_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT pasta_name_not_empty CHECK (name <> ''),
  CONSTRAINT pasta_sauce_name_not_empty CHECK (sauce_name <> ''),
  CONSTRAINT pasta_region_not_empty CHECK (region <> ''),
  CONSTRAINT pasta_protein_non_negative CHECK (protein_per_serving >= 0),
  CONSTRAINT pasta_unique_release_date UNIQUE (release_date)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_pasta_release_date ON pasta(release_date);
CREATE INDEX IF NOT EXISTS idx_pasta_region ON pasta(region);
CREATE INDEX IF NOT EXISTS idx_pasta_name ON pasta(name);
CREATE INDEX IF NOT EXISTS idx_pasta_tags ON pasta USING GIN (tags);

-- Comments for documentation
COMMENT ON TABLE pasta IS 'Core pasta data for the Pasta Perfetto game with 4 phases';
COMMENT ON COLUMN pasta.pasta_about IS 'Array of 6 hints revealed progressively in Phase 1 (shape, ingredients, preparation, etymology, texture, classification)';
COMMENT ON COLUMN pasta.sauce_ingredients IS 'Array of 6 sauce ingredients revealed progressively in Phase 2';
COMMENT ON COLUMN pasta.region IS 'Italian region of origin (one of 20 regions)';
COMMENT ON COLUMN pasta.region_coordinates IS 'JSON object with lat/lng for distance calculation';
COMMENT ON COLUMN pasta.protein_per_serving IS 'Protein content in grams per 100g serving';

-- ============================================================================
-- TABLE: pasta_leaderboard
-- ============================================================================
-- Stores player scores and game statistics for the Pasta Perfetto game.
-- Each record represents one completed game session.
-- ============================================================================

CREATE TABLE IF NOT EXISTS pasta_leaderboard (
  -- Primary Key
  id BIGSERIAL PRIMARY KEY,

  -- Game Identifiers
  pasta_date DATE NOT NULL,                      -- Date of the pasta (YYYY-MM-DD)
  pasta_id BIGINT REFERENCES pasta(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,                      -- Anonymous player identifier

  -- Phase Scores (0-100 each)
  pasta_score INTEGER DEFAULT 0 CHECK (pasta_score >= 0 AND pasta_score <= 100),
  sauce_score INTEGER DEFAULT 0 CHECK (sauce_score >= 0 AND sauce_score <= 100),
  region_score INTEGER DEFAULT 0 CHECK (region_score >= 0 AND region_score <= 100),
  protein_score INTEGER DEFAULT 0 CHECK (protein_score >= 0 AND protein_score <= 100),

  -- Total Score (0-400)
  total_score INTEGER DEFAULT 0 CHECK (total_score >= 0 AND total_score <= 400),

  -- Attempt Counts
  pasta_guesses INTEGER DEFAULT 0 CHECK (pasta_guesses >= 0 AND pasta_guesses <= 6),
  sauce_guesses INTEGER DEFAULT 0 CHECK (sauce_guesses >= 0 AND sauce_guesses <= 6),
  region_guesses INTEGER DEFAULT 0 CHECK (region_guesses >= 0 AND region_guesses <= 6),
  protein_guesses INTEGER DEFAULT 0 CHECK (protein_guesses >= 0 AND protein_guesses <= 4),

  -- Timestamps
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT pasta_leaderboard_unique_session_date UNIQUE (pasta_date, session_id),
  CONSTRAINT pasta_leaderboard_valid_total CHECK (
    total_score = pasta_score + sauce_score + region_score + protein_score
  )
);

-- Indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_pasta_leaderboard_date ON pasta_leaderboard(pasta_date);
CREATE INDEX IF NOT EXISTS idx_pasta_leaderboard_total_score ON pasta_leaderboard(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_pasta_leaderboard_session ON pasta_leaderboard(session_id);
CREATE INDEX IF NOT EXISTS idx_pasta_leaderboard_date_score ON pasta_leaderboard(pasta_date, total_score DESC);

-- Composite index for session statistics
CREATE INDEX IF NOT EXISTS idx_pasta_leaderboard_session_date ON pasta_leaderboard(session_id, pasta_date);

-- Comments for documentation
COMMENT ON TABLE pasta_leaderboard IS 'Player scores and statistics for Pasta Perfetto game';
COMMENT ON COLUMN pasta_leaderboard.pasta_date IS 'Date identifier for the daily pasta challenge';
COMMENT ON COLUMN pasta_leaderboard.session_id IS 'Anonymous session identifier for tracking player performance';
COMMENT ON COLUMN pasta_leaderboard.total_score IS 'Sum of all phase scores (max 400)';
COMMENT ON CONSTRAINT pasta_leaderboard_valid_total ON pasta_leaderboard IS 'Ensures total_score equals sum of individual phase scores';

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================
-- Automatically updates the updated_at column when a pasta record is modified

CREATE TRIGGER update_pasta_updated_at
    BEFORE UPDATE ON pasta
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Note: The update_updated_at_column() function is already defined in migration 20251219_add_updated_at.sql

-- ============================================================================
-- STORAGE: Create buckets for pasta images
-- ============================================================================
-- Creates storage buckets for pasta tiles with public access

-- Bucket for pasta tile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('pasta-images', 'pasta-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on pasta table (read-only for all users)
ALTER TABLE pasta ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to pasta data
CREATE POLICY "Public read access to pasta"
  ON pasta
  FOR SELECT
  USING (true);

-- Policy: Only service role can insert/update/delete pasta
CREATE POLICY "Service role can manage pasta"
  ON pasta
  FOR ALL
  USING (auth.role() = 'service_role');

-- Enable RLS on pasta_leaderboard table
ALTER TABLE pasta_leaderboard ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to leaderboard for statistics
CREATE POLICY "Public read access to pasta_leaderboard"
  ON pasta_leaderboard
  FOR SELECT
  USING (true);

-- Policy: Allow users to insert their own scores (via session_id check handled in API)
CREATE POLICY "Users can insert their scores"
  ON pasta_leaderboard
  FOR INSERT
  WITH CHECK (true);

-- Policy: Prevent updates and deletes from users (only service role)
CREATE POLICY "Only service role can update/delete pasta_leaderboard"
  ON pasta_leaderboard
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- STORAGE POLICIES: Public access for pasta images
-- ============================================================================

-- Policy: Public read access to pasta-images bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Public Access pasta-images'
  ) THEN
    CREATE POLICY "Public Access pasta-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'pasta-images');
  END IF;
END $$;

-- ============================================================================
-- DATA VALIDATION FUNCTION
-- ============================================================================
-- Helper function to validate pasta data integrity

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

-- Apply validation trigger
CREATE TRIGGER validate_pasta_data_trigger
  BEFORE INSERT OR UPDATE ON pasta
  FOR EACH ROW
  EXECUTE FUNCTION validate_pasta_data();

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View: Daily pasta statistics
CREATE OR REPLACE VIEW pasta_daily_stats AS
SELECT
  pasta_date,
  COUNT(*) as total_players,
  AVG(total_score)::NUMERIC(10,2) as avg_score,
  MAX(total_score) as max_score,
  MIN(total_score) as min_score,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_score)::NUMERIC(10,2) as median_score,
  AVG(pasta_guesses)::NUMERIC(10,2) as avg_pasta_guesses,
  AVG(sauce_guesses)::NUMERIC(10,2) as avg_sauce_guesses,
  AVG(region_guesses)::NUMERIC(10,2) as avg_region_guesses,
  AVG(protein_guesses)::NUMERIC(10,2) as avg_protein_guesses
FROM pasta_leaderboard
GROUP BY pasta_date
ORDER BY pasta_date DESC;

COMMENT ON VIEW pasta_daily_stats IS 'Daily statistics for Pasta Perfetto game performance';

-- View: Player statistics
CREATE OR REPLACE VIEW pasta_player_stats AS
SELECT
  session_id,
  COUNT(*) as games_played,
  AVG(total_score)::NUMERIC(10,2) as avg_score,
  MAX(total_score) as best_score,
  SUM(CASE WHEN total_score >= 300 THEN 1 ELSE 0 END) as perfect_games,
  MIN(pasta_date) as first_game_date,
  MAX(pasta_date) as last_game_date
FROM pasta_leaderboard
GROUP BY session_id;

COMMENT ON VIEW pasta_player_stats IS 'Aggregate statistics per player session';

-- ============================================================================
-- SAMPLE DATA VALIDATION
-- ============================================================================

-- Verify table structure
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('pasta', 'pasta_leaderboard');

  IF table_count = 2 THEN
    RAISE NOTICE 'SUCCESS: Both pasta tables created successfully';
  ELSE
    RAISE WARNING 'WARNING: Expected 2 tables, found %', table_count;
  END IF;

  -- Verify storage bucket
  SELECT COUNT(*) INTO table_count
  FROM storage.buckets
  WHERE id = 'pasta-images';

  IF table_count = 1 THEN
    RAISE NOTICE 'SUCCESS: pasta-images storage bucket created';
  ELSE
    RAISE WARNING 'WARNING: pasta-images bucket not found';
  END IF;

  RAISE NOTICE 'Migration completed successfully!';
END $$;
