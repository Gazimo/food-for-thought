"use client";

import { GameFooter } from "@/components/GameFooter";
import { GameHeader } from "@/components/GameHeader";
import { GameNavigation, ShowResultsButton } from "@/components/GameNavigation";
import { GameSkeleton } from "@/components/GameSkeleton";
import { PhaseContainer } from "@/components/PhaseContainer";
import { PhaseRenderer } from "@/components/PhaseRenderer";
import { ResultModal } from "@/components/ResultModal";
import { useTodaysDish } from "@/hooks/useDishes";
import { useGameStore } from "@/store/gameStore";
import { AnimatePresence } from "framer-motion";
import posthog from "posthog-js";
import { useEffect, useRef } from "react";
import { IntroModal } from "../../components/IntroModal";
import { getPhaseConfig } from "../../config/gamePhases";
import { alreadyPlayedToday, getStreak } from "../../utils/streak";
import { CountryPhase } from "./CountryPhase";
import { DishPhase } from "./DishPhase";
import { ProteinPhase } from "./ProteinPhase";

export default function GamePage() {
  const {
    gamePhase,
    modalVisible,
    toggleModal,
    activePhase,
    gameResults,
    markGameTracked,
    setCurrentDish,
  } = useGameStore();

  const { dish, isLoading, isError } = useTodaysDish();
  const setStreak = useGameStore((s) => s.setStreak);
  const hasInitialized = useRef(false);

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

      restoreGameStateFromStorage();

      const currentState = useGameStore.getState();
      if (!currentState.currentDish && dish) {
        setCurrentDish(dish);
        startNewGame();
        resetCountryGuesses();
        resetProteinGuesses();
        setActivePhase("dish");
      }

      hasInitialized.current = true;
    };
    if (dish && !isLoading) {
      init();
    }
  }, [dish, isLoading, setCurrentDish]);

  useEffect(() => {
    if (dish && !useGameStore.getState().currentDish) {
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

  if (isError) {
    return (
      <main className="p-4 sm:p-6 max-w-full sm:max-w-xl mx-auto flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2 text-red-600">
              Failed to load game
            </h2>
            <p className="text-gray-600 mb-4">
              Please check your connection and try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading || !dish) {
    return (
      <main className="p-4 sm:p-6 max-w-full sm:max-w-xl mx-auto flex flex-col min-h-screen">
        <GameHeader />
        <PhaseContainer>
          <GameSkeleton />
        </PhaseContainer>
        <GameFooter />
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
      <IntroModal />
      <GameHeader />

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
      </PhaseContainer>

      <ResultModal />
      <GameFooter />
    </main>
  );
}
