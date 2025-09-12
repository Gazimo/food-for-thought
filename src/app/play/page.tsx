"use client";

import { ArchiveStatus } from "@/components/ArchiveStatus";
import { GameFooter } from "@/components/GameFooter";
import { GameHeader } from "@/components/GameHeader";
import { GameNavigation, ShowResultsButton } from "@/components/GameNavigation";
import { PhaseContainer } from "@/components/PhaseContainer";
import { PhaseRenderer } from "@/components/PhaseRenderer";
import { useTodaysDish } from "@/hooks/useDishes";
import { useGameStore } from "@/store/gameStore";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";
import { getPhaseConfig } from "../../config/gamePhases";
import { alreadyPlayedToday, getStreak } from "../../utils/streak";
import { CountryPhase } from "./CountryPhase";
import { DishPhase } from "./DishPhase";
import { ProteinPhase } from "./ProteinPhase";

const IntroModal = dynamic(
  () => import("../../components/IntroModal").then((mod) => mod.IntroModal),
  { ssr: false }
);
const ResultModal = dynamic(
  () => import("@/components/ResultModal").then((mod) => mod.ResultModal),
  { ssr: false }
);

export default function GamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const archiveDate = searchParams?.get("date") || null;

  const {
    gamePhase,
    modalVisible,
    toggleModal,
    activePhase,
    gameResults,
    markGameTracked,
    setCurrentDish,
    isPlayingArchive,
    isArchivesUnlockedNow,
    startArchiveMode,
    exitArchiveMode,
    archiveDate: storeArchiveDate,
  } = useGameStore();

  // Use store state as source of truth for which data to fetch
  const effectiveArchiveDate = isPlayingArchive ? storeArchiveDate : null;
  const { dish, isLoading, isError, error } = useTodaysDish(
    effectiveArchiveDate || undefined
  );

  // Handle errors specifically for archive access
  useEffect(() => {
    if (isError && error && effectiveArchiveDate) {
      const errorWithStatus = error as any;
      if (errorWithStatus.status === 403) {
        setArchiveAccessError(
          errorWithStatus.message ||
            "Archives are locked. Share today's results to unlock!"
        );
      } else if (errorWithStatus.status === 404) {
        // Handle archive date not available
        setArchiveAccessError(
          errorWithStatus.message ||
            `No archived game available for ${effectiveArchiveDate}. This date may be before our game archive began.`
        );
      }
    }
  }, [isError, error, effectiveArchiveDate]);
  const setStreak = useGameStore((s) => s.setStreak);
  const hasInitialized = useRef(false);
  const [isIntroModalOpen, setIntroModalOpen] = useState(false);
  const [archiveAccessError, setArchiveAccessError] = useState<string | null>(
    null
  );

  // Handle archive mode initialization
  useEffect(() => {
    if (archiveDate) {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(archiveDate)) {
        setArchiveAccessError("Invalid date format");
        return;
      }

      // Check if date is not in the future
      const today = new Date().toISOString().split("T")[0];
      if (archiveDate > today) {
        setArchiveAccessError("Cannot access future dates");
        return;
      }

      // For archive access, let the server be the final authority
      // The client-side check is just for UX, server will validate the HTTP-only cookie
      const hasClientSideUnlock = isArchivesUnlockedNow();

      if (!hasClientSideUnlock) {
        console.log(
          "⚠️ No client-side unlock found, but attempting archive access (server will validate)"
        );
      }

      // Start archive mode - let server validation handle access control
      if (
        !isPlayingArchive ||
        useGameStore.getState().archiveDate !== archiveDate
      ) {
        startArchiveMode(archiveDate);
      }
    } else if (isPlayingArchive) {
      // Exit archive mode if no date parameter
      exitArchiveMode();
    }
  }, [
    archiveDate,
    isArchivesUnlockedNow,
    isPlayingArchive,
    startArchiveMode,
    exitArchiveMode,
  ]);

  useEffect(() => {
    const hasSeenIntro = localStorage.getItem("hasSeenIntro");
    if (!hasSeenIntro) {
      setIntroModalOpen(true);
    }
  }, []);

  const closeIntroModal = () => {
    localStorage.setItem("hasSeenIntro", "true");
    setIntroModalOpen(false);
  };

  useEffect(() => {
    posthog.capture("game_start", {
      mode: alreadyPlayedToday() ? "daily" : "freeplay",
    });
  }, []);

  useEffect(() => {
    const value = getStreak();
    setStreak(value);
  }, [setStreak]);

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
        // Only start new game if we didn't restore existing state
        setCurrentDish(dish);
        startNewGame();
        resetCountryGuesses();
        resetProteinGuesses();
        setActivePhase("dish");
      } else if (hasRestoredState && dish) {
        // If we restored state, just set the current dish
        setCurrentDish(dish);
      }

      hasInitialized.current = true;
    };
    if (dish && !isLoading) {
      init();
    }
  }, [dish, isLoading, setCurrentDish]);

  useEffect(() => {
    // Always update currentDish when dish data changes
    // This ensures proper synchronization when switching between archive and today modes
    if (dish) {
      setCurrentDish(dish);
    }
  }, [dish, setCurrentDish]);

  useEffect(() => {
    if (!hasInitialized.current) return;

    if (gamePhase === "dish") {
      const { resetCountryGuesses, resetProteinGuesses, setActivePhase } =
        useGameStore.getState();
      resetCountryGuesses();
      resetProteinGuesses();
      setActivePhase("dish");
    }
  }, [gamePhase]);

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

  // Handle archive access errors
  if (archiveAccessError) {
    return (
      <main className="p-4 sm:p-6 max-w-full sm:max-w-xl mx-auto flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2 text-amber-600">
              Archive Access Restricted
            </h2>
            <p className="text-gray-600 mb-4">{archiveAccessError}</p>
            <button
              onClick={() => router.push("/play")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Today's Game
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="p-4 sm:p-6 max-w-full sm:max-w-xl mx-auto flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2 text-red-600">
              Failed to load game
            </h2>
            <p className="text-gray-600 mb-4">
              {effectiveArchiveDate
                ? `Could not load game for ${effectiveArchiveDate}. The game may not exist for this date.`
                : "Please check your connection and try again."}
            </p>
            <button
              onClick={() =>
                effectiveArchiveDate
                  ? router.push("/play")
                  : window.location.reload()
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {effectiveArchiveDate ? "Back to Today's Game" : "Retry"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  const renderPhaseContent = () => {
    const phaseConfig = getPhaseConfig(activePhase);
    if (!phaseConfig) return null;

    const commonProps = {
      phaseKey: activePhase,
      title: phaseConfig.title,
    };

    if (!hasInitialized.current || isLoading || !dish) {
      let correctPhase = activePhase;

      if (typeof window !== "undefined" && !hasInitialized.current) {
        try {
          const saved = localStorage.getItem("fft-game-state");
          if (saved) {
            const parsedState = JSON.parse(saved);

            const today = new Date().toISOString().split("T")[0];
            const savedDate = parsedState.savedDate;

            if (savedDate && savedDate === today) {
              correctPhase = parsedState.activePhase || "dish";
            } else {
              correctPhase = "dish";
            }
          }
        } catch (error) {
          console.warn("Failed to read phase from localStorage:", error);
        }
      }

      const correctPhaseConfig = getPhaseConfig(correctPhase);
      const correctCommonProps = {
        phaseKey: correctPhase,
        title: correctPhaseConfig?.title || phaseConfig.title,
      };

      return (
        <PhaseRenderer {...correctCommonProps}>
          {correctPhase === "dish" && <DishPhase />}
          {correctPhase === "country" && <CountryPhase />}
          {correctPhase === "protein" && <ProteinPhase />}
        </PhaseRenderer>
      );
    }

    switch (activePhase) {
      case "dish":
        return (
          <PhaseRenderer {...commonProps}>
            <DishPhase />
          </PhaseRenderer>
        );
      case "country":
        return (
          <PhaseRenderer {...commonProps}>
            <CountryPhase />
          </PhaseRenderer>
        );
      case "protein":
        return (
          <PhaseRenderer {...commonProps}>
            <ProteinPhase />
          </PhaseRenderer>
        );
      default:
        return null;
    }
  };

  return (
    <main className="p-4 sm:p-6 max-w-full sm:max-w-xl mx-auto flex flex-col min-h-screen">
      <IntroModal isOpen={isIntroModalOpen} onClose={closeIntroModal} />
      <GameHeader onShowRules={() => setIntroModalOpen(true)} />

      <PhaseContainer>
        <AnimatePresence mode="wait">{renderPhaseContent()}</AnimatePresence>

        <GameNavigation
          activePhase={activePhase}
          gamePhase={gamePhase}
          modalVisible={modalVisible}
          toggleModal={toggleModal}
        />

        <ShowResultsButton
          gamePhase={gamePhase}
          modalVisible={modalVisible}
          toggleModal={toggleModal}
        />

        {/* Show archive status when game is complete and not in modal */}
        {gamePhase === "complete" && !modalVisible && !isPlayingArchive && (
          <div className="mt-4">
            <ArchiveStatus isUnlocked={isArchivesUnlockedNow()} />
          </div>
        )}
      </PhaseContainer>

      <ResultModal />
      <GameFooter />
    </main>
  );
}
