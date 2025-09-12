"use client";

import { Dish } from "@/types/dishes";
import { GameResults } from "@/types/game";
import React from "react";

interface GameSummaryProps {
  gameResults: GameResults;
  currentDish: Dish;
}

export const GameSummary: React.FC<GameSummaryProps> = ({
  gameResults,
  currentDish,
}) => {
  return (
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
            gameResults.countryGuessSuccess ? "text-green-600" : "text-red-600"
          }
        >
          {gameResults.countryGuessSuccess ? "✓" : "✗"}
        </span>
      </div>

      {currentDish.proteinPerServing && (
        <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
          <span className="text-gray-700">Protein phase:</span>
          <span className="font-semibold">
            {gameResults.proteinGuesses.length} guesses
          </span>
          <span
            className={
              gameResults.proteinGuessSuccess
                ? "text-green-600"
                : "text-red-600"
            }
          >
            {gameResults.proteinGuessSuccess ? "✓" : "✗"}
          </span>
          {gameResults.proteinGuesses.length > 0 &&
            !gameResults.proteinGuessSuccess && (
              <span className="text-gray-600 text-xs">
                (closest:{" "}
                {Math.abs(
                  gameResults.proteinGuesses[
                    gameResults.proteinGuesses.length - 1
                  ] - currentDish.proteinPerServing
                )}
                g off)
              </span>
            )}
        </div>
      )}
    </div>
  );
};
