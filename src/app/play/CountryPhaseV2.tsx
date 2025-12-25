"use client";

import { CountryGuessFeedback } from "@/components/CountryGuessFeedback";
import { LocationInput } from "@/components/inputs/LocationInput";
import { MapGuessVisualizer } from "@/components/MapGuessVisualizer";
import { CountrySkeleton } from "@/components/GameSkeleton";
import { useGameStore } from "@/store";
import { getCountryCoordsMap, getCountryNames } from "@/utils/countries";
import { useTodaysDish } from "@/hooks/useDishes";
import posthog from "posthog-js";

/**
 * CountryPhaseV2 - Refactored version using specialized LocationInput component
 *
 * Changes from original CountryPhase:
 * - Uses LocationInput instead of GuessInput
 * - Cleaner separation of concerns
 * - Same functionality, better architecture
 */
export function CountryPhaseV2() {
  const {
    guessCountry,
    revealCorrectCountry,
    countryGuessResults,
    countryGuesses,
    isCountryPhaseComplete,
    archiveDate,
    loading,
  } = useGameStore();

  const isComplete = isCountryPhaseComplete();
  const countryNames = getCountryNames();
  const countryCoords = getCountryCoordsMap();
  const { isLoading } = useTodaysDish(archiveDate);

  if (isLoading) {
    return <CountrySkeleton />;
  }

  const isSubmitting = loading.countryGuess;

  const handleGuess = (guess: string) => {
    const match = countryGuessResults.find(
      (g) => g.country.toLowerCase() === guess.toLowerCase()
    );
    const isCorrect = match?.isCorrect ?? false;
    const distanceKm = match?.distance ?? null;

    posthog.capture("guess_country", {
      guess,
      correct: isCorrect,
      distanceKm,
    });

    guessCountry(guess);
  };

  const enrichedGuesses = countryGuessResults.map((g) => ({
    country: g.country,
    isCorrect: g.isCorrect,
    lat: countryCoords[g.country.toLowerCase()]?.lat || 0,
    lng: countryCoords[g.country.toLowerCase()]?.lng || 0,
    distance: g.distance,
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* Map Visualizer */}
      <MapGuessVisualizer guesses={enrichedGuesses} />

      {/* Input Section */}
      {!isComplete && (
        <div className="flex flex-col gap-4">
          <LocationInput
            suggestions={countryNames}
            previousGuesses={countryGuesses}
            onGuess={handleGuess}
            onGiveUp={revealCorrectCountry}
            isSubmitting={isSubmitting}
            isComplete={isComplete}
            placeholder="Enter a country name..."
            locationType="country"
          />
        </div>
      )}

      {/* Feedback */}
      <CountryGuessFeedback guessResults={countryGuessResults} />
    </div>
  );
}
