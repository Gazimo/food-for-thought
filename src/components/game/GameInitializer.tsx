"use client";

import { useTodaysDish } from "@/hooks/useDishes";
import { useGameStore } from "@/store";
import { alreadyPlayedToday, getStreak } from "@/utils/streak";
import { useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { ReactNode, useEffect, useRef } from "react";

interface GameInitializerProps {
  children: ReactNode;
}

export function GameInitializer({ children }: GameInitializerProps) {
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
      const {
        restoreGameStateFromStorage,
        startNewGame,
        resetCountryGuesses,
        resetProteinGuesses,
        setActivePhase,
      } = useGameStore.getState();

      const hasRestoredState = restoreGameStateFromStorage();

      if (!hasRestoredState && dish) {
        setCurrentDish(dish);
        startNewGame();
        resetCountryGuesses();
        resetProteinGuesses();
        setActivePhase("dish");
      } else if (hasRestoredState && dish) {
        setCurrentDish(dish);
      }

      hasInitialized.current = true;
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
