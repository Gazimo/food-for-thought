/**
 * Multi-Game Architecture Type Definitions
 *
 * This module defines the core types for supporting multiple game modes
 * within the Food for Thought platform. Each game type can have its own
 * set of phases, scoring rules, and UI configurations.
 */

/**
 * Unique identifier for each game type.
 * Add new game IDs here as they are created.
 */
export type GameTypeId = "food-for-thought" | "italian-pasta";

/**
 * Phase identifiers for different game types.
 * Each game can have its own set of phases.
 */
export type BasePhaseId = "dish" | "country" | "protein" | "complete";
export type ItalianPastaPhaseId =
  | "pasta"
  | "sauce"
  | "region"
  | "protein"
  | "complete";
export type PhaseId = BasePhaseId | ItalianPastaPhaseId;

/**
 * Input types for different phase guesses
 */
export type GuessInputType =
  | "text" // Free text input with autocomplete
  | "country-map" // Map-based country selection
  | "region-map" // Map-based region selection (e.g., Italian regions)
  | "numeric"; // Numeric input (e.g., protein grams)

/**
 * Configuration for a single game phase
 */
export interface PhaseConfig {
  /** Unique identifier for this phase */
  id: PhaseId;
  /** Display title shown in the UI */
  title: string;
  /** Emoji icon for the phase */
  icon: string;
  /** Short description of what the user needs to do */
  description: string;
  /** Type of input for guessing */
  inputType: GuessInputType;
  /** Maximum number of guesses allowed (null = infinite) */
  maxGuesses: number | null;
  /** Whether wrong guesses reveal tiles */
  revealsTiles?: boolean;
  /** Whether wrong guesses reveal ingredients/hints */
  revealsHints?: boolean;
  /** Number of tiles in the grid (if applicable) */
  tileCount?: number;
  /** Tile grid dimensions [columns, rows] */
  tileGrid?: [number, number];
  /** Points awarded for completing this phase (base score) */
  baseScore: number;
  /** Points deducted per wrong guess */
  penaltyPerGuess: number;
  /** Label for navigation button to next phase */
  navigationLabel?: string;
  /** Field name for acceptable guesses (for text input types) */
  acceptableGuessesField?: string;
  /** Field name for the correct answer (for validation) */
  correctAnswerField?: string;
  /** Function to get correct answer and result for give-up functionality */
  getCorrectAnswer?: (item: any) => { answer: string | number; result: any } | null;
}

/**
 * Configuration for hint/clue revelation during a phase
 */
export interface HintConfig {
  /** Type of hints revealed (e.g., 'ingredient', 'metadata', 'letter', 'fact') */
  type: "ingredient" | "metadata" | "letter" | "fact" | "none";
  /** How many hints to reveal per wrong guess */
  perWrongGuess: number;
  /** Maximum hints that can be revealed */
  maxHints: number;
}

/**
 * Post-game content shown after completion
 */
export interface PostGameContent {
  /** Type of content to show */
  type: "recipe" | "story" | "facts";
  /** Title for the content section */
  title: string;
}

/**
 * Score aggregator function type
 * Takes individual phase scores and returns total score
 */
export type ScoreAggregator = (phaseScores: Record<string, number>) => number;

/**
 * Leaderboard statistics returned after score submission
 */
export interface LeaderboardStats {
  rank?: number;
  percentile?: number;
  totalPlayers?: number;
}

/**
 * Score submitter interface for game-specific leaderboard submission
 */
export interface ScoreSubmitter {
  submit(
    phaseResults: PhaseResult[],
    item: any,
    updateStreak: () => number
  ): Promise<LeaderboardStats>;
}

/**
 * Complete configuration for a game type
 */
export interface GameConfig {
  /** Unique identifier for this game */
  id: GameTypeId;
  /** Display name of the game */
  name: string;
  /** Short description of the game */
  description: string;
  /** URL path where this game is accessible (e.g., '/play', '/pasta') */
  urlPath: string;
  /** Emoji icon for the game */
  icon: string;
  /** Architecture version this game uses */
  architecture: "legacy" | "unified";
  /** Ordered array of phases for this game */
  phases: PhaseConfig[];
  /** Function to aggregate phase scores into total score */
  scoreAggregator: ScoreAggregator;
  /** Score submitter for leaderboard submission */
  scoreSubmitter?: ScoreSubmitter;
  /** Hint configuration */
  hints: HintConfig;
  /** Post-game content configuration */
  postGameContent: PostGameContent;
  /** Database table name for this game's items */
  tableName: string;
  /** API endpoint prefix for this game */
  apiPrefix: string;
  /** LocalStorage key prefix for game state */
  storageKeyPrefix: string;
  /** Whether this game is currently active/enabled */
  enabled: boolean;
  /** Release date for this game (null if already released) */
  releaseDate?: string | null;
}

/**
 * Game item interface - base type for dishes, pasta, etc.
 * Each game type can extend this with additional fields.
 */
export interface BaseGameItem {
  id?: number;
  name: string;
  acceptableGuesses: string[];
  imageUrl: string;
  releaseDate?: string;
}

/**
 * Result of a single phase
 */
export interface PhaseResult {
  phaseId: PhaseId;
  guesses: (string | number)[];
  success: boolean;
  score: number;
}

/**
 * Complete game results across all phases
 */
export interface GameTypeResults {
  gameTypeId: GameTypeId;
  phaseResults: PhaseResult[];
  totalScore: number;
  status: "won" | "lost";
  tracked?: boolean;
  completedAt?: string;
}
