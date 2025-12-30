-- Fix acceptable_guesses to include the pasta/sauce names themselves (lowercase)
-- Bug: Users couldn't guess names because they weren't in the acceptable_guesses arrays

-- Fix pasta acceptable_guesses (lowercase for consistency)
UPDATE pasta
SET acceptable_guesses = array_prepend(LOWER(name), acceptable_guesses)
WHERE NOT (LOWER(name) = ANY(acceptable_guesses));

-- Fix sauce acceptable_guesses (lowercase for consistency)
UPDATE pasta
SET sauce_acceptable_guesses = array_prepend(LOWER(sauce_name), sauce_acceptable_guesses)
WHERE NOT (LOWER(sauce_name) = ANY(sauce_acceptable_guesses));
