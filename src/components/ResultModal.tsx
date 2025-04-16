import { useGameStore } from "@/store/gameStore";
import React from "react";

export const ResultModal: React.FC = () => {
  const { currentDish, gamePhase, dishGuesses, countryGuesses, startNewGame } =
    useGameStore();

  if (gamePhase !== "complete" || !currentDish) return null;

  const totalGuesses = dishGuesses + countryGuesses;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">🎉 Congratulations!</h2>

        <div className="mb-4">
          <p className="text-lg">You correctly identified:</p>
          <p className="font-bold text-xl mt-2">{currentDish.name}</p>
          <p className="text-gray-600">from {currentDish.country}</p>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600">
            You solved it in {totalGuesses}{" "}
            {totalGuesses === 1 ? "guess" : "guesses"}!
          </p>
          <p className="text-sm text-gray-600">
            ({dishGuesses} for the dish, {countryGuesses} for the country)
          </p>
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
