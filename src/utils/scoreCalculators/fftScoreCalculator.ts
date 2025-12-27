/**
 * Food for Thought (F4T) Game Score Calculator
 *
 * Weighted scoring system:
 * - Dish: 35%
 * - Country: 35%
 * - Protein: 30%
 *
 * Total score range: 0-100
 */

export interface FFTPhaseScores {
  dish: number; // 0-100
  country: number; // 0-100
  protein: number; // 0-100
}

export interface FFTScoreWeights {
  dish: number;
  country: number;
  protein: number;
}

// Scoring weights for F4T game
export const FFT_SCORE_WEIGHTS: FFTScoreWeights = {
  dish: 0.35, // 35%
  country: 0.35, // 35%
  protein: 0.30, // 30%
};

/**
 * Calculate weighted total score for F4T game
 *
 * @param phaseScores - Individual phase scores (0-100 each)
 * @returns Weighted total score (0-100)
 */
export function calculateFFTTotalScore(phaseScores: FFTPhaseScores): number {
  const totalScore =
    phaseScores.dish * FFT_SCORE_WEIGHTS.dish +
    phaseScores.country * FFT_SCORE_WEIGHTS.country +
    phaseScores.protein * FFT_SCORE_WEIGHTS.protein;

  return Math.round(totalScore * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate dish phase score based on guesses
 *
 * @param guessCount - Number of guesses made
 * @param maxGuesses - Maximum guesses allowed (default: 6)
 * @param success - Whether the guess was successful
 * @returns Score for dish phase (0-100)
 */
export function calculateDishScore(
  guessCount: number,
  maxGuesses: number = 6,
  success: boolean
): number {
  if (!success) return 0;

  // Clamp guesses to max
  const actualGuesses = Math.min(guessCount, maxGuesses);

  // Score: 100 - (guesses - 1) * 20
  // 1 guess = 100, 2 guesses = 80, 3 = 60, etc.
  const score = 100 - (actualGuesses - 1) * 20;

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate country phase score
 *
 * Country scoring: Since guesses are unlimited, base score on success only
 * with a small penalty for excessive guesses to encourage efficiency.
 *
 * @param guessCount - Number of guesses made
 * @param success - Whether the guess was successful
 * @returns Score for country phase (0-100)
 */
export function calculateCountryScore(
  guessCount: number,
  success: boolean
): number {
  if (!success) return 0;

  // Base: 100 points
  // Penalty: -5 points per guess after the first 3 guesses
  // Minimum: 60 points if successful
  const score = Math.max(60, 100 - Math.max(0, guessCount - 3) * 5);

  return Math.round(score);
}

/**
 * Calculate protein phase score based on accuracy
 *
 * Uses percentage difference from actual value.
 *
 * @param guesses - Array of guesses made
 * @param actualProtein - Actual protein content
 * @param success - Whether the guess was successful
 * @returns Score for protein phase (0-100)
 */
export function calculateProteinScore(
  guesses: number[],
  actualProtein: number,
  success: boolean
): number {
  if (!success || guesses.length === 0 || !actualProtein) return 0;

  // Get the closest guess
  const closestGuess = guesses.reduce((closest, guess) => {
    const currentDiff = Math.abs(guess - actualProtein);
    const closestDiff = Math.abs(closest - actualProtein);
    return currentDiff < closestDiff ? guess : closest;
  }, guesses[0]);

  const difference = Math.abs(closestGuess - actualProtein);
  const percentageError = (difference / actualProtein) * 100;

  // Score calculation:
  // 0% error = 100 points
  // 5% error = 90 points
  // 10% error = 80 points
  // 20% error = 60 points
  // 50% error = 0 points
  let baseScore = 100 - percentageError * 2;
  baseScore = Math.max(0, Math.min(100, baseScore));

  // Apply guess penalty (fewer guesses = better)
  // Max 4 guesses for protein, so penalty is based on that
  const MAX_PROTEIN_GUESSES = 4;
  const guessPenalty =
    Math.max(0, guesses.length - 1) * (100 / MAX_PROTEIN_GUESSES);
  const finalScore = Math.max(0, baseScore - guessPenalty);

  return Math.round(finalScore);
}
