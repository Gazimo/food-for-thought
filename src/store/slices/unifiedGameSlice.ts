/**
 * Unified Game Slice - Phase-based state management for all games
 *
 * This slice provides a unified state management approach that works for any game type.
 * It uses the GameConfig system to dynamically handle different games without duplicating logic.
 *
 * Key features:
 * - Phase-based state that works for any game
 * - Game config-driven behavior
 * - Supports multiple input types (text, map, numeric)
 * - Handles tile revealing, hint revealing, and scoring
 * - LocalStorage persistence per game/date
 */

import { StateCreator } from "zustand";
import { GameConfig, GameTypeId, PhaseId, PhaseResult } from "@/config/games/types";
import { launchEmojiBurst, emojiThemes } from "@/utils/celebration";
import { updateStreak } from "@/utils/streak";

/**
 * State for a single phase
 */
export interface PhaseState {
  /** Current phase ID */
  phaseId: PhaseId;
  /** Array of all guesses made (can be string or number) */
  guesses: (string | number)[];
  /** Whether this phase was completed successfully */
  success: boolean;
  /** Number of hints revealed (ingredients, metadata, etc.) */
  hintsRevealed: number;
  /** Which tiles have been revealed [tile1, tile2, ...] */
  revealedTiles: boolean[];
  /** Additional phase-specific results (e.g., distance/direction for map phases) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  guessResults: any[];
  /** Score achieved for this phase */
  score: number;
  /** Whether this phase is complete (success OR max guesses reached) */
  isComplete: boolean;
}

/**
 * Complete results for a game session
 */
export interface UnifiedGameResults {
  /** Which game this result is for */
  gameTypeId: GameTypeId;
  /** Results for each phase */
  phaseResults: PhaseResult[];
  /** Total score across all phases */
  totalScore: number;
  /** Overall game status */
  status: "won" | "lost" | "in_progress";
  /** Whether this result has been tracked to analytics */
  tracked: boolean;
  /** When the game was completed */
  completedAt?: string;
}

/**
 * Main unified game state
 */
export interface UnifiedGameState {
  /** Which game is currently being played */
  currentGameTypeId: GameTypeId | null;
  /** Current game configuration */
  gameConfig: GameConfig | null;
  /** Current game item (dish, pasta, etc.) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentItem: any | null;
  /** Current phase ID */
  currentPhaseId: PhaseId;
  /** State for each phase, keyed by phase ID */
  phases: Record<string, PhaseState>;
  /** Overall game results */
  gameResults: UnifiedGameResults | null;
  /** Date of the puzzle being played (for archive mode) */
  puzzleDate: string | null;
  /** Whether in archive mode */
  isArchiveMode: boolean;

  // Actions
  /** Initialize a new game session */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initializeGame: (gameTypeId: GameTypeId, gameConfig: GameConfig, item: any, puzzleDate: string) => void;
  /** Make a guess for the current phase */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  makeGuess: (guess: string | number, validationFn: (guess: string | number, item: any) => boolean) => boolean;
  /** Move to the next phase */
  moveToNextPhase: () => void;
  /** Move to a specific phase */
  moveToPhase: (phaseId: PhaseId) => void;
  /** Complete the current game */
  completeGame: () => void;
  /** Get the state for a specific phase */
  getPhaseState: (phaseId: PhaseId) => PhaseState | null;
  /** Check if a phase is complete */
  isPhaseComplete: (phaseId: PhaseId) => boolean;
  /** Calculate score for a phase based on guesses */
  calculatePhaseScore: (phaseId: PhaseId) => number;
  /** Save current game state to localStorage */
  saveGameState: () => void;
  /** Load game state from localStorage */
  loadGameState: (gameTypeId: GameTypeId, puzzleDate: string) => boolean;
  /** Reset game state */
  resetGame: () => void;
  /** Give up on current phase (reveal answer, no points) */
  giveUpPhase: () => void;
  /** Mark game as tracked */
  markGameTracked: () => void;
}

/**
 * Create initial phase state based on phase config
 */
function createInitialPhaseState(phaseId: PhaseId, tileCount: number = 6): PhaseState {
  return {
    phaseId,
    guesses: [],
    success: false,
    hintsRevealed: 0,
    revealedTiles: new Array(tileCount).fill(false),
    guessResults: [],
    score: 0,
    isComplete: false,
  };
}

/**
 * Create the unified game slice
 */
