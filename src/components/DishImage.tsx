import { useGameStore } from "@/store/gameStore";
import { DishImageReveal } from "./DishImageReveal"; // adjust path if needed
import Image from "next/image";

export const DishImage = () => {
  const { currentDish, gamePhase, dishGuesses } = useGameStore();

  if (!currentDish) return null;

  const showFullImage = gamePhase === "complete" || dishGuesses >= 5;

  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden">
      {showFullImage ? (
        <Image
          src={currentDish.imageUrl}
          alt={currentDish.name}
          fill
          className="object-cover"
        />
      ) : (
        <DishImageReveal
          imageUrl={currentDish.imageUrl}
          incorrectGuesses={dishGuesses}
        />
      )}
    </div>
  );
};
