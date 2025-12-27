"use client";

import { useTodaysDish } from "@/hooks/useDishes";
import { useGameStore } from "@/store";
import { useGameContext, useOptionalGameContext } from "@/contexts/GameContext";
import { alreadyPlayedToday, getStreak } from "@/utils/streak";
import { useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { ReactNode, useEffect, useRef } from "react";
import { decryptGameItem } from "@/utils/gameItemDecryption";
import debugLogger from "@/utils/debugLogger";

interface GameInitializerProps {
  children: ReactNode;
}

/**
 * Game Initializer
 *
 * Handles initialization for both legacy F4T and unified architecture.
 * Detects which architecture to use based on GameContext.
 */
export function GameInitializer({ children }: GameInitializerProps) {
  const gameContext = useOptionalGameContext();

  // Check if we're using unified architecture from game config
  const isUsingUnifiedArchitecture =
    gameContext?.gameConfig?.architecture === "unified";

  if (isUsingUnifiedArchitecture) {
    return <UnifiedArchitectureInitializer>{children}</UnifiedArchitectureInitializer>;
  } else {
    return <LegacyFFTInitializer>{children}</LegacyFFTInitializer>;
  }
}

/**
 * Initializer for unified architecture (Pasta and future games)
 */
function UnifiedArchitectureInitializer({ children }: GameInitializerProps) {
  const { gameConfig } = useGameContext();
  const searchParams = useSearchParams();
  const archiveDate = searchParams?.get("date") || null;
  const puzzleDate = archiveDate || new Date().toISOString().split("T")[0];

  const initializeGame = useGameStore((state) => state.initializeGame);
  const startUnifiedArchiveMode = useGameStore((state) => state.startUnifiedArchiveMode);
  const isArchiveMode = useGameStore((state) => state.isArchiveMode);
  const currentItem = useGameStore((state) => state.currentItem);
  const currentGameTypeId = useGameStore((state) => state.currentGameTypeId);
  const setGameError = useGameStore((state) => state.setGameError);
  const clearGameError = useGameStore((state) => state.clearGameError);

  const hasInitialized = useRef(false);

  // Archive mode handling
  useEffect(() => {
    if (archiveDate && gameConfig && !isArchiveMode) {
      startUnifiedArchiveMode(archiveDate);
    }
  }, [archiveDate, gameConfig, isArchiveMode, startUnifiedArchiveMode]);

  // Fetch today's item (pasta, dish, etc.) based on game type
  useEffect(() => {
    if (hasInitialized.current || !gameConfig) return;

    const fetchGameItem = async () => {
      try {
        debugLogger.group('GAME_INIT', `Initializing ${gameConfig.id} game`);

        // Fetch item from game-specific API endpoint
        // Note: Pasta uses /daily, not /today
        const endpoint = archiveDate
          ? `${gameConfig.apiPrefix}/daily?date=${archiveDate}`
          : `${gameConfig.apiPrefix}/daily`;

        debugLogger.api('Requesting game item', {
          gameType: gameConfig.id,
          endpoint,
          archiveDate,
        });

        const response = await fetch(endpoint);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Only log unexpected errors (not 403/404 which are expected)
          const isExpectedError = response.status === 403 || response.status === 404;
          if (!isExpectedError) {
            debugLogger.error('API request failed', {
              endpoint,
              status: response.status,
              statusText: response.statusText,
              errorData,
            });
          }

          // Throw error with full context for proper error handling
          const error = new Error(errorData.error || "Failed to fetch game item") as Error & {
            status: number;
            code: string;
          };
          error.status = response.status;
          error.code = errorData.code || 'API_ERROR';
          throw error;
        }

        const encryptedItem = await response.json();

        debugLogger.api('Response received', {
          status: 200,
          responseKeys: Object.keys(encryptedItem || {}),
          hasEncryptedFields: encryptedItem?._encrypted ? true : false,
        });

        const item = decryptGameItem(encryptedItem, gameConfig.id);

        if (!item) {
          debugLogger.error('Failed to decrypt game item');
          throw new Error("Failed to decrypt game item");
        }

        debugLogger.gameInit('Game item decrypted successfully', {
          itemId: item?.id,
          itemName: (item as any)?.name || '[encrypted]',
          hasAcceptableGuesses: !!(item as any)?.acceptableGuesses,
          acceptableGuessesCount: (item as any)?.acceptableGuesses?.length || 0,
        });

        initializeGame(gameConfig.id, gameConfig, item, puzzleDate);
        hasInitialized.current = true;

        debugLogger.gameInit('Game state initialized', {
          gameTypeId: gameConfig.id,
          puzzleDate,
          phaseCount: gameConfig.phases.length,
          currentPhase: gameConfig.phases[0].id,
        });

        debugLogger.groupEnd();

        // Analytics
        posthog.capture("game_start", {
          game: gameConfig.id,
          mode: archiveDate ? "archive" : "daily",
        });
      } catch (error) {
        // Only log unexpected errors (403/404 are expected for archive restrictions)
        const isExpectedError =
          typeof error === 'object' &&
          error !== null &&
          'status' in error &&
          ((error as { status: number }).status === 403 || (error as { status: number }).status === 404);

        if (!isExpectedError) {
          debugLogger.error('Failed to initialize game', error);
        }
        debugLogger.groupEnd();

        // Handle API errors with status and code
        if (typeof error === 'object' && error !== null && 'status' in error) {
          const apiError = error as Error & { status: number; code?: string };
          setGameError({
            message: apiError.message || 'Failed to load game',
            code: apiError.code || 'API_ERROR',
            status: apiError.status,
          });
        } else {
          // Generic error (network issue, etc.)
          setGameError({
            message: error instanceof Error ? error.message : 'Failed to load game',
            code: 'INITIALIZATION_ERROR',
            status: 500,
          });
        }
      }
    };

    fetchGameItem();
  }, [gameConfig, archiveDate, puzzleDate, initializeGame]);

  return <>{children}</>;
}

