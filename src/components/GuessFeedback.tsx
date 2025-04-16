import { useGameStore } from "@/store/gameStore";

export const GuessFeedback = () => {
  const { currentDish, gamePhase, revealedIngredients } = useGameStore();

  if (!currentDish) return null;

  return (
    <div className="mt-4">
      {gamePhase === "dish" && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Revealed Ingredients:</h3>
          <ul className="space-y-1">
            {currentDish.ingredients
              .slice(0, revealedIngredients)
              .map((ingredient, index) => (
                <li
                  key={index}
                  className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full inline-block mr-2 mb-2"
                >
                  {ingredient}
                </li>
              ))}
          </ul>
        </div>
      )}

      {gamePhase === "country" && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Dish: {currentDish.name}</h3>
          <p className="text-gray-700">{currentDish.blurb}</p>
        </div>
      )}
    </div>
  );
};
