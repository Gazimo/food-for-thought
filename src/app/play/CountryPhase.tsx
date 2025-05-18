import { CountryGuessFeedback } from "@/components/CountryGuessFeedback";
import { GuessFeedback } from "@/components/GuessFeedback";
import { GuessInput } from "@/components/GuessInput";
import { useGameStore } from "@/store/gameStore";
import { Button } from "../../components/ui/button";
import { getCountryNames } from "../../utils/countries";

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
  return (
    <>
      {!isComplete && (
        <>
          <GuessInput
            placeholder="Enter a country name..."
            onGuess={guessCountry}
            suggestions={countryNames}
            previousGuesses={countryGuesses}
          />
          <Button
            className="mt-2"
            variant="fun"
            onClick={() => {
              revealAllTiles();
              completeGame();
            }}
          >
            Give Up 😩
          </Button>
        </>
      )}
      <CountryGuessFeedback guessResults={countryGuessResults} />
      <GuessFeedback />
    </>
  );
}
