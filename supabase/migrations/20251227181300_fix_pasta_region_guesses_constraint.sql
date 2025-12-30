-- Fix region_guesses constraint to allow unlimited guesses
-- Region phase has maxGuesses: null (unlimited) in game config

-- Drop the old constraint
ALTER TABLE pasta_leaderboard
  DROP CONSTRAINT IF EXISTS pasta_leaderboard_region_guesses_check;

-- Add new constraint without upper limit
ALTER TABLE pasta_leaderboard
  ADD CONSTRAINT pasta_leaderboard_region_guesses_check
  CHECK (region_guesses >= 0);
