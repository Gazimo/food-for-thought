"use client";

import { CountryGuessFeedback } from "@/components/CountryGuessFeedback";
import { GuessFeedback } from "@/components/GuessFeedback";
import { GuessInput } from "@/components/GuessInput";
import { ResultModal } from "@/components/ResultModal";
import { TileGrid } from "@/components/dish-image/TileGrid";
import { useGameStore } from "@/store/gameStore";
import confetti from "canvas-confetti";
import { useEffect } from "react";
import { getCountryNames } from "../../utils/countries";

export default function GamePage() {
  const {
    currentDish,
    gamePhase,
    revealNextIngredient,
    moveToCountryPhase,
    completeGame,
    startNewGame,
    revealRandomTile,
    revealAllTiles,
    revealedTiles,
    resetCountryGuesses,
    makeDishGuess,
    makeCountryGuess,
    countryGuessResults,
  } = useGameStore();

  const countryNames = getCountryNames();

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

  const handleDishGuess = (guess: string) => {
    if (!currentDish) return;

    const isCorrect = makeDishGuess(guess);
    if (isCorrect) {
      confetti();
      revealAllTiles();
      moveToCountryPhase();
    } else {
      const { dishGuesses, revealedIngredients } = useGameStore.getState();
      const ingredientsLength = currentDish.ingredients.length || 0;

      if (dishGuesses >= 6) {
        revealAllTiles();
        moveToCountryPhase();
      } else {
        revealRandomTile();
        if (revealedIngredients < ingredientsLength) {
          revealNextIngredient();
        }
      }
    }
  };

  const handleCountryGuess = (guess: string) => {
    if (!currentDish || !currentDish.coordinates) return;
    const isCorrect = makeCountryGuess(guess);
    if (isCorrect) {
      completeGame();
      confetti();
    }
  };

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🍽️ Food for Thought</h1>
      <p className="text-lg text-gray-700 mb-8">
        Guess the dish based on ingredients. Then guess where it&apos;s from!
      </p>

      {currentDish?.imageUrl && (
        <TileGrid
          imageUrl={currentDish.imageUrl}
          revealedTiles={revealedTiles}
        />
      )}

      <div className="mt-6">
        {gamePhase === "dish" && (
          <>
            <h2 className="text-xl font-semibold mb-4">Guess the Dish</h2>
            <GuessInput
              placeholder="Enter a dish name..."
              onGuess={handleDishGuess}
            />
          </>
        )}

        {gamePhase === "country" && (
          <>
            <h2 className="text-xl font-semibold mb-4">Guess the Country</h2>
            <GuessInput
              placeholder="Enter a country name..."
              onGuess={handleCountryGuess}
              suggestions={countryNames}
            />
            <CountryGuessFeedback guessResults={countryGuessResults} />
          </>
        )}

        <GuessFeedback />
      </div>

      <ResultModal />
    </main>
  );
}
