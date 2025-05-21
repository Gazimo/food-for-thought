import { CountryGuessFeedback } from "@/components/CountryGuessFeedback";
import { GuessFeedback } from "@/components/GuessFeedback";
import { GuessInput } from "@/components/GuessInput";
import { useGameStore } from "@/store/gameStore";
import { MapGuessVisualizer } from "../../components/MapGuessVisualizer";
import { Button } from "../../components/ui/button";
import { getCountryCoordsMap, getCountryNames } from "../../utils/countries";

interface CountryPhaseProps {
  isComplete?: boolean;
}

export function CountryPhase({ isComplete }: CountryPhaseProps) {
  const {
    guessCountry,
    countryGuessResults,
    revealAllTiles,
    completeGame,
    countryGuesses,
  } = useGameStore();
  const countryNames = getCountryNames();
  const countryCoords = getCountryCoordsMap();

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
            onGuess={guessCountry}
            suggestions={countryNames}
            previousGuesses={countryGuesses}
            isComplete={isComplete}
          />
          <Button
            className="mt-2 w-1/4"
            variant="danger"
            onClick={() => {
              revealAllTiles();
              completeGame();
            }}
          >
            Give Up 😩
          </Button>
        </div>
      )}
      <CountryGuessFeedback guessResults={countryGuessResults} />
      <GuessFeedback />
    </div>
  );
}
