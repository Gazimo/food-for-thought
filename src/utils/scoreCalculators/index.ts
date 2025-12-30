/**
 * Score Calculators Registry
 *
 * Provides a centralized way to get the score calculator for a specific game.
 */

import {
  calculateFFTTotalScore,
  FFTPhaseScores,
  FFT_SCORE_WEIGHTS,
  calculateDishScore,
  calculateCountryScore,
  calculateProteinScore as calculateFFTProteinScore,
} from "./fftScoreCalculator";

import {
  calculatePastaTotalScore,
  PastaPhaseScores,
  PASTA_SCORE_WEIGHTS,
  calculatePastaPhaseScore,
  calculateSauceScore,
  calculateRegionScore,
  calculateProteinScore as calculatePastaProteinScore,
} from "./pastaScoreCalculator";

export type GameTypeId = "food-for-thought" | "italian-pasta";

export interface ScoreCalculator {
  calculateTotal: (phaseScores: any) => number;
  weights: Record<string, number>;
}

/**
 * Score calculator registry
 *
 * Maps game type IDs to their respective score calculation functions.
 */
const SCORE_CALCULATORS: Record<GameTypeId, ScoreCalculator> = {
  "food-for-thought": {
    calculateTotal: (scores: FFTPhaseScores) => calculateFFTTotalScore(scores),
    weights: FFT_SCORE_WEIGHTS,
  },
  "italian-pasta": {
    calculateTotal: (scores: PastaPhaseScores) =>
      calculatePastaTotalScore(scores),
    weights: PASTA_SCORE_WEIGHTS,
  },
};

/**
 * Get the score calculator for a specific game
 *
 * @param gameTypeId - The game type ID
 * @returns Score calculator for the game
 */
export function getScoreCalculator(gameTypeId: GameTypeId): ScoreCalculator {
  const calculator = SCORE_CALCULATORS[gameTypeId];
  if (!calculator) {
    throw new Error(`No score calculator found for game: ${gameTypeId}`);
  }
  return calculator;
}

// Export individual calculators for direct use
export {
  // F4T calculators
  calculateFFTTotalScore,
  FFT_SCORE_WEIGHTS,
  calculateDishScore,
  calculateCountryScore,
  calculateFFTProteinScore,
  // Pasta calculators
  calculatePastaTotalScore,
  PASTA_SCORE_WEIGHTS,
  calculatePastaPhaseScore,
  calculateSauceScore,
  calculateRegionScore,
  calculatePastaProteinScore,
};

// Export types
export type { FFTPhaseScores, PastaPhaseScores };
