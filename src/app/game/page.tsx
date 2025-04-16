"use client";

import {
  CountryGuessFeedback,
  CountryGuessResult,
} from "@/components/CountryGuessFeedback";
import { DishImage } from "@/components/DishImage";
import { GuessFeedback } from "@/components/GuessFeedback";
import { GuessInput } from "@/components/GuessInput";
import { ResultModal } from "@/components/ResultModal";
import { useGameStore } from "@/store/gameStore";
import { useEffect, useState } from "react";

// Helper function to calculate distance between coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper function to calculate direction
function calculateDirection(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  const direction = (bearing + 360) % 360;

  // Convert bearing to cardinal direction
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"];
  return directions[Math.round(direction / 45)];
}

export const GamePage = () => {
  const {
    currentDish,
    gamePhase,
    revealNextIngredient,
    moveToCountryPhase,
    completeGame,
    startNewGame,
  } = useGameStore();

  const [countryGuessResults, setCountryGuessResults] = useState<
    CountryGuessResult[]
  >([]);

  // Country coordinates database (simplified)
  const countryCoords: Record<string, { lat: number; lng: number }> = {
    Italy: { lat: 41.9028, lng: 12.4964 },
    France: { lat: 46.2276, lng: 2.2137 },
    Japan: { lat: 36.2048, lng: 138.2529 },
    Mexico: { lat: 23.6345, lng: -102.5528 },
    India: { lat: 20.5937, lng: 78.9629 },
    Israel: { lat: 31.7683, lng: 35.2137 },
    // Add more countries as needed
  };

  // Initialize game on first render
  useEffect(() => {
    if (!currentDish) {
      startNewGame();
    }
  }, [currentDish, startNewGame]);

  const handleDishGuessResult = (isCorrect: boolean) => {
    if (isCorrect) {
      moveToCountryPhase();
    } else {
      revealNextIngredient();
    }
  };

  const handleCountryGuessResult = (guess: string) => {
    if (!currentDish || !currentDish.coordinates) return;

    const isCorrect = guess.toLowerCase() === currentDish.country.toLowerCase();

    if (isCorrect) {
      setCountryGuessResults([
        ...countryGuessResults,
        { country: guess, isCorrect: true, distance: 0, direction: "N/A" },
      ]);
      completeGame();
    } else {
      // Get coordinates for the guessed country
      const guessedCoords = countryCoords[guess];

      if (guessedCoords) {
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
    }
  };

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🍽️ Food for Thought</h1>
      <p className="text-lg text-gray-700 mb-8">
        Guess the dish based on ingredients. Then guess where it&apos;s from!
      </p>

      <DishImage />

      <div className="mt-6">
        {gamePhase === "dish" && (
          <>
            <h2 className="text-xl font-semibold mb-4">
              Phase 1: Guess the Dish
            </h2>
            <GuessInput
              placeholder="Enter a dish name..."
              onCorrectGuess={() => handleDishGuessResult(true)}
              onIncorrectGuess={() => handleDishGuessResult(false)}
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
              onCorrectGuess={() => {}}
              onIncorrectGuess={(guess) => handleCountryGuessResult(guess)}
            />
            <CountryGuessFeedback guessResults={countryGuessResults} />
          </>
        )}

        <GuessFeedback />
      </div>

      <ResultModal />
    </main>
  );
};
