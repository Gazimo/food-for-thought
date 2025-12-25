/**
 * Phase Engine - Centralized game logic for all game phases
 *
 * This engine handles:
 * - Guess validation for different input types
 * - Score calculation based on phase config
 * - Phase completion logic
 * - Tile and hint revelation
 *
 * Game-specific validation logic is injected, while common logic is shared.
 */

import { GameConfig, PhaseConfig, PhaseId } from "@/config/games/types";
import { normalizeForComparison } from "@/utils/stringNormalization";

/**
 * Result of a guess validation
 */
export interface GuessValidationResult {
  /** Whether the guess was correct */
  isCorrect: boolean;
  /** Additional result data (distance, direction for map phases, etc.) */
  resultData?: any;
}

/**
 * Validator function type for phase-specific validation
 */
export type PhaseValidator = (
  guess: string | number,
  item: any,
  phaseConfig: PhaseConfig
) => GuessValidationResult;

/**
 * Phase Engine Class
 */
export class PhaseEngine {
  private gameConfig: GameConfig;
  private validators: Map<PhaseId, PhaseValidator>;

  constructor(gameConfig: GameConfig) {
    this.gameConfig = gameConfig;
    this.validators = new Map();
  }

  /**
   * Register a custom validator for a specific phase
   */
  registerValidator(phaseId: PhaseId, validator: PhaseValidator): void {
    this.validators.set(phaseId, validator);
  }

  /**
   * Validate a guess for a specific phase
   */
  validateGuess(
    phaseId: PhaseId,
    guess: string | number,
    item: any
  ): GuessValidationResult {
    const phaseConfig = this.getPhaseConfig(phaseId);
    if (!phaseConfig) {
      console.error(`Phase config not found for: ${phaseId}`);
      return { isCorrect: false };
    }

    // Use custom validator if registered
    const customValidator = this.validators.get(phaseId);
    if (customValidator) {
      return customValidator(guess, item, phaseConfig);
    }

    // Otherwise use default validation based on input type
    return this.defaultValidation(guess, item, phaseConfig);
  }

  /**
   * Default validation based on input type
   */
  private defaultValidation(
    guess: string | number,
    item: any,
    phaseConfig: PhaseConfig
  ): GuessValidationResult {
    switch (phaseConfig.inputType) {
      case "text":
        return this.validateTextGuess(guess as string, item, phaseConfig);
      case "country-map":
        return this.validateCountryGuess(guess as string, item);
      case "region-map":
        return this.validateRegionGuess(guess as string, item);
      case "numeric":
        return this.validateNumericGuess(guess as number, item, phaseConfig);
      default:
        console.error(`Unknown input type: ${phaseConfig.inputType}`);
        return { isCorrect: false };
    }
  }

  /**
   * Validate text-based guesses (dish, pasta, sauce, etc.)
   */
  private validateTextGuess(
    guess: string,
    item: any,
    phaseConfig: PhaseConfig
  ): GuessValidationResult {
    // Determine which field to check based on phase
    let acceptableGuesses: string[] = [];

    // Map phase IDs to the correct acceptable guesses field
    switch (phaseConfig.id) {
      case "dish":
        acceptableGuesses = item.acceptableGuesses || [];
        break;
      case "pasta":
        acceptableGuesses = item.acceptableGuesses || [];
        break;
      case "sauce":
        acceptableGuesses = item.sauceAcceptableGuesses || [];
        break;
      default:
        console.warn(`No acceptable guesses mapping for phase: ${phaseConfig.id}`);
        acceptableGuesses = item.acceptableGuesses || [];
    }

    const isCorrect = this.isGuessInAcceptableList(guess, acceptableGuesses);
    return { isCorrect };
  }

  /**
   * Validate country guesses
   */
  private validateCountryGuess(
    guess: string,
    item: any
  ): GuessValidationResult {
    const correctCountry = item.country || item.origin;
    const isCorrect = normalizeForComparison(guess) === normalizeForComparison(correctCountry);
    return { isCorrect };
  }

  /**
   * Validate region guesses (e.g., Italian regions)
   */
  private validateRegionGuess(
    guess: string,
    item: any
  ): GuessValidationResult {
    const correctRegion = item.region;
    const isCorrect = normalizeForComparison(guess) === normalizeForComparison(correctRegion);
    return { isCorrect };
  }

  /**
   * Validate numeric guesses (protein content, etc.)
   */
  private validateNumericGuess(
    guess: number,
    item: any,
    phaseConfig: PhaseConfig
  ): GuessValidationResult {
    const actualValue = item.proteinPerServing || item.protein || 0;
    const tolerance = 2; // ±2g tolerance (could be configurable)

    const isCorrect = Math.abs(guess - actualValue) <= tolerance;
    const hint: "higher" | "lower" | "correct" = isCorrect
      ? "correct"
      : guess < actualValue
      ? "higher"
      : "lower";

    return {
      isCorrect,
      resultData: {
        hint,
        difference: Math.abs(guess - actualValue),
        actualValue,
      },
    };
  }

