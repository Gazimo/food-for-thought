import { GuessFeedback } from "@/components/GuessFeedback";
import { GuessInput } from "@/components/GuessInput";
import { useGameStore } from "@/store/gameStore";

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
          <button
            className="mt-2 w-full py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            onClick={() => {
              revealAllTiles();
              moveToCountryPhase();
            }}
          >
            Give Up & Reveal
          </button>
        </>
      )}
      <GuessFeedback />
    </>
  );
}
