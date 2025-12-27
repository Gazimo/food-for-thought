"use client";

/**
 * Game Context Provider
 *
 * Provides game configuration to all components within a game.
 * This allows components to be game-agnostic while still having
 * access to game-specific configuration.
 */

import {
  GameConfig,
  GameTypeId,
  getDefaultGame,
  getGameById,
  getPhaseConfig as getPhaseConfigFromRegistry,
  PhaseConfig,
  PhaseId,
} from "@/config/games";
import { createContext, ReactNode, useContext, useMemo } from "react";

interface GameContextValue {
  /** Current game configuration */
  gameConfig: GameConfig;
  /** Current game type ID */
  gameTypeId: GameTypeId;
  /** Get phase configuration by phase ID */
  getPhaseConfig: (phaseId: PhaseId) => PhaseConfig | undefined;
  /** Check if this is the default game */
  isDefaultGame: boolean;
  /** Get all phase IDs for navigation */
  phaseIds: PhaseId[];
}

const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
  /** Game type ID to load configuration for */
  gameTypeId: GameTypeId;
  /** Child components */
  children: ReactNode;
}

/**
 * Provider component that wraps game pages with game configuration context
 */
export function GameProvider({ gameTypeId, children }: GameProviderProps) {
  const value = useMemo<GameContextValue>(() => {
    const gameConfig = getGameById(gameTypeId) ?? getDefaultGame();

    return {
      gameConfig,
      gameTypeId: gameTypeId, // Use the parameter, not gameConfig.id
      getPhaseConfig: (phaseId: PhaseId) =>
        getPhaseConfigFromRegistry(gameConfig.id, phaseId),
      isDefaultGame: gameConfig.id === "food-for-thought",
      phaseIds: gameConfig.phases.map((p) => p.id),
    };
  }, [gameTypeId]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

/**
 * Hook to access game configuration within a game context
 *
 * @throws Error if used outside of a GameProvider
 */
export function useGameContext(): GameContextValue {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error("useGameContext must be used within a GameProvider");
  }

  return context;
}

/**
 * Hook to safely access game configuration (returns null if outside provider)
 * Useful for components that may be used both inside and outside game context
 */
export function useOptionalGameContext(): GameContextValue | null {
  return useContext(GameContext);
}