/**
 * Legacy initializer for F4T game
 */
function LegacyFFTInitializer({ children }: GameInitializerProps) {
  const searchParams = useSearchParams();
  const archiveDate = searchParams?.get("date") || null;

  const {
    setCurrentDish,
    isPlayingArchive,
    archiveDate: storeArchiveDate,
    startArchiveMode,
    exitArchiveMode,
    isArchivesUnlockedNow,
    setStreak,
    gameResults,
    markGameTracked,
  } = useGameStore();

  const effectiveArchiveDate = isPlayingArchive ? storeArchiveDate : null;
  const { dish, isLoading } = useTodaysDish(effectiveArchiveDate || undefined);
  const hasInitialized = useRef(false);

  // Archive mode handling
  useEffect(() => {
    if (archiveDate) {
      const hasClientSideUnlock = isArchivesUnlockedNow();

      if (!hasClientSideUnlock) {
        console.log(
          "⚠️ No client-side unlock found, but attempting archive access (server will validate)"
        );
      }

      if (
        !isPlayingArchive ||
        useGameStore.getState().archiveDate !== archiveDate
      ) {
        startArchiveMode(archiveDate);
      }
    } else if (isPlayingArchive) {
      exitArchiveMode();
    }
  }, [
    archiveDate,
    isArchivesUnlockedNow,
    isPlayingArchive,
    startArchiveMode,
    exitArchiveMode,
  ]);

  // Game start analytics
  useEffect(() => {
    posthog.capture("game_start", {
      mode: alreadyPlayedToday() ? "daily" : "freeplay",
    });
  }, []);

  // Streak initialization
  useEffect(() => {
    const value = getStreak();
    setStreak(value);
  }, [setStreak]);

  // Game initialization
  useEffect(() => {
    if (hasInitialized.current) return;

    const init = async () => {
      debugLogger.group('GAME_INIT', 'Initializing F4T game (legacy)');

      const {
        restoreGameStateFromStorage,
        startNewGame,
        resetCountryGuesses,
        resetProteinGuesses,
        setActivePhase,
      } = useGameStore.getState();

      const hasRestoredState = restoreGameStateFromStorage();

      debugLogger.gameInit('State restoration check', {
        hasRestoredState,
        hasDish: !!dish,
        dishId: dish?.id,
      });

      if (!hasRestoredState && dish) {
        debugLogger.gameInit('Starting new game', { dishId: dish.id });
        setCurrentDish(dish);
        startNewGame();
        resetCountryGuesses();
        resetProteinGuesses();
        setActivePhase("dish");
      } else if (hasRestoredState && dish) {
        debugLogger.gameInit('Restored saved game', { dishId: dish.id });
        setCurrentDish(dish);
      }

      hasInitialized.current = true;
      debugLogger.groupEnd();
    };

    if (dish && !isLoading) {
      init();
    }
  }, [dish, isLoading, setCurrentDish]);

  // Keep dish synchronized
  useEffect(() => {
    if (dish) {
      setCurrentDish(dish);
    }
  }, [dish, setCurrentDish]);

  // Game completion analytics
  useEffect(() => {
    if (gameResults?.status && !gameResults.tracked) {
      posthog.capture("game_end", {
        success: gameResults.status === "won",
        guessCount:
          (gameResults.dishGuesses?.length || 0) +
          (gameResults.countryGuesses?.length || 0) +
          (gameResults.proteinGuesses?.length || 0),
        mode: alreadyPlayedToday() ? "daily" : "freeplay",
      });

      markGameTracked();
    }
  }, [
    gameResults?.status,
    gameResults?.tracked,
    gameResults?.dishGuesses?.length,
    gameResults?.countryGuesses?.length,
    gameResults?.proteinGuesses?.length,
    markGameTracked,
  ]);

  return <>{children}</>;
}
