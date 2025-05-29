import { GuessFeedback } from "@/components/GuessFeedback";
import { GuessInput } from "@/components/GuessInput";
import { useGameStore } from "@/store/gameStore";
import { TileGrid } from "../../components/dish-image/TileGrid";
import { Button } from "../../components/ui/button";

interface DishPhaseProps {
  isComplete?: boolean;
}

export function DishPhase({ isComplete }: DishPhaseProps) {
  const {
    guessDish,
    revealAllTiles,
    moveToCountryPhase,
    dishGuesses,
    currentDish,
    revealedTiles,
    gameResults,
  } = useGameStore();
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
          <div>
            <GuessInput
              placeholder="Enter a dish name..."
              onGuess={guessDish}
              previousGuesses={dishGuesses}
              isComplete={isComplete}
            />
            <div className="text-sm text-gray-600 mt-1">
              Guesses: {gameResults.dishGuesses.length} of 6
            </div>
          </div>
          <Button
            className="w-1/6"
            variant="danger"
            onClick={() => {
              revealAllTiles();
              moveToCountryPhase();
            }}
          >
            Give Up 😩
          </Button>
        </div>
      )}
      <GuessFeedback />
    </>
  );
}
