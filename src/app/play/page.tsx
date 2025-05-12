"use client";

import { GameFooter } from "@/components/GameFooter";
import { GameHeader } from "@/components/GameHeader";
import { PhaseContainer } from "@/components/PhaseContainer";
import { ResultModal } from "@/components/ResultModal";
import { TileGrid } from "@/components/dish-image/TileGrid";
import { useGameStore } from "@/store/gameStore";
import { useEffect } from "react";
import { CountryPhase } from "./CountryPhase";
import { DishPhase } from "./DishPhase";

export default function GamePage() {
  const {
    currentDish,
    gamePhase,
    startNewGame,
    revealedTiles,
    resetCountryGuesses,
  } = useGameStore();

  useEffect(() => {
    const init = async () => {
      const { loadDishes } = useGameStore.getState();
      await loadDishes();
      startNewGame();
      resetCountryGuesses();
    };

    if (!currentDish) {
      init();
    }
  }, [currentDish, startNewGame, resetCountryGuesses]);

  useEffect(() => {
    if (gamePhase === "dish") {
      resetCountryGuesses();
    }
  }, [gamePhase, resetCountryGuesses]);

  return (
    <main className="p-6 max-w-xl mx-auto">
      <GameHeader />

      {currentDish?.imageUrl && (
        <TileGrid
          imageUrl={currentDish.imageUrl}
          revealedTiles={revealedTiles}
        />
      )}

      <PhaseContainer>
        {gamePhase === "dish" && <DishPhase />}
        {gamePhase === "country" && <CountryPhase />}
      </PhaseContainer>

      <ResultModal />
      <GameFooter />
    </main>
  );
}
