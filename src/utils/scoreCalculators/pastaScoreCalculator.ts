/**
 * Pasta Perfetto Game Score Calculator
 *
 * Equal weighted scoring system:
 * - Pasta: 25%
 * - Sauce: 25%
 * - Region: 25%
 * - Protein: 25%
 *
 * Total score range: 0-100
 */

export interface PastaPhaseScores {
  pasta: number; // 0-100
  sauce: number; // 0-100
  region: number; // 0-100
  protein: number; // 0-100
}

export interface PastaScoreWeights {
  pasta: number;
  sauce: number;
  region: number;
  protein: number;
}

// Scoring weights for Pasta game (equal weights)
export const PASTA_SCORE_WEIGHTS: PastaScoreWeights = {
  pasta: 0.25, // 25%
  sauce: 0.25, // 25%
  region: 0.25, // 25%
  protein: 0.25, // 25%
};

/**
 * Calculate weighted total score for Pasta game
 *
 * @param phaseScores - Individual phase scores (0-100 each)
 * @returns Weighted total score (0-100)
 */
export function calculatePastaTotalScore(phaseScores: PastaPhaseScores): number {
  const totalScore =
    phaseScores.pasta * PASTA_SCORE_WEIGHTS.pasta +
    phaseScores.sauce * PASTA_SCORE_WEIGHTS.sauce +
    phaseScores.region * PASTA_SCORE_WEIGHTS.region +
    phaseScores.protein * PASTA_SCORE_WEIGHTS.protein;

  return Math.round(totalScore * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate pasta phase score based on guesses
 *
 * @param guessCount - Number of guesses made
 * @param maxGuesses - Maximum guesses allowed (default: 6)
 * @param success - Whether the guess was successful
 * @param baseScore - Base score for the phase (default: 100)
 * @param penaltyPerGuess - Penalty per wrong guess (default: 15)
 * @returns Score for pasta phase (0-100)
 */
export function calculatePastaPhaseScore(
  guessCount: number,
  maxGuesses: number = 6,
  success: boolean,
  baseScore: number = 100,
  penaltyPerGuess: number = 15
): number {
  if (!success) return 0;

  // Clamp guesses to max
  const actualGuesses = Math.min(guessCount, maxGuesses);

  // Calculate wrong guesses (subtract the correct one)
  const wrongGuesses = actualGuesses - 1;

  // Score: baseScore - (wrongGuesses * penaltyPerGuess)
  const score = baseScore - wrongGuesses * penaltyPerGuess;

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate sauce phase score based on guesses
 *
 * Same formula as pasta phase.
 *
 * @param guessCount - Number of guesses made
 * @param maxGuesses - Maximum guesses allowed (default: 6)
 * @param success - Whether the guess was successful
 * @returns Score for sauce phase (0-100)
 */
export function calculateSauceScore(
  guessCount: number,
  maxGuesses: number = 6,
  success: boolean
): number {
  return calculatePastaPhaseScore(guessCount, maxGuesses, success, 100, 15);
}

/**
 * Calculate region phase score based on guesses
 *
 * Same formula as pasta phase.
 *
 * @param guessCount - Number of guesses made
 * @param maxGuesses - Maximum guesses allowed (default: 6)
 * @param success - Whether the guess was successful
 * @returns Score for region phase (0-100)
 */
export function calculateRegionScore(
  guessCount: number,
  maxGuesses: number = 6,
  success: boolean
): number {
  return calculatePastaPhaseScore(guessCount, maxGuesses, success, 100, 15);
}

/**
 * Calculate protein phase score based on guesses
 *
 * Protein has stricter scoring: max 4 guesses, penalty of 20 per wrong guess.
 *
 * @param guessCount - Number of guesses made
 * @param maxGuesses - Maximum guesses allowed (default: 4)
 * @param success - Whether the guess was successful
 * @returns Score for protein phase (0-100)
 */
export function calculateProteinScore(
  guessCount: number,
  maxGuesses: number = 4,
  success: boolean
): number {
  return calculatePastaPhaseScore(guessCount, maxGuesses, success, 100, 20);
}
