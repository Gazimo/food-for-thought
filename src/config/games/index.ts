/**
 * Game Registry
 *
 * Central registry for all game types in the Food for Thought platform.
 * This module provides utilities to:
 * - Look up game configurations by ID or URL path
 * - Get lists of available/enabled games
 * - Access phase configurations
 */

export * from "./types";
export { foodForThoughtConfig } from "./food-for-thought";
export { italianPastaConfig } from "./italian-pasta";

import { foodForThoughtConfig } from "./food-for-thought";
import { italianPastaConfig } from "./italian-pasta";
import { GameConfig, GameTypeId, PhaseConfig, PhaseId } from "./types";

/**
 * Registry of all game configurations.
 * Add new games here as they are created.
 */
export const GAME_REGISTRY: Record<GameTypeId, GameConfig> = {
  "food-for-thought": foodForThoughtConfig,
  "italian-pasta": italianPastaConfig,
};

/**
 * Get all registered games
 */
export function getAllGames(): GameConfig[] {
  return Object.values(GAME_REGISTRY);
}

/**
 * Get all enabled games (ready for production)
 */
export function getEnabledGames(): GameConfig[] {
  return getAllGames().filter((game) => game.enabled);
}

/**
 * Get a game configuration by its ID
 */
export function getGameById(id: GameTypeId): GameConfig | undefined {
  return GAME_REGISTRY[id];
}

/**
 * Get a game configuration by its URL path
 */
export function getGameByPath(path: string): GameConfig | undefined {
  // Normalize the path (remove trailing slashes, ensure leading slash)
  const normalizedPath = "/" + path.replace(/^\/|\/$/g, "");
  return getAllGames().find((game) => game.urlPath === normalizedPath);
}

/**
 * Get the default game (Food for Thought)
 */
export function getDefaultGame(): GameConfig {
  return foodForThoughtConfig;
}

/**
 * Get phase configuration for a specific game and phase
 */
export function getPhaseConfig(
  gameId: GameTypeId,
  phaseId: PhaseId
): PhaseConfig | undefined {
  const game = getGameById(gameId);
  if (!game) return undefined;
  return game.phases.find((phase) => phase.id === phaseId);
}

/**
 * Get all phases for a game
 */
export function getGamePhases(gameId: GameTypeId): PhaseConfig[] {
  const game = getGameById(gameId);
  return game?.phases ?? [];
}

/**
 * Get the first playable phase for a game
 */
export function getFirstPhase(gameId: GameTypeId): PhaseConfig | undefined {
  const phases = getGamePhases(gameId);
  return phases[0];
}

/**
 * Get the next phase after a given phase
 */
export function getNextPhase(
  gameId: GameTypeId,
  currentPhaseId: PhaseId
): PhaseConfig | undefined {
  const phases = getGamePhases(gameId);
  const currentIndex = phases.findIndex((p) => p.id === currentPhaseId);
  if (currentIndex === -1 || currentIndex >= phases.length - 1) {
    return undefined;
  }
  return phases[currentIndex + 1];
}

/**
 * Check if a phase is the last playable phase in a game
 */
export function isLastPhase(gameId: GameTypeId, phaseId: PhaseId): boolean {
  const phases = getGamePhases(gameId);
  const lastPlayableIndex = phases.length - 1;
  const currentIndex = phases.findIndex((p) => p.id === phaseId);
  return currentIndex === lastPlayableIndex;
}

/**
 * Get phase IDs for a game (useful for type checking)
 */
export function getPhaseIds(gameId: GameTypeId): PhaseId[] {
  return getGamePhases(gameId).map((p) => p.id);
}

/**
 * Check if a game exists and is enabled
 */
export function isGameAvailable(gameId: GameTypeId): boolean {
  const game = getGameById(gameId);
  return game?.enabled ?? false;
}

/**
 * Map of URL paths to game IDs for routing
 */
export const URL_PATH_TO_GAME_ID: Record<string, GameTypeId> = Object.fromEntries(
  getAllGames().map((game) => [game.urlPath, game.id])
) as Record<string, GameTypeId>;