  /**
   * Check if a guess is in the acceptable list (normalized comparison)
   */
  private isGuessInAcceptableList(guess: string, acceptableGuesses: string[]): boolean {
    const normalizedGuess = normalizeForComparison(guess);
    return acceptableGuesses.some(
      (acceptable) => normalizeForComparison(acceptable) === normalizedGuess
    );
  }

  /**
   * Calculate score for a phase based on guesses
   */
  calculatePhaseScore(
    phaseId: PhaseId,
    guessCount: number,
    isSuccess: boolean
  ): number {
    const phaseConfig = this.getPhaseConfig(phaseId);
    if (!phaseConfig) return 0;

    if (!isSuccess) return 0;

    const wrongGuesses = guessCount - 1; // Subtract the correct guess
    const score = Math.max(
      0,
      phaseConfig.baseScore - wrongGuesses * phaseConfig.penaltyPerGuess
    );

    return score;
  }

  /**
   * Determine if a phase is complete
   */
  isPhaseComplete(
    phaseId: PhaseId,
    guessCount: number,
    isSuccess: boolean
  ): boolean {
    const phaseConfig = this.getPhaseConfig(phaseId);
    if (!phaseConfig) return false;

    return isSuccess || guessCount >= phaseConfig.maxGuesses;
  }

  /**
   * Calculate which tiles should be revealed based on guess count
   */
  calculateRevealedTiles(
    phaseId: PhaseId,
    guessCount: number,
    isSuccess: boolean,
    currentRevealedTiles: boolean[]
  ): boolean[] {
    const phaseConfig = this.getPhaseConfig(phaseId);
    if (!phaseConfig || !phaseConfig.revealsTiles) {
      return currentRevealedTiles;
    }

    const tileCount = phaseConfig.tileCount || 6;

    // If phase is complete, reveal all tiles
    if (this.isPhaseComplete(phaseId, guessCount, isSuccess)) {
      return new Array(tileCount).fill(true);
    }

    // Otherwise reveal one tile per guess
    const newTiles = [...currentRevealedTiles];
    const tilesToReveal = Math.min(guessCount, tileCount);
    for (let i = 0; i < tilesToReveal; i++) {
      newTiles[i] = true;
    }

    return newTiles;
  }

  /**
   * Calculate how many hints should be revealed
   */
  calculateRevealedHints(
    phaseId: PhaseId,
    wrongGuessCount: number
  ): number {
    const phaseConfig = this.getPhaseConfig(phaseId);
    if (!phaseConfig || !phaseConfig.revealsHints) {
      return 0;
    }

    const maxHints = this.gameConfig.hints.maxHints;
    const hintsPerGuess = this.gameConfig.hints.perWrongGuess;

    return Math.min(wrongGuessCount * hintsPerGuess, maxHints);
  }

  /**
   * Get the next phase in sequence
   */
  getNextPhase(currentPhaseId: PhaseId): PhaseConfig | null {
    const currentIndex = this.gameConfig.phases.findIndex(
      (p) => p.id === currentPhaseId
    );

    if (currentIndex === -1 || currentIndex >= this.gameConfig.phases.length - 1) {
      return null; // No more phases
    }

    return this.gameConfig.phases[currentIndex + 1];
  }

  /**
   * Get phase config by ID
   */
  private getPhaseConfig(phaseId: PhaseId): PhaseConfig | null {
    return this.gameConfig.phases.find((p) => p.id === phaseId) || null;
  }

  /**
   * Get all phase configs
   */
  getAllPhases(): PhaseConfig[] {
    return this.gameConfig.phases;
  }

  /**
   * Get game config
   */
  getGameConfig(): GameConfig {
    return this.gameConfig;
  }
}

/**
 * Factory function to create a phase engine for a game
 */
export function createPhaseEngine(gameConfig: GameConfig): PhaseEngine {
  return new PhaseEngine(gameConfig);
}

/**
 * Common validators that can be registered with the engine
 */
export const CommonValidators = {
  /**
   * Validator for text guesses with acceptable guesses list
   */
  textWithAcceptableGuesses: (
    guess: string | number,
    item: any,
    phaseConfig: PhaseConfig
  ): GuessValidationResult => {
    const guessStr = String(guess);
    const acceptableGuesses = item.acceptableGuesses || [];
    const normalizedGuess = normalizeForComparison(guessStr);
    const isCorrect = acceptableGuesses.some(
      (acceptable: string) => normalizeForComparison(acceptable) === normalizedGuess
    );
    return { isCorrect };
  },

  /**
   * Validator for numeric guesses with tolerance
   */
  numericWithTolerance: (tolerance: number = 2) => {
    return (
      guess: string | number,
      item: any,
      phaseConfig: PhaseConfig
    ): GuessValidationResult => {
      const guessNum = Number(guess);
      const actualValue = item.proteinPerServing || item.protein || 0;
      const isCorrect = Math.abs(guessNum - actualValue) <= tolerance;
      const hint: "higher" | "lower" | "correct" = isCorrect
        ? "correct"
        : guessNum < actualValue
        ? "higher"
        : "lower";

      return {
        isCorrect,
        resultData: {
          hint,
          difference: Math.abs(guessNum - actualValue),
          actualValue,
        },
      };
    };
  },
};
