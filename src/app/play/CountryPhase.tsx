import { CountryGuessFeedback } from "@/components/CountryGuessFeedback";
import { GuessInput } from "@/components/GuessInput";
import { useGameStore } from "@/store/gameStore";
import { getCountryNames } from "../../utils/countries";

interface CountryPhaseProps {
  isComplete?: boolean;
}

export function CountryPhase({ isComplete }: CountryPhaseProps) {
  const { guessCountry, countryGuessResults, revealAllTiles, completeGame } =
    useGameStore();
  const countryNames = getCountryNames();
  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Guess the Country</h2>
      {!isComplete && (
        <>
          <GuessInput
            placeholder="Enter a country name..."
            onGuess={guessCountry}
            suggestions={countryNames}
          />
          <button
            className="mt-2 w-full py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            onClick={() => {
              revealAllTiles();
              completeGame();
            }}
          >
            Give Up & Reveal
          </button>
        </>
      )}
      <CountryGuessFeedback guessResults={countryGuessResults} />
    </>
  );
}
