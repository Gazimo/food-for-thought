import { useGameStore } from "@/store/gameStore";
import Image from "next/image";

export const DishImage = () => {
  const { currentDish, gamePhase } = useGameStore();

  if (!currentDish) return null;

  // Only show the image in country phase or when game is complete
  if (gamePhase === "dish") {
    return (
      <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-500 text-lg">?</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden">
      {/* <Image
        src={currentDish.imageUrl}
        alt={currentDish.name}
        fill
        className="object-cover"
      /> */}
    </div>
  );
};
