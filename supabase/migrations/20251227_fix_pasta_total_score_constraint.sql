-- ============================================================================
-- FIX PASTA TOTAL SCORE CONSTRAINT
-- ============================================================================
-- Removes invalid constraint and updates total_score to support weighted
-- average (0-100) instead of raw sum (0-400), matching the f4t pattern
-- ============================================================================

-- Drop views that depend on total_score
DROP VIEW IF EXISTS pasta_daily_stats;
DROP VIEW IF EXISTS pasta_player_stats;

-- Drop the invalid constraint if it exists
ALTER TABLE pasta_leaderboard DROP CONSTRAINT IF EXISTS pasta_leaderboard_valid_total;

-- Change total_score column type to NUMERIC(5,2)
ALTER TABLE pasta_leaderboard
  ALTER COLUMN total_score TYPE NUMERIC(5,2);

-- Recalculate existing scores using weighted formula (25% each phase)
UPDATE pasta_leaderboard
SET total_score = ROUND((pasta_score * 0.25 + sauce_score * 0.25 + region_score * 0.25 + protein_score * 0.25)::NUMERIC, 2);

-- Add the correct constraint for weighted scoring (0-100)
ALTER TABLE pasta_leaderboard
  DROP CONSTRAINT IF EXISTS pasta_leaderboard_total_score_check,
  ADD CONSTRAINT pasta_leaderboard_total_score_check CHECK (total_score >= 0 AND total_score <= 100);

-- Update comment
COMMENT ON COLUMN pasta_leaderboard.total_score IS 'Weighted average of phase scores (max 100): pasta*0.25 + sauce*0.25 + region*0.25 + protein*0.25';

-- Recreate views with corrected perfect_games threshold (≥90 instead of ≥300)
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

CREATE OR REPLACE VIEW pasta_player_stats AS
SELECT
  session_id,
  COUNT(*) as games_played,
  AVG(total_score)::NUMERIC(10,2) as avg_score,
  MAX(total_score) as best_score,
  SUM(CASE WHEN total_score >= 90 THEN 1 ELSE 0 END) as perfect_games,
  MIN(pasta_date) as first_game_date,
  MAX(pasta_date) as last_game_date
FROM pasta_leaderboard
GROUP BY session_id;

COMMENT ON VIEW pasta_player_stats IS 'Aggregate statistics per player session';
