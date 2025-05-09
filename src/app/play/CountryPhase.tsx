import { CountryGuessFeedback } from "@/components/CountryGuessFeedback";
import { GuessFeedback } from "@/components/GuessFeedback";
import { GuessInput } from "@/components/GuessInput";
import { useGameStore } from "@/store/gameStore";
import { getCountryNames } from "../../utils/countries";

export function CountryPhase() {
  const { guessCountry, countryGuessResults } = useGameStore();
  const countryNames = getCountryNames();
  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Guess the Country</h2>
      <GuessInput
        placeholder="Enter a country name..."
        onGuess={guessCountry}
        suggestions={countryNames}
      />
      <CountryGuessFeedback guessResults={countryGuessResults} />
      <GuessFeedback />
    </>
  );
}
