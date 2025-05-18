import { useGameStore } from "@/store/gameStore";
import React from "react";

export const ResultModal: React.FC = () => {
  const {
    currentDish,
    gamePhase,
    startNewGame,
    gameResults,
    modalVisible,
    toggleModal,
    streak,
  } = useGameStore();

  if (gamePhase !== "complete" || !currentDish || !modalVisible) return null;

  const totalGuesses =
    gameResults.dishGuesses.length + gameResults.countryGuesses.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-full sm:max-w-md w-full max-h-[90vh] overflow-y-auto gap-4 flex flex-col">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-bold">🎉 Game Complete!</h2>
            <button
              onClick={() => toggleModal(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl sm:text-xl px-2"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          {streak >= 1 && (
            <div className="text-orange-500 font-semibold text-sm mt-2 animate-streak-pop">
              🔥 You&apos;re on a {streak}-day streak!
            </div>
          )}
        </div>
        <div>
          <p className="text-base sm:text-lg">The dish was:</p>
          <p className="font-bold text-lg sm:text-xl mt-2 break-words">
            {currentDish.name}
          </p>
          <p className="text-gray-600">from {currentDish.country}</p>
          {currentDish.recipe && (
            <div className="mt-4">
              <p className="font-semibold">Recipe:</p>
              <div className="mb-2">
                <span className="font-semibold">Ingredients:</span>
                <ul className="list-disc list-inside text-gray-700 text-sm sm:text-base">
                  {currentDish.recipe.ingredients &&
                    currentDish.recipe.ingredients.map(
                      (item: string, idx: number) => <li key={idx}>{item}</li>
                    )}
                </ul>
              </div>
              <div>
                <span className="font-semibold">Instructions:</span>
                <ol className="list-decimal list-inside text-gray-700 text-sm sm:text-base">
                  {currentDish.recipe.instructions &&
                    currentDish.recipe.instructions.map(
                      (step: string, idx: number) => <li key={idx}>{step}</li>
                    )}
                </ol>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-gray-700 text-sm sm:text-base">
            Total guesses: <span className="font-semibold">{totalGuesses}</span>
          </p>

          <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
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

          <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
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
        </div>{" "}
        <button
          onClick={startNewGame}
          className="w-full py-2 sm:py-2.5 text-base sm:text-lg bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-2"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};
