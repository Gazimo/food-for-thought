/**
 * TypeScript type definitions for the Pasta Perfetto game
 * Corresponds to the database schema defined in migration: 20251219_create_pasta_tables.sql
 */

import { normalizeForComparison } from '@/utils/stringNormalization';

// ============================================================================
// DATABASE ROW TYPES
// ============================================================================

/**
 * Pasta database row type (matches the pasta table structure)
 */
export interface PastaRow {
  id: number;

  // Phase 1: Pasta identification
  name: string;
  acceptable_guesses: string[];
  pasta_about: string[];
  pasta_description: string | null;
  pasta_image_url: string | null;

  // Phase 2: Sauce identification
  sauce_name: string;
  sauce_acceptable_guesses: string[];
  sauce_ingredients: string[];
  sauce_instructions: string[];
  sauce_description: string | null;
  sauce_image_url: string | null;

  // Phase 3: Region identification
  region: string;
  region_coordinates: {
    lat: number;
    lng: number;
  } | null;

  // Phase 4: Protein estimation
  protein_per_serving: number;

  // Content
  origin_story: string | null;
  fun_fact: string | null;

  // Metadata
  tags: string[];
  release_date: string;
  created_at: string;
  updated_at: string;
}

/**
 * Pasta insert type (for creating new pasta records)
 */
export interface PastaInsert {
  id?: number;
  name: string;
  acceptable_guesses?: string[];
  pasta_about?: string[];
  pasta_description?: string | null;
  pasta_image_url?: string | null;
  sauce_name: string;
  sauce_acceptable_guesses?: string[];
  sauce_ingredients?: string[];
  sauce_instructions?: string[];
  sauce_description?: string | null;
  sauce_image_url?: string | null;
  region: string;
  region_coordinates?: {
    lat: number;
    lng: number;
  } | null;
  protein_per_serving?: number;
  origin_story?: string | null;
  fun_fact?: string | null;
  tags?: string[];
  release_date: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Pasta update type (for updating existing pasta records)
 */
export interface PastaUpdate {
  id?: number;
  name?: string;
  acceptable_guesses?: string[];
  pasta_about?: string[];
  pasta_description?: string | null;
  pasta_image_url?: string | null;
  sauce_name?: string;
  sauce_acceptable_guesses?: string[];
  sauce_ingredients?: string[];
  sauce_instructions?: string[];
  sauce_description?: string | null;
  sauce_image_url?: string | null;
  region?: string;
  region_coordinates?: {
    lat: number;
    lng: number;
  } | null;
  protein_per_serving?: number;
  origin_story?: string | null;
  fun_fact?: string | null;
  tags?: string[];
  release_date?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// APPLICATION-LEVEL TYPES
// ============================================================================

/**
 * Pasta type for application use (camelCase properties)
 */
export interface Pasta {
  id?: number;

  // Phase 1: Pasta identification
  name: string;
  acceptableGuesses: string[];
  pastaAbout: string[];
  pastaDescription?: string;
  pastaImageUrl?: string;

  // Phase 2: Sauce identification
  sauceName: string;
  sauceAcceptableGuesses: string[];
  sauceIngredients: string[];
  sauceInstructions: string[];
  sauceDescription?: string;
  sauceImageUrl?: string;

  // Phase 3: Region identification
  region: string;
  regionCoordinates?: {
    lat: number;
    lng: number;
  };

  // Phase 4: Protein estimation
  proteinPerServing?: number;

  // Content
  originStory?: string;
  funFact?: string;

