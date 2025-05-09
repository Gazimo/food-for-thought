import { GuessFeedback } from "@/components/GuessFeedback";
import { GuessInput } from "@/components/GuessInput";
import { useGameStore } from "@/store/gameStore";

export function DishPhase() {
  const { guessDish } = useGameStore();
  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Guess the Dish</h2>
      <GuessInput placeholder="Enter a dish name..." onGuess={guessDish} />
      <GuessFeedback />
    </>
  );
}
