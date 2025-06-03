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
import { ProteinPhase } from "./ProteinPhase";

export default function GamePage() {
  const {
    currentDish,
    gamePhase,
    modalVisible,
    toggleModal,
    startNewGame,
    resetCountryGuesses,
    resetProteinGuesses,
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
        resetProteinGuesses();
        setActivePhase("dish");
      }
    };

    if (!currentDish) {
      init();
    }
  }, [
    currentDish,
    startNewGame,
    resetCountryGuesses,
    resetProteinGuesses,
    setActivePhase,
  ]);

  useEffect(() => {
    if (gamePhase === "dish") {
      resetCountryGuesses();
      resetProteinGuesses();
      setActivePhase("dish");
    }
  }, [gamePhase, resetCountryGuesses, resetProteinGuesses, setActivePhase]);

  return (
    <main className="p-4 sm:p-6 max-w-full sm:max-w-xl mx-auto flex flex-col min-h-screen">
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
              <CountryPhase
                isComplete={gamePhase === "protein" || gamePhase === "complete"}
              />
            </motion.div>
          )}

          {activePhase === "protein" && (
            <motion.div
              key="protein"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold">
                💪 Guess the Protein Content
              </h2>
              <ProteinPhase isComplete={gamePhase === "complete"} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        {activePhase === "dish" &&
          (gamePhase === "country" ||
            gamePhase === "protein" ||
            gamePhase === "complete") && (
            <div className="text-center mt-4">
              <Button
                onClick={() => setActivePhase("country")}
                className={cn(
                  "px-4 py-2 rounded-lg",
                  gamePhase === "country" && "animate-pulse"
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
          <div className="flex justify-between mt-2">
            <Button
              onClick={() => setActivePhase("dish")}
              className="px-3 py-1 rounded"
              variant="neutral"
            >
              ← Back to Dish
            </Button>
            {(gamePhase === "protein" || gamePhase === "complete") && (
              <Button
                onClick={() => setActivePhase("protein")}
                className={cn(
                  "px-4 py-2 rounded-lg",
                  gamePhase === "protein" && "animate-pulse"
                )}
                variant="phase"
              >
                {gamePhase === "complete"
                  ? "Review protein guess"
                  : "Guess the protein"}
              </Button>
            )}
          </div>
        )}

        {activePhase === "protein" && (
          <div className="text-left mt-2">
            <Button
              onClick={() => setActivePhase("country")}
              className="px-3 py-1 rounded"
              variant="neutral"
            >
              ← Back to Country
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
