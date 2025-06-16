import { GuessInput } from "@/components/GuessInput";
import { useGameStore } from "@/store/gameStore";
import { ProteinSkeleton } from "../../components/GameSkeleton";
import { ProteinGuessFeedback } from "../../components/ProteinGuessFeedback";
import { useTodaysDish } from "../../hooks/useDishes";

export function ProteinPhase() {
  const {
    guessProtein,
    proteinGuesses,
    proteinGuessResults,
    currentDish,
    isProteinPhaseComplete,
  } = useGameStore();
  const { isLoading } = useTodaysDish();

  if (isLoading) {
    return <ProteinSkeleton />;
  }

  const isComplete = isProteinPhaseComplete();

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
          />
          <div className="text-sm text-gray-600 text-center">
            Attempts: {proteinGuesses.length} of 4
          </div>
        </div>
      )}

      <ProteinGuessFeedback
        guessResults={proteinGuessResults}
        actualProtein={currentDish.proteinPerServing}
      />
    </div>
  );
}
