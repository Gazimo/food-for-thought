import { GuessFeedback } from "@/components/GuessFeedback";
import { GuessInput } from "@/components/GuessInput";
import { useGameStore } from "@/store/gameStore";
import posthog from "posthog-js";
import { TileGrid } from "../../components/dish-image/TileGrid";

export function DishPhase() {
  const {
    guessDish,
    dishGuesses,
    currentDish,
    revealedTiles,
    gameResults,
    isDishPhaseComplete,
  } = useGameStore();

  const isComplete = isDishPhaseComplete();

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
              acceptableGuesses={currentDish?.acceptableGuesses}
            />
          </div>
        </div>
      )}

      <GuessFeedback />

      {gameResults.dishGuesses.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="text-sm text-gray-600">
            Guesses: {gameResults.dishGuesses.length} of 6
          </div>
          <div className="flex flex-wrap gap-1 ">
            {gameResults.dishGuesses.map((guess, index) => {
              const isCorrectGuess =
                currentDish?.acceptableGuesses?.some(
                  (acceptable) =>
                    acceptable.toLowerCase() === guess.toLowerCase()
                ) || currentDish?.name.toLowerCase() === guess.toLowerCase();

              return (
                <span
                  key={index}
                  className={`px-2 py-1 text-xs rounded border ${
                    isCorrectGuess
                      ? "bg-green-100 text-green-700 border-green-300"
                      : "bg-red-100 text-red-700 border-red-300"
                  }`}
                >
                  {guess}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
