import { GuessInput } from "@/components/GuessInput";
import { useGameStore } from "@/store/gameStore";
import { ProteinGuessFeedback } from "../../components/ProteinGuessFeedback";

interface ProteinPhaseProps {
  isComplete?: boolean;
}

export function ProteinPhase({ isComplete }: ProteinPhaseProps) {
  const { guessProtein, proteinGuesses, proteinGuessResults, currentDish } =
    useGameStore();

  if (!currentDish?.proteinPerServing) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600">
          Protein data not available for this dish.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-600">
        How many grams of protein per serving does this dish have?
      </p>
      {!isComplete && (
        <div className="flex flex-col gap-4">
          <GuessInput
            placeholder="Enter grams of protein..."
            onGuess={() => {}}
            onProteinGuess={guessProtein}
            previousProteinGuesses={proteinGuesses}
            actualProtein={currentDish.proteinPerServing}
            isComplete={isComplete}
          />
          <div className="text-sm text-gray-600 text-center">
            Attempts: {proteinGuesses.length} of 4
          </div>
        </div>
      )}

      <ProteinGuessFeedback
        guessResults={proteinGuessResults}
        actualProtein={currentDish.proteinPerServing}
        isComplete={isComplete}
      />
    </div>
  );
}
