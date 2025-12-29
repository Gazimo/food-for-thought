"use client";

import { useGameStore } from "@/store";
import { useGameContext } from "@/contexts/GameContext";
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
 * Handles initialization for all games using unified architecture.
 */
export function GameInitializer({ children }: GameInitializerProps) {
  return <UnifiedArchitectureInitializer>{children}</UnifiedArchitectureInitializer>;
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

  // Archive mode handling
  useEffect(() => {
    if (archiveDate && gameConfig && !isArchiveMode) {
      startUnifiedArchiveMode(archiveDate);
    }
  }, [archiveDate, gameConfig, isArchiveMode, startUnifiedArchiveMode]);

  // Fetch game item for the current puzzle date
  // This effect properly re-runs when the date changes
  useEffect(() => {
    if (!gameConfig) return;

    const fetchGameItem = async () => {
      try {
        debugLogger.group('GAME_INIT', `Initializing ${gameConfig.id} game`);

        // Determine if this is an archive request
        const today = new Date().toISOString().split("T")[0];
        const isArchiveRequest = puzzleDate !== today;

        // Fetch item from game-specific API endpoint
        const endpoint = isArchiveRequest
          ? `${gameConfig.apiPrefix}/daily?date=${puzzleDate}`
          : `${gameConfig.apiPrefix}/daily`;

        debugLogger.api('Requesting game item', {
          gameType: gameConfig.id,
          endpoint,
          isArchiveRequest,
          puzzleDate,
        });

        const response = await fetch(endpoint, {
          credentials: 'include',
        });
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
          mode: isArchiveRequest ? "archive" : "daily",
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
  }, [puzzleDate, gameConfig]);

  return <>{children}</>;
}
