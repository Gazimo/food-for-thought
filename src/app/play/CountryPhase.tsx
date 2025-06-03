import { CountryGuessFeedback } from "@/components/CountryGuessFeedback";
import { GuessInput } from "@/components/GuessInput";
import { useGameStore } from "@/store/gameStore";
import { MapGuessVisualizer } from "../../components/MapGuessVisualizer";
import { getCountryCoordsMap, getCountryNames } from "../../utils/countries";
import posthog from "posthog-js";

interface CountryPhaseProps {
  isComplete?: boolean;
}

export function CountryPhase({ isComplete }: CountryPhaseProps) {
  const { guessCountry, countryGuessResults, countryGuesses } = useGameStore();
  const countryNames = getCountryNames();
  const countryCoords = getCountryCoordsMap();

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
      <MapGuessVisualizer guesses={enrichedGuesses} />
      {!isComplete && (
        <div className="flex flex-col gap-4">
          <GuessInput
            placeholder="Enter a country name..."
            onGuess={handleGuess}
            suggestions={countryNames}
            previousGuesses={countryGuesses}
            isComplete={isComplete}
          />
        </div>
      )}
      <CountryGuessFeedback guessResults={countryGuessResults} />
    </div>
  );
}
