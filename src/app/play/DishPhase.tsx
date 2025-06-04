import { GuessFeedback } from "@/components/GuessFeedback";
import { GuessInput } from "@/components/GuessInput";
import { useGameStore } from "@/store/gameStore";
import posthog from "posthog-js";
import { TileGrid } from "../../components/dish-image/TileGrid";

interface DishPhaseProps {
  isComplete?: boolean;
}

export function DishPhase({ isComplete }: DishPhaseProps) {
  const { guessDish, dishGuesses, currentDish, revealedTiles, gameResults } =
    useGameStore();

  const handleGuess = (guess: string) => {
    const isCorrect =
      currentDish?.acceptableGuesses?.includes(guess.toLowerCase()) ?? false;

    posthog.capture("guess_dish", {
      guess,
      correct: isCorrect,
    });

    guessDish(guess);
  };
  return (
    <>
      {currentDish?.imageUrl && (
        <TileGrid
          imageUrl={currentDish.imageUrl}
          revealedTiles={revealedTiles}
        />
      )}
      {!isComplete && (
        <div className="flex flex-col gap-2">
          {gameResults.dishGuesses.length === 0 && (
            <div className="text-center text-sm text-gray-600 mb-2">
              Make a guess to reveal the first tile
            </div>
          )}
          <div>
            <GuessInput
              placeholder="e.g. Spaghetti, Sushi, Tacos..."
              onGuess={handleGuess}
              previousGuesses={dishGuesses}
              isComplete={isComplete}
              acceptableGuesses={currentDish?.acceptableGuesses}
            />
            <div className="text-sm text-gray-600 mt-1">
              Guesses: {gameResults.dishGuesses.length} of 6
            </div>
            {gameResults.dishGuesses.length > 0 &&
              !gameResults.dishGuessSuccess && (
                <div className="flex flex-wrap gap-1">
                  {gameResults.dishGuesses.map((guess, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded border"
                    >
                      {guess}
                    </span>
                  ))}
                </div>
              )}
          </div>
        </div>
      )}
      <GuessFeedback />
    </>
  );
}
