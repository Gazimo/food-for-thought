"use client";

import { MapGuessPhase } from "@/components/game/phases/MapGuessPhase";
import { LocationGuessResult } from "@/components/game/LocationGuessFeedback";
import { MapGuessVisualizer } from "@/components/MapGuessVisualizer";
import { CountrySkeleton } from "@/components/GameSkeleton";
import { useGameStore } from "@/store";
import { getCountryCoordsMap, getCountryNames } from "@/utils/countries";
import { getColorForDistance, getDirectionArrow } from "@/utils/colors";
import { useTodaysDish } from "@/hooks/useDishes";
import posthog from "posthog-js";

/**
 * CountryPhaseV2 - Refactored version using shared MapGuessPhase component
 *
 * Changes from original CountryPhase:
 * - Uses shared MapGuessPhase wrapper
 * - Uses shared LocationGuessFeedback
 * - Consistent layout with Italian region phase
 * - Same functionality, shared architecture
 */
export function CountryPhaseV2() {
  const currentDish = useGameStore((state) => state.currentDish);
  const guessCountry = useGameStore((state) => state.guessCountry);
  const revealCorrectCountry = useGameStore((state) => state.revealCorrectCountry);
  const countryGuessResults = useGameStore((state) => state.countryGuessResults);
  const countryGuesses = useGameStore((state) => state.countryGuesses);
  const isCountryPhaseComplete = useGameStore((state) => state.isCountryPhaseComplete);
  const archiveDate = useGameStore((state) => state.archiveDate);
  const loading = useGameStore((state) => state.loading);

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

  const locationResults: LocationGuessResult[] = countryGuessResults.map((r) => ({
    location: r.country,
    distance: r.distance,
    direction: r.direction,
    isCorrect: r.isCorrect,
  }));

  const getColorClass = (distance: number): string => {
    const hex = getColorForDistance(distance);
    const colorMap: Record<string, string> = {
      "#22c55e": "bg-green-500",
      "#4ade80": "bg-green-400",
      "#86efac": "bg-green-300",
      "#facc15": "bg-yellow-400",
      "#fb923c": "bg-orange-400",
      "#fca5a5": "bg-red-300",
      "#ef4444": "bg-red-500",
    };
    return colorMap[hex] || "bg-gray-400";
  };

  return (
    <MapGuessPhase
      mapVisualizer={<MapGuessVisualizer guesses={enrichedGuesses} />}
      suggestions={countryNames}
      previousGuesses={countryGuesses}
      onGuess={handleGuess}
      onGiveUp={revealCorrectCountry}
      placeholder="Enter a country name..."
      locationType="country"
      guessResults={locationResults}
      getColorForDistance={getColorClass}
      getDirectionArrow={getDirectionArrow}
      funFact={currentDish?.funFact}
      isComplete={isComplete}
      isSubmitting={isSubmitting}
    />
  );
}
