import { GuessFeedback } from "@/components/GuessFeedback";
import { GuessInput } from "@/components/GuessInput";
import { useGameStore } from "@/store/gameStore";
import { Button } from "../../components/ui/button";

interface DishPhaseProps {
  isComplete?: boolean;
}

export function DishPhase({ isComplete }: DishPhaseProps) {
  const { guessDish, revealAllTiles, moveToCountryPhase } = useGameStore();
  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Guess the Dish</h2>
      {!isComplete && (
        <>
          <GuessInput placeholder="Enter a dish name..." onGuess={guessDish} />
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