  // Metadata
  tags?: string[];
  releaseDate?: string;
}

// ============================================================================
// LEADERBOARD TYPES
// ============================================================================

/**
 * Pasta leaderboard database row type
 */
export interface PastaLeaderboardRow {
  id: number;
  pasta_date: string;
  pasta_id: number | null;
  session_id: string;
  pasta_score: number;
  sauce_score: number;
  region_score: number;
  protein_score: number;
  total_score: number;
  pasta_guesses: number;
  sauce_guesses: number;
  region_guesses: number;
  protein_guesses: number;
  completed_at: string;
  created_at: string;
}

/**
 * Pasta leaderboard insert type
 */
export interface PastaLeaderboardInsert {
  id?: number;
  pasta_date: string;
  pasta_id?: number | null;
  session_id: string;
  pasta_score?: number;
  sauce_score?: number;
  region_score?: number;
  protein_score?: number;
  total_score?: number;
  pasta_guesses?: number;
  sauce_guesses?: number;
  region_guesses?: number;
  protein_guesses?: number;
  completed_at?: string;
  created_at?: string;
}

/**
 * Score submission payload for API
 */
export interface PastaScoreSubmission {
  pastaDate: string;
  pastaId?: number;
  sessionId: string;
  pastaScore: number;
  sauceScore: number;
  regionScore: number;
  proteinScore: number;
  totalScore: number;
  pastaGuesses: number;
  sauceGuesses: number;
  regionGuesses: number;
  proteinGuesses: number;
}

/**
 * Leaderboard score breakdown
 */
export interface PastaLeaderboardScore {
  pastaScore: number;
  sauceScore: number;
  regionScore: number;
  proteinScore: number;
  totalScore: number;
  percentile: number;
  rank?: number;
}

/**
 * Leaderboard statistics response
 */
export interface PastaLeaderboardStats {
  todayRank: PastaLeaderboardScore;
  overallRank?: PastaLeaderboardScore;
}

// ============================================================================
// GAME STATE TYPES
// ============================================================================

/**
 * Game phase type
 */
export type PastaGamePhase = 'pasta' | 'sauce' | 'region' | 'protein' | 'complete';

/**
 * Region guess result with distance feedback
 */
export interface RegionGuessResult {
  region: string;
  distance: number;  // km from correct region
  direction: string; // N, NE, E, SE, S, SW, W, NW
  isCorrect: boolean;
}

/**
 * Protein guess result
 */
export interface ProteinGuessResult {
  guess: number;
  hint: 'higher' | 'lower' | 'correct';
  difference?: number;
}

/**
 * Complete game results
 */
export interface PastaGameResults {
  // Phase results
  pastaSuccess: boolean;
  sauceSuccess: boolean;
  regionSuccess: boolean;
  proteinSuccess: boolean;

  // Guess counts
  pastaGuesses: number;
  sauceGuesses: number;
  regionGuesses: number;
  proteinGuesses: number;

  // Scores
  pastaScore: number;
  sauceScore: number;
  regionScore: number;
  proteinScore: number;
  totalScore: number;

  // Revealed content
  revealedPastaAbout: number;
  revealedSauceIngredients: number;
}

/**
 * Complete pasta game state
 */
export interface PastaGameState {
  // Current pasta
  currentPasta: Pasta | null;
  currentPhase: PastaGamePhase;

  // Phase 1: Pasta guessing
  pastaGuesses: string[];
  pastaRevealedTiles: boolean[];
  pastaRevealedAbout: number;
  pastaSuccess: boolean;

  // Phase 2: Sauce guessing
  sauceGuesses: string[];
  sauceRevealedTiles: boolean[];
  sauceRevealedIngredients: number;
  sauceSuccess: boolean;

  // Phase 3: Region guessing
  regionGuesses: string[];
  regionGuessResults: RegionGuessResult[];
  regionSuccess: boolean;

  // Phase 4: Protein guessing
  proteinGuesses: number[];
  proteinGuessResults: ProteinGuessResult[];
  proteinSuccess: boolean;