export const createUnifiedGameSlice: StateCreator<UnifiedGameState> = (set, get) => ({
  currentGameTypeId: null,
  gameConfig: null,
  currentItem: null,
  currentPhaseId: "dish" as PhaseId, // Default, will be overridden
  phases: {},
  gameResults: null,
  puzzleDate: null,
  isArchiveMode: false,

  initializeGame: (gameTypeId, gameConfig, item, puzzleDate) => {
    // Create initial state for all phases
    const phases: Record<string, PhaseState> = {};
    gameConfig.phases.forEach((phaseConfig) => {
      phases[phaseConfig.id] = createInitialPhaseState(
        phaseConfig.id,
        phaseConfig.tileCount || 6
      );
    });

    // Set up initial game results
    const gameResults: UnifiedGameResults = {
      gameTypeId,
      phaseResults: gameConfig.phases.map((p) => ({
        phaseId: p.id,
        guesses: [],
        success: false,
        score: 0,
      })),
      totalScore: 0,
      status: "in_progress",
      tracked: false,
    };

    set({
      currentGameTypeId: gameTypeId,
      gameConfig,
      currentItem: item,
      currentPhaseId: gameConfig.phases[0].id,
      phases,
      gameResults,
      puzzleDate,
      isArchiveMode: false,
    });

    // Try to load saved state
    const loaded = get().loadGameState(gameTypeId, puzzleDate);
    if (!loaded) {
      // If no saved state, save initial state
      get().saveGameState();
    }
  },

  makeGuess: (guess, validationFn) => {
    const state = get();
    const { currentPhaseId, gameConfig, currentItem, phases } = state;

    if (!gameConfig || !currentItem) {
      console.error("No game config or item loaded");
      return false;
    }

    const phaseConfig = gameConfig.phases.find((p) => p.id === currentPhaseId);
    if (!phaseConfig) {
      console.error("Invalid phase ID:", currentPhaseId);
      return false;
    }

    const phaseState = phases[currentPhaseId];
    if (!phaseState) {
      console.error("No phase state for:", currentPhaseId);
      return false;
    }

    // Check if phase is already complete
    if (phaseState.isComplete) {
      console.warn("Phase is already complete");
      return false;
    }

    // Validate the guess
    const isCorrect = validationFn(guess, currentItem);
    const newGuesses = [...phaseState.guesses, guess];

    // Check if max guesses reached
    const maxGuessesReached = newGuesses.length >= phaseConfig.maxGuesses;
    const phaseComplete = isCorrect || maxGuessesReached;

    // Update tiles if configured
    let newRevealedTiles = [...phaseState.revealedTiles];
    if (phaseConfig.revealsTiles) {
      if (phaseComplete) {
        // Reveal all tiles
        newRevealedTiles = newRevealedTiles.map(() => true);
      } else {
        // Reveal one tile
        const nextTileIndex = newRevealedTiles.findIndex((t) => !t);
        if (nextTileIndex !== -1) {
          newRevealedTiles[nextTileIndex] = true;
        }
      }
    }

    // Update hints if configured
    let newHintsRevealed = phaseState.hintsRevealed;
    if (phaseConfig.revealsHints && !isCorrect) {
      const maxHints = gameConfig.hints.maxHints;
      newHintsRevealed = Math.min(
        phaseState.hintsRevealed + gameConfig.hints.perWrongGuess,
        maxHints
      );
    }

    // Calculate score
    const wrongGuesses = newGuesses.length - (isCorrect ? 1 : 0);
    const score = isCorrect
      ? Math.max(0, phaseConfig.baseScore - wrongGuesses * phaseConfig.penaltyPerGuess)
      : 0;

    // Update phase state
    const updatedPhaseState: PhaseState = {
      ...phaseState,
      guesses: newGuesses,
      success: isCorrect,
      hintsRevealed: newHintsRevealed,
      revealedTiles: newRevealedTiles,
      score,
      isComplete: phaseComplete,
    };

    // Update phases
    const updatedPhases = {
      ...phases,
      [currentPhaseId]: updatedPhaseState,
    };

    // Update game results
    const updatedPhaseResults = state.gameResults!.phaseResults.map((pr) =>
      pr.phaseId === currentPhaseId
        ? { ...pr, guesses: newGuesses, success: isCorrect, score }
        : pr
    );

    const updatedGameResults: UnifiedGameResults = {
      ...state.gameResults!,
      phaseResults: updatedPhaseResults,
      totalScore: updatedPhaseResults.reduce((sum, pr) => sum + pr.score, 0),
    };

    set({
      phases: updatedPhases,
      gameResults: updatedGameResults,
    });

    // Trigger celebration on correct guess
    if (isCorrect && typeof window !== "undefined") {
      // Get celebration theme based on phase
      const celebrationTheme = (emojiThemes as any)[currentPhaseId] || emojiThemes.success;
      launchEmojiBurst(celebrationTheme);
    }

    // Save state
    get().saveGameState();

    return isCorrect;
  },

  moveToNextPhase: () => {
    const state = get();
    const { gameConfig, currentPhaseId } = state;

    if (!gameConfig) return;

    const currentIndex = gameConfig.phases.findIndex((p) => p.id === currentPhaseId);
    if (currentIndex === -1 || currentIndex >= gameConfig.phases.length - 1) {
      // No more phases, complete the game
      get().completeGame();
      return;
    }

    const nextPhase = gameConfig.phases[currentIndex + 1];
    set({ currentPhaseId: nextPhase.id });
    get().saveGameState();
  },

  moveToPhase: (phaseId) => {
    set({ currentPhaseId: phaseId });
    get().saveGameState();
  },

  completeGame: () => {
    const state = get() as any; // Type assertion needed for regular game compatibility
    const { gameResults } = state;

    if (!gameResults) return;

    // Check if this is a unified game (has phaseResults) or regular game
    if (!gameResults.phaseResults) {
      // This is a regular game - use regular game completion logic
      const newStreak = updateStreak();
      const hasAnySuccess =
        gameResults.dishGuessSuccess ||
        gameResults.countryGuessSuccess ||
        gameResults.proteinGuessSuccess;

      const finalStatus = hasAnySuccess ? "won" : "lost";

      (set as any)({
        gamePhase: "complete",
        modalVisible: true,
        streak: newStreak,
        gameResults: {
          ...gameResults,
          status: finalStatus,
          tracked: false,
        },
      });

      setTimeout(() => {
        if (state.saveCurrentGameState) {
          state.saveCurrentGameState();
        }
      }, 0);
      return;
    }

    // Unified game completion logic
    const hasAnySuccess = gameResults.phaseResults.some((pr: any) => pr.success);
    const finalStatus = hasAnySuccess ? "won" : "lost";

    const completedGameResults: UnifiedGameResults = {
      ...gameResults,
      status: finalStatus,
      completedAt: new Date().toISOString(),
    };

    set({
      currentPhaseId: "complete" as PhaseId,
      gameResults: completedGameResults,
    });

    get().saveGameState();
  },

  getPhaseState: (phaseId) => {
    const state = get();
    return state.phases[phaseId] || null;
  },

  isPhaseComplete: (phaseId) => {
    const phaseState = get().getPhaseState(phaseId);
    return phaseState?.isComplete || false;
  },

  calculatePhaseScore: (phaseId) => {
    const state = get();
    const { gameConfig } = state;
    const phaseState = state.phases[phaseId];

    if (!gameConfig || !phaseState) return 0;

    const phaseConfig = gameConfig.phases.find((p) => p.id === phaseId);
    if (!phaseConfig) return 0;

    const wrongGuesses = phaseState.guesses.length - (phaseState.success ? 1 : 0);
    return Math.max(
      0,
      phaseConfig.baseScore - wrongGuesses * phaseConfig.penaltyPerGuess
    );
  },

  saveGameState: () => {
    const state = get();
    const { currentGameTypeId, puzzleDate, gameConfig, currentPhaseId, phases, gameResults } = state;

    if (!currentGameTypeId || !puzzleDate || !gameConfig) return;

    const storageKey = `${gameConfig.storageKeyPrefix}-${puzzleDate}`;

    try {
      const stateToSave = {
        currentPhaseId,
        phases,
        gameResults,
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Error saving game state:", error);
    }
  },

  loadGameState: (gameTypeId, puzzleDate) => {
    const state = get();
    const { gameConfig } = state;

    if (!gameConfig) return false;

    const storageKey = `${gameConfig.storageKeyPrefix}-${puzzleDate}`;

    try {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        set({
          currentPhaseId: parsed.currentPhaseId,
          phases: parsed.phases,
          gameResults: parsed.gameResults,
        });
        return true;
      }
    } catch (error) {
      console.error("Error loading game state:", error);
    }

    return false;
  },

  resetGame: () => {
    const state = get();
    const { gameConfig, currentItem, puzzleDate, currentGameTypeId } = state;

    if (!gameConfig || !currentItem || !puzzleDate || !currentGameTypeId) return;

    // Re-initialize the game
    get().initializeGame(currentGameTypeId, gameConfig, currentItem, puzzleDate);
  },

  giveUpPhase: () => {
    const state = get();
    const { currentPhaseId, phases } = state;

    const phaseState = phases[currentPhaseId];
    if (!phaseState || phaseState.isComplete) return;

    // Reveal all tiles and hints, mark as complete with 0 score
    const updatedPhaseState: PhaseState = {
      ...phaseState,
      revealedTiles: phaseState.revealedTiles.map(() => true),
      hintsRevealed: state.gameConfig?.hints.maxHints || 6,
      score: 0,
      isComplete: true,
      success: false,
    };

    const updatedPhases = {
      ...phases,
      [currentPhaseId]: updatedPhaseState,
    };

    // Update game results
    const updatedPhaseResults = state.gameResults!.phaseResults.map((pr) =>
      pr.phaseId === currentPhaseId
        ? { ...pr, success: false, score: 0 }
        : pr
    );

    const updatedGameResults: UnifiedGameResults = {
      ...state.gameResults!,
      phaseResults: updatedPhaseResults,
      totalScore: updatedPhaseResults.reduce((sum, pr) => sum + pr.score, 0),
    };

    set({
      phases: updatedPhases,
      gameResults: updatedGameResults,
    });

    get().saveGameState();
  },

  markGameTracked: () => {
    const state = get();
    if (!state.gameResults) return;

    set({
      gameResults: {
        ...state.gameResults,
        tracked: true,
      },
    });

    get().saveGameState();
  },
});
