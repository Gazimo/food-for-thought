"use client";

import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/gameStore";
import Image from "next/image";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { generateShareText } from "../utils/shareText";

export const ResultModal: React.FC = () => {
  const {
    currentDish,
    gamePhase,
    gameResults,
    modalVisible,
    toggleModal,
    streak,
  } = useGameStore();
  const [showRecipe, setShowRecipe] = useState(false);

  if (gamePhase !== "complete" || !currentDish || !modalVisible) return null;

  const handleCopyResults = () => {
    const text = generateShareText({
      dishGuesses: gameResults.dishGuesses,
      countryGuesses: gameResults.countryGuesses,
      dish: currentDish.name,
      country: currentDish.country,
      streak,
    });

    navigator.clipboard.writeText(text);
    toast.success("Results copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-full sm:max-w-md w-full max-h-[90vh] overflow-y-auto gap-4 flex flex-col">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-bold">🎉 You did it!</h2>
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

        {currentDish.imageUrl && (
          <Image
            src={currentDish.imageUrl}
            alt={currentDish.name}
            className="rounded-lg w-full object-cover max-h-52"
            width={1000}
            height={1000}
          />
        )}

        <div>
          <p className="text-base sm:text-lg">The dish was:</p>
          <p className="font-bold text-lg sm:text-xl mt-2 break-words">
            {currentDish.name}
          </p>
          <p className="text-gray-600">from {currentDish.country}</p>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
            <span className="text-gray-700">Dish phase:</span>
            <span className="font-semibold">
              {gameResults.dishGuesses.length} guesses
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
              {gameResults.countryGuesses.length} guesses
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
          <div className="flex justify-between gap-2">
            <Button
              onClick={() => setShowRecipe(!showRecipe)}
              variant="neutral"
            >
              {showRecipe ? "Close" : "🍽️ View Recipe"}
            </Button>
            <Button onClick={handleCopyResults} variant="share">
              📋 Share Your Results
            </Button>
          </div>
          {currentDish.recipe && (
            <>
              {showRecipe && (
                <div className="relative p-4">
                  <span className="absolute text-[120px] opacity-10 right-5 select-none pointer-events-none">
                    👨🏻‍🍳
                  </span>

                  <div className="text-2xl font-bold">
                    🍽️ {currentDish.name}
                  </div>

                  <div className="space-y-4 max-h-[60vh] overflow-y-auto relative z-10">
                    <div>
                      <p className="text-gray-600 text-sm mb-2 italic">
                        Here&apos;s how you make {currentDish.name} — straight
                        from {currentDish.country}.
                      </p>
                      <p className="font-semibold">Ingredients:</p>
                      <ul className="list-disc list-inside text-gray-700">
                        {currentDish.recipe.ingredients.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold">Instructions:</p>
                      <ol className="list-decimal list-inside text-gray-700 space-y-1">
                        {currentDish.recipe.instructions.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <p className="text-center text-gray-500 text-sm mt-4">
            Come back tomorrow for a new challenge!
          </p>
        </div>
      </div>
    </div>
  );
};
