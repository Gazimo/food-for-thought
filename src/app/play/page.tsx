"use client";

import { GameFooter } from "@/components/GameFooter";
import { GameHeader } from "@/components/GameHeader";
import { PhaseContainer } from "@/components/PhaseContainer";
import { ResultModal } from "@/components/ResultModal";
import { useGameStore } from "@/store/gameStore";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { IntroModal } from "../../components/IntroModal";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { alreadyPlayedToday, getStreak } from "../../utils/streak";
import { CountryPhase } from "./CountryPhase";
import { DishPhase } from "./DishPhase";

export default function GamePage() {
  const {
    currentDish,
    gamePhase,
    modalVisible,
    toggleModal,
    startNewGame,
    resetCountryGuesses,
    activePhase,
    setActivePhase,
  } = useGameStore();

  const setStreak = useGameStore((s) => s.setStreak);

  useEffect(() => {
    const value = getStreak();
    setStreak(value);
  }, [setStreak]);

  useEffect(() => {
    const init = async () => {
      const { loadDishes, restoreGameStateFromStorage } =
        useGameStore.getState();

      await loadDishes();

      if (alreadyPlayedToday()) {
        restoreGameStateFromStorage();
      } else {
        startNewGame();
        resetCountryGuesses();
        setActivePhase("dish");
      }
    };

    if (!currentDish) {
      init();
    }
  }, [currentDish, startNewGame, resetCountryGuesses, setActivePhase]);

  useEffect(() => {
    if (gamePhase === "dish") {
      resetCountryGuesses();
      setActivePhase("dish");
    }
  }, [gamePhase, resetCountryGuesses, setActivePhase]);

  return (
    <main className="p-4 sm:p-6 max-w-full sm:max-w-xl mx-auto">
      <IntroModal />
      <GameHeader />

      <PhaseContainer>
        <AnimatePresence mode="wait">
          {activePhase === "dish" && (
            <motion.div
              key="dish"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
            >
              <h2 className="text-xl font-semibold">🍽️ Guess the Dish</h2>
              <DishPhase isComplete={gamePhase !== "dish"} />
            </motion.div>
          )}

          {activePhase === "country" && (
            <motion.div
              key="country"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold">
                🌍 Guess the Country of Origin
              </h2>
              <CountryPhase isComplete={gamePhase === "complete"} />
            </motion.div>
          )}
        </AnimatePresence>
        {activePhase === "dish" &&
          (gamePhase === "country" || gamePhase === "complete") && (
            <div className="text-center mt-4">
              <Button
                onClick={() => setActivePhase("country")}
                className={cn(
                  "px-4 py-2 rounded-lg",
                  gamePhase !== "complete" && "animate-pulse"
                )}
                variant="phase"
              >
                {gamePhase === "complete"
                  ? "Review your country guess"
                  : "Guess where it's from"}
              </Button>
            </div>
          )}
        {activePhase === "country" && (
          <div className="text-left mt-2">
            <Button
              onClick={() => setActivePhase("dish")}
              className="px-3 py-1 rounded"
              variant="neutral"
            >
              ← Back to Dish
            </Button>
          </div>
        )}

        {gamePhase === "complete" && !modalVisible && (
          <div className="text-center mt-4">
            <Button
              onClick={() => toggleModal(true)}
              className="px-4 py-2"
              variant="secondary"
            >
              Show Results
            </Button>
          </div>
        )}
      </PhaseContainer>

      <ResultModal />
      <GameFooter />
    </main>
  );
}
