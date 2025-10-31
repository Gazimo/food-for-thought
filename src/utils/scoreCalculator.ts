import { Dish } from "@/types/dishes";
import { GameResults } from "@/types/game";
import { LeaderboardScore } from "@/types/leaderboard";

const MAX_GUESSES_DISH = 5;
const MAX_GUESSES_COUNTRY = 5;
const MAX_GUESSES_PROTEIN = 5;

const WEIGHT_DISH = 0.35;
const WEIGHT_COUNTRY = 0.35;
const WEIGHT_PROTEIN = 0.3;

/**
 * Calculate score for dish or country phase based on number of guesses
 * Score decreases by 20 points per guess (100, 80, 60, 40, 20, 0)
 */
export function calculatePhaseScore(
  guesses: number,
  maxGuesses: number,
  success: boolean
): number {
  if (!success) return 0;

  // Clamp guesses to max
  const actualGuesses = Math.min(guesses, maxGuesses);

  // Calculate score: 100 - (guesses * 20)
  const score = 100 - (actualGuesses - 1) * 20;

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate protein phase score based on accuracy
 * Uses percentage difference from actual value
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
  const guessPenalty = (guesses.length - 1) * 5;
  const finalScore = Math.max(0, baseScore - guessPenalty);

  return Math.round(finalScore);
}

/**
 * Calculate total weighted score from all three phases
 */
export function calculateTotalScore(
  gameResults: GameResults,
  currentDish: Dish
): LeaderboardScore {
  const dishScore = calculatePhaseScore(
    gameResults.dishGuesses.length,
    MAX_GUESSES_DISH,
    gameResults.dishGuessSuccess
  );

  const countryScore = calculatePhaseScore(
    gameResults.countryGuesses.length,
    MAX_GUESSES_COUNTRY,
    gameResults.countryGuessSuccess
  );

  const proteinScore = calculateProteinScore(
    gameResults.proteinGuesses,
    currentDish.proteinPerServing || 0,
    gameResults.proteinGuessSuccess
  );

  const totalScore =
    dishScore * WEIGHT_DISH +
    countryScore * WEIGHT_COUNTRY +
    proteinScore * WEIGHT_PROTEIN;

  return {
    dishScore,
    countryScore,
    proteinScore,
    totalScore: Math.round(totalScore * 100) / 100,
    percentile: 0, // Will be calculated by the API
  };
}

/**
 * Calculate percentile ranking based on score and all scores
 */
export function calculatePercentile(
  userScore: number,
  allScores: number[]
): number {
  if (allScores.length === 0) return 100;

  const scoresAbove = allScores.filter((score) => score > userScore).length;
  const percentile =
    ((allScores.length - scoresAbove) / allScores.length) * 100;

  return Math.round(percentile);
}

// Synthetic score generation functions removed - using real data only
