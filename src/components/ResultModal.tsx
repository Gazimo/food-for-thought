import { useGameStore } from "@/store/gameStore";
import React from "react";

export const ResultModal: React.FC = () => {
  const { currentDish, gamePhase, startNewGame, gameResults } = useGameStore();

  if (gamePhase !== "complete" || !currentDish) return null;

  const totalGuesses = gameResults.dishGuesses + gameResults.countryGuesses;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">🎉 Game Complete!</h2>

        <div className="mb-4">
          <p className="text-lg">The dish was:</p>
          <p className="font-bold text-xl mt-2">{currentDish.name}</p>
          <p className="text-gray-600">from {currentDish.country}</p>
          {currentDish.recipe && (
            <div className="mt-4">
              <p className="font-semibold">Recipe:</p>
              <div className="mb-2">
                <span className="font-semibold">Ingredients:</span>
                <ul className="list-disc list-inside text-gray-700">
                  {currentDish.recipe.ingredients &&
                    currentDish.recipe.ingredients.map(
                      (item: string, idx: number) => <li key={idx}>{item}</li>
                    )}
                </ul>
              </div>
              <div>
                <span className="font-semibold">Instructions:</span>
                <ol className="list-decimal list-inside text-gray-700">
                  {currentDish.recipe.instructions &&
                    currentDish.recipe.instructions.map(
                      (step: string, idx: number) => <li key={idx}>{step}</li>
                    )}
                </ol>
              </div>
            </div>
          )}
        </div>

        <div className="mb-6 space-y-2">
          <p className="text-gray-700">
            Total guesses: <span className="font-semibold">{totalGuesses}</span>
          </p>

          <div className="flex items-center gap-2">
            <span className="text-gray-700">Dish phase:</span>
            <span className="font-semibold">
              {gameResults.dishGuesses} guesses
            </span>
            <span
              className={
                gameResults.dishGuessSuccess ? "text-green-600" : "text-red-600"
              }
            >
              {gameResults.dishGuessSuccess ? "✓" : "✗"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700">Country phase:</span>
            <span className="font-semibold">
              {gameResults.countryGuesses} guesses
            </span>
            <span
              className={
                gameResults.countryGuessSuccess
                  ? "text-green-600"
                  : "text-red-600"
              }
            >
              {gameResults.countryGuessSuccess ? "✓" : "✗"}
            </span>
          </div>
        </div>

        <button
          onClick={startNewGame}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};
