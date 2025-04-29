"use client";

import {
  CountryGuessFeedback,
  CountryGuessResult,
} from "@/components/CountryGuessFeedback";
import { GuessFeedback } from "@/components/GuessFeedback";
import { GuessInput } from "@/components/GuessInput";
import { ResultModal } from "@/components/ResultModal";
import { TileGrid } from "@/components/dish-image/TileGrid";
import { useGameStore } from "@/store/gameStore";
import {
  calculateDirection,
  calculateDistance,
  isDishGuessCorrect,
  normalizeString,
} from "@/utils/gameHelpers";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";

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
  } = useGameStore();

  const [countryGuessResults, setCountryGuessResults] = useState<
    CountryGuessResult[]
  >([]);

  const countryCoords: Record<string, { lat: number; lng: number }> = {
    italy: { lat: 41.9028, lng: 12.4964 },
    israel: { lat: 31.7683, lng: 35.2137 },
    france: { lat: 46.2276, lng: 2.2137 },
    japan: { lat: 36.2048, lng: 138.2529 },
    mexico: { lat: 23.6345, lng: -102.5528 },
    india: { lat: 20.5937, lng: 78.9629 },
  };

  useEffect(() => {
    if (!currentDish) {
      startNewGame();
    }
  }, [currentDish, startNewGame]);

  const handleDishGuess = (guess: string) => {
    if (!currentDish) return;

    if (isDishGuessCorrect(guess, currentDish)) {
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

    const normalizedGuess = normalizeString(guess);
    const normalizedAnswer = normalizeString(currentDish.country);

    if (normalizedGuess === normalizedAnswer) {
      setCountryGuessResults([
        ...countryGuessResults,
        { country: guess, isCorrect: true, distance: 0, direction: "N/A" },
      ]);
      completeGame();
      confetti();
    } else {
      const guessedCoords = countryCoords[normalizedGuess];
      if (!guessedCoords) {
        setCountryGuessResults([
          ...countryGuessResults,
          {
            country: guess,
            isCorrect: false,
            distance: NaN,
            direction: "Invalid",
          },
        ]);
        return;
      }

      const distance = calculateDistance(
        guessedCoords.lat,
        guessedCoords.lng,
        currentDish.coordinates.lat,
        currentDish.coordinates.lng
      );

      const direction = calculateDirection(
        guessedCoords.lat,
        guessedCoords.lng,
        currentDish.coordinates.lat,
        currentDish.coordinates.lng
      );

      setCountryGuessResults([
        ...countryGuessResults,
        { country: guess, isCorrect: false, distance, direction },
      ]);
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
            <h2 className="text-xl font-semibold mb-4">
              Phase 1: Guess the Dish
            </h2>
            <GuessInput
              placeholder="Enter a dish name..."
              onGuess={handleDishGuess}
            />
          </>
        )}

        {gamePhase === "country" && (
          <>
            <h2 className="text-xl font-semibold mb-4">
              Phase 2: Guess the Country
            </h2>
            <GuessInput
              placeholder="Enter a country name..."
              onGuess={handleCountryGuess}
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
