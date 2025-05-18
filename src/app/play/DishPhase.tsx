import { GuessFeedback } from "@/components/GuessFeedback";
import { GuessInput } from "@/components/GuessInput";
import { useGameStore } from "@/store/gameStore";
import { Button } from "../../components/ui/button";

interface DishPhaseProps {
  isComplete?: boolean;
}

export function DishPhase({ isComplete }: DishPhaseProps) {
  const { guessDish, revealAllTiles, moveToCountryPhase, dishGuesses } =
    useGameStore();
  return (
    <>
      {!isComplete && (
        <>
          <GuessInput
            placeholder="Enter a dish name..."
            onGuess={guessDish}
            previousGuesses={dishGuesses}
            isComplete={isComplete}
          />
          <Button
            className="mt-2"
            variant="fun"
            onClick={() => {
              revealAllTiles();
              moveToCountryPhase();
            }}
          >
            Give Up 😩
          </Button>
        </>
      )}
      <GuessFeedback alwaysShowIngredients />
    </>
  );
}