  // Game state
  gameComplete: boolean;
  gameResults: PastaGameResults | null;
}

// ============================================================================
// ITALIAN REGIONS
// ============================================================================

/**
 * Italian region coordinates for distance calculation
 * Data source: country_metadata_20251219_184005.csv (verified December 19, 2024)
 */
export const ITALIAN_REGIONS = {
  'Abruzzo': { lat: 42.25, lng: 13.75 },
  'Valle d\'Aosta': { lat: 45.75, lng: 7.25 },
  'Puglia': { lat: 41.00164, lng: 16.73378 },
  'Basilicata': { lat: 40.5041, lng: 16.11396 },
  'Calabria': { lat: 39, lng: 16.5 },
  'Campania': { lat: 40.91056, lng: 14.92053 },
  'Emilia-Romagna': { lat: 44.5444, lng: 10.98361 },
  'Friuli Venezia Giulia': { lat: 46, lng: 13 },
  'Lazio': { lat: 42.07762, lng: 12.77878 },
  'Liguria': { lat: 44.5, lng: 8.83333 },
  'Lombardia': { lat: 45.66667, lng: 9.5 },
  'Molise': { lat: 41.66667, lng: 14.5 },
  'Piemonte': { lat: 45, lng: 8 },
  'Sardegna': { lat: 40, lng: 9 },
  'Sicilia': { lat: 37.75, lng: 14.25 },
  'Marche': { lat: 43.5, lng: 13.25 },
  'Trentino-Alto Adige': { lat: 46.5, lng: 11.33333 },
  'Toscana': { lat: 43.41667, lng: 11 },
  'Umbria': { lat: 43, lng: 12.5 },
  'Veneto': { lat: 45.5, lng: 11.75 },
} as const;

/**
 * Type for Italian region names
 */
export type ItalianRegion = keyof typeof ITALIAN_REGIONS;

/**
 * List of all Italian regions
 */
export const ITALIAN_REGION_LIST: ItalianRegion[] = Object.keys(ITALIAN_REGIONS) as ItalianRegion[];

// ============================================================================
// SCORING CONSTANTS
// ============================================================================

/**
 * Scoring configuration for each phase
 */
export const PASTA_SCORING = {
  PASTA: {
    BASE_SCORE: 100,
    PENALTY_PER_GUESS: 15,
    MAX_GUESSES: 6,
  },
  SAUCE: {
    BASE_SCORE: 100,
    PENALTY_PER_GUESS: 15,
    MAX_GUESSES: 6,
  },
  REGION: {
    BASE_SCORE: 100,
    PENALTY_PER_GUESS: 15,
    MAX_GUESSES: 6,
  },
  PROTEIN: {
    BASE_SCORE: 100,
    PENALTY_PER_GUESS: 20,
    MAX_GUESSES: 4,
    TOLERANCE: 5, // ±5g tolerance
  },
  MAX_TOTAL_SCORE: 400,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Ensure a name is always included in the acceptable guesses array (lowercase)
 * This prevents bugs where AI-generated data might not include the actual name
 */
function ensureNameInGuesses(name: string, guesses: string[]): string[] {
  const normalizedName = name.toLowerCase().trim();
  const hasName = guesses.some(guess => guess.toLowerCase().trim() === normalizedName);
  return hasName ? guesses : [normalizedName, ...guesses];
}

/**
 * Convert database row to application Pasta type
 */
export function pastaRowToPasta(row: PastaRow): Pasta {
  return {
    id: row.id,
    name: row.name,
    acceptableGuesses: ensureNameInGuesses(row.name, row.acceptable_guesses),
    pastaAbout: row.pasta_about,
    pastaDescription: row.pasta_description || undefined,
    pastaImageUrl: row.pasta_image_url || undefined,
    sauceName: row.sauce_name,
    sauceAcceptableGuesses: ensureNameInGuesses(row.sauce_name, row.sauce_acceptable_guesses),
    sauceIngredients: row.sauce_ingredients,
    sauceInstructions: row.sauce_instructions,
    sauceDescription: row.sauce_description || undefined,
    sauceImageUrl: row.sauce_image_url || undefined,
    region: row.region,
    regionCoordinates: row.region_coordinates || undefined,
    proteinPerServing: row.protein_per_serving,
    originStory: row.origin_story || undefined,
    funFact: row.fun_fact || undefined,
    tags: row.tags,
    releaseDate: row.release_date,
  };
}

/**
 * Convert application Pasta to database insert type
 */
export function pastaToInsert(pasta: Pasta): PastaInsert {
  return {
    name: pasta.name,
    acceptable_guesses: pasta.acceptableGuesses,
    pasta_about: pasta.pastaAbout,
    pasta_description: pasta.pastaDescription || null,
    pasta_image_url: pasta.pastaImageUrl || null,
    sauce_name: pasta.sauceName,
    sauce_acceptable_guesses: pasta.sauceAcceptableGuesses,
    sauce_ingredients: pasta.sauceIngredients,
    sauce_instructions: pasta.sauceInstructions,
    sauce_description: pasta.sauceDescription || null,
    sauce_image_url: pasta.sauceImageUrl || null,
    region: pasta.region,
    region_coordinates: pasta.regionCoordinates || null,
    protein_per_serving: pasta.proteinPerServing || 0,
    origin_story: pasta.originStory || null,
    fun_fact: pasta.funFact || null,
    tags: pasta.tags || [],
    release_date: pasta.releaseDate || new Date().toISOString().split('T')[0],
  };
}

/**
 * Calculate score for a phase
 */
export function calculatePhaseScore(
  baseScore: number,
  penaltyPerGuess: number,
  wrongGuesses: number,
  success: boolean
): number {
  if (!success) return 0;
  return Math.max(0, baseScore - (wrongGuesses * penaltyPerGuess));
}

/**
 * Calculate total game score
 */
export function calculateTotalPastaScore(results: PastaGameResults): number {
  return Math.min(
    PASTA_SCORING.MAX_TOTAL_SCORE,
    results.pastaScore + results.sauceScore + results.regionScore + results.proteinScore
  );
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate direction from one coordinate to another
 */
export function calculateDirection(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): string {
  const dLng = toLng - fromLng;
  const dLat = toLat - fromLat;
  const angle = Math.atan2(dLng, dLat) * 180 / Math.PI;

  // Convert angle to compass direction
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((angle + 360) % 360) / 45) % 8;
  return directions[index];
}

/**
 * Validate if a guess matches acceptable guesses (case-insensitive and accent-insensitive)
 */
export function isGuessCorrect(guess: string, acceptableGuesses: string[]): boolean {
  const normalizedGuess = normalizeForComparison(guess);
  return acceptableGuesses.some(
    acceptable => normalizeForComparison(acceptable) === normalizedGuess
  );
}
