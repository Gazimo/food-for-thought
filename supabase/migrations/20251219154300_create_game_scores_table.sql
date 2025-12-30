-- ============================================================================
-- FOOD FOR THOUGHT GAME SCORES TABLE
-- ============================================================================
-- This migration creates the game_scores (leaderboard) table for the
-- "Food for Thought" game. This table stores player scores and statistics.
--
-- Author: Supabase Schema Architect
-- Date: 2025-12-19
-- ============================================================================

-- ============================================================================
-- TABLE: game_scores
-- ============================================================================
-- Stores player scores and game statistics for the Food for Thought game.
-- Each record represents one completed game session.
-- ============================================================================

CREATE TABLE IF NOT EXISTS game_scores (
  -- Primary Key
  id BIGSERIAL PRIMARY KEY,

  -- Game Identifiers
  dish_date DATE NOT NULL,                       -- Date of the dish (YYYY-MM-DD)
  dish_id BIGINT REFERENCES dishes(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,                      -- Anonymous player identifier

  -- Phase Scores (0-100 each)
  dish_score INTEGER DEFAULT 0 CHECK (dish_score >= 0 AND dish_score <= 100),
  country_score INTEGER DEFAULT 0 CHECK (country_score >= 0 AND country_score <= 100),
  protein_score INTEGER DEFAULT 0 CHECK (protein_score >= 0 AND protein_score <= 100),

  -- Total Score (0-100, weighted average)
  total_score NUMERIC(5,2) DEFAULT 0 CHECK (total_score >= 0 AND total_score <= 100),

  -- Attempt Counts
  dish_guesses INTEGER DEFAULT 0 CHECK (dish_guesses >= 0 AND dish_guesses <= 6),
  country_guesses INTEGER DEFAULT 0 CHECK (country_guesses >= 0 AND country_guesses <= 6),
  protein_guesses INTEGER DEFAULT 0 CHECK (protein_guesses >= 0 AND protein_guesses <= 4),

  -- Timestamps
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

);

-- Indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_game_scores_date ON game_scores(dish_date);
CREATE INDEX IF NOT EXISTS idx_game_scores_total_score ON game_scores(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_session ON game_scores(session_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_date_score ON game_scores(dish_date, total_score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_session_date ON game_scores(session_id, dish_date);

-- Comments for documentation
COMMENT ON TABLE game_scores IS 'Player scores and statistics for Food for Thought game';
COMMENT ON COLUMN game_scores.dish_date IS 'Date identifier for the daily dish challenge';
COMMENT ON COLUMN game_scores.session_id IS 'Anonymous session identifier for tracking player performance';
COMMENT ON COLUMN game_scores.total_score IS 'Weighted average of phase scores (max 100)';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on game_scores table
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to leaderboard for statistics
CREATE POLICY "Public read access to game_scores"
  ON game_scores
  FOR SELECT
  USING (true);

-- Policy: Allow users to insert their own scores (via session_id check handled in API)
CREATE POLICY "Users can insert their scores"
  ON game_scores
  FOR INSERT
  WITH CHECK (true);

-- Policy: Prevent updates and deletes from users (only service role)
CREATE POLICY "Only service role can update/delete game_scores"
  ON game_scores
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View: Daily game statistics
CREATE OR REPLACE VIEW game_daily_stats AS
SELECT
  dish_date,
  COUNT(*) as total_players,
  AVG(total_score)::NUMERIC(10,2) as avg_score,
  MAX(total_score) as max_score,
  MIN(total_score) as min_score,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_score)::NUMERIC(10,2) as median_score,
  AVG(dish_guesses)::NUMERIC(10,2) as avg_dish_guesses,
  AVG(country_guesses)::NUMERIC(10,2) as avg_country_guesses,
  AVG(protein_guesses)::NUMERIC(10,2) as avg_protein_guesses
FROM game_scores
GROUP BY dish_date
ORDER BY dish_date DESC;

COMMENT ON VIEW game_daily_stats IS 'Daily statistics for Food for Thought game performance';

-- View: Player statistics
CREATE OR REPLACE VIEW game_player_stats AS
SELECT
  session_id,
  COUNT(*) as games_played,
  AVG(total_score)::NUMERIC(10,2) as avg_score,
  MAX(total_score) as best_score,
  SUM(CASE WHEN total_score >= 250 THEN 1 ELSE 0 END) as perfect_games,
  MIN(dish_date) as first_game_date,
  MAX(dish_date) as last_game_date
FROM game_scores
GROUP BY session_id;

COMMENT ON VIEW game_player_stats IS 'Aggregate statistics per player session';

-- ============================================================================
-- VALIDATION
-- ============================================================================

-- Verify table structure
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  -- Count table
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'game_scores';

  IF table_count = 1 THEN
    RAISE NOTICE 'SUCCESS: game_scores table created successfully';
  ELSE
    RAISE WARNING 'WARNING: game_scores table not found';
  END IF;

  RAISE NOTICE 'Migration completed successfully!';
END $$;
