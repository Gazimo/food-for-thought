-- ============================================================================
-- FIX TOTAL SCORE CONSTRAINT
-- ============================================================================
-- Removes invalid constraint and updates total_score to support weighted
-- average (0-100) instead of raw sum (0-300)
-- ============================================================================

-- Drop views that depend on total_score
DROP VIEW IF EXISTS game_daily_stats;
DROP VIEW IF EXISTS game_player_stats;

-- Drop the invalid constraint if it exists
ALTER TABLE game_scores DROP CONSTRAINT IF EXISTS game_scores_valid_total;

-- Change total_score column type (without constraint yet)
ALTER TABLE game_scores
  ALTER COLUMN total_score TYPE NUMERIC(5,2);

-- Recalculate existing scores using weighted formula
UPDATE game_scores
SET total_score = ROUND((dish_score * 0.35 + country_score * 0.35 + protein_score * 0.3)::NUMERIC, 2);

-- Now add the constraint
ALTER TABLE game_scores
  DROP CONSTRAINT IF EXISTS game_scores_total_score_check,
  ADD CONSTRAINT game_scores_total_score_check CHECK (total_score >= 0 AND total_score <= 100);

-- Update comment
COMMENT ON COLUMN game_scores.total_score IS 'Weighted average of phase scores (max 100)';

-- Recreate views
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

CREATE OR REPLACE VIEW game_player_stats AS
SELECT
  session_id,
  COUNT(*) as games_played,
  AVG(total_score)::NUMERIC(10,2) as avg_score,
  MAX(total_score) as best_score,
  SUM(CASE WHEN total_score >= 90 THEN 1 ELSE 0 END) as perfect_games,
  MIN(dish_date) as first_game_date,
  MAX(dish_date) as last_game_date
FROM game_scores
GROUP BY session_id;

COMMENT ON VIEW game_player_stats IS 'Aggregate statistics per player session';
