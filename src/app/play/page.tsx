"use client";

import { GameFooter } from "@/components/GameFooter";
import { GameHeader } from "@/components/GameHeader";
import { PhaseContainer } from "@/components/PhaseContainer";
import { ResultModal } from "@/components/ResultModal";
import { TileGrid } from "@/components/dish-image/TileGrid";
import { useGameStore } from "@/store/gameStore";
import { useEffect } from "react";
import { IntroModal } from "../../components/IntroModal";
import { getStreak } from "../../utils/streak";
import { CountryPhase } from "./CountryPhase";
import { DishPhase } from "./DishPhase";

export default function GamePage() {
  const {
    currentDish,
    gamePhase,
    modalVisible,
    toggleModal,
    startNewGame,
    revealedTiles,
    resetCountryGuesses,
    activePhase,
    setActivePhase,
    streak,
    setStreak,
  } = useGameStore();

  useEffect(() => {
    const value = getStreak();
    setStreak(value);
  }, [setStreak]);

  useEffect(() => {
    const init = async () => {
      const { loadDishes } = useGameStore.getState();
      await loadDishes();
      startNewGame();
      resetCountryGuesses();
      setActivePhase("dish");
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

      {currentDish?.imageUrl && (
        <TileGrid
          imageUrl={currentDish.imageUrl}
          revealedTiles={revealedTiles}
        />
      )}

      <PhaseContainer>
        {/* Phase Content */}
        {activePhase === "dish" && (
          <DishPhase isComplete={gamePhase !== "dish"} />
        )}
        {activePhase === "country" && (
          <CountryPhase isComplete={gamePhase === "complete"} />
        )}
        {/* Next/Back navigation */}
        {activePhase === "dish" &&
          (gamePhase === "country" || gamePhase === "complete") && (
            <div className="text-center mt-4">
              <button
                onClick={() => setActivePhase("country")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {gamePhase === "complete"
                  ? "Review your country guess"
                  : "Try the next round"}
              </button>
            </div>
          )}
        {activePhase === "country" && (
          <div className="text-left mt-2 mb-4">
            <button
              onClick={() => setActivePhase("dish")}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              ← Back to Dish
            </button>
          </div>
        )}
        {/* Show Results button after completion */}
        {gamePhase === "complete" && !modalVisible && (
          <div className="text-center mt-4">
            <button
              onClick={() => toggleModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Show Results
            </button>
          </div>
        )}
      </PhaseContainer>

      <ResultModal />
      <GameFooter />
    </main>
  );
}
