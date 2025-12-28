"use client";

import { TileGrid } from "@/components/dish-image/TileGrid";
import { DishInput } from "@/components/inputs/DishInput";
import { HintsFeedback } from "@/components/game/HintsFeedback";
import { useBlurredTiles, useDishTiles } from "@/hooks/useDishTiles";
import { PhaseConfig } from "@/config/games/types";

interface DishPhaseProps {
  phaseConfig: PhaseConfig;
  dish: any;
  guesses: any[];
  revealedTiles: boolean[];
  hintsRevealed: number;
  isComplete: boolean;
  onGuess: (guess: string) => void;
  onGiveUp: () => void;
}

export function DishPhase({
  phaseConfig,
  dish,
  guesses,
  revealedTiles,
  hintsRevealed,
  isComplete,
  onGuess,
  onGiveUp,
}: DishPhaseProps) {
  const dishId = dish?.id?.toString();
  const { data: blurredTiles, isLoading: isBlurredLoading } =
    useBlurredTiles(dishId);
  const { data: fullTiles, isLoading: isTilesLoading } = useDishTiles(dishId);

  if (isBlurredLoading || isTilesLoading || !blurredTiles || !fullTiles) {
    return <div>Loading...</div>;
  }

  const guessStrings = guesses.map((g) =>
    typeof g === "string" ? g : g.guess
  );

  return (
    <>
      <TileGrid
        revealedTiles={revealedTiles}
        blurredTiles={blurredTiles}
        fullTiles={fullTiles}
      />

      {!isComplete && (
        <div className="flex flex-col gap-2">
          {guesses.length === 0 && (
            <div className="text-center text-sm text-gray-600 mb-2">
              Make a guess to reveal the first tile
            </div>
          )}
          <DishInput
            suggestions={[]}
            previousGuesses={guessStrings}
            acceptableGuesses={dish.acceptableGuesses || []}
            onGuess={onGuess}
            onGiveUp={onGiveUp}
            isSubmitting={false}
            isComplete={isComplete}
            placeholder="e.g. Spaghetti, Sushi, Tacos..."
          />
        </div>
      )}

      <HintsFeedback
        hints={dish.ingredients || []}
        hintsRevealed={hintsRevealed}
      />

      {isComplete && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Dish: {dish.name}</h3>
          <p className="text-gray-700">{dish.blurb}</p>
        </div>
      )}

      {guesses.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="text-sm text-gray-600">
            Guesses: {guesses.length} of {phaseConfig.maxGuesses || 6}
          </div>
          <div className="flex flex-wrap gap-1">
            {guessStrings.map((guess, index) => {
              const isCorrectGuess =
                dish.acceptableGuesses?.some(
                  (acceptable: string) =>
                    acceptable.toLowerCase() === guess.toLowerCase()
                ) || dish.name.toLowerCase() === guess.toLowerCase();

              return (
                <span
                  key={index}
                  className={`px-2 py-1 text-xs rounded border ${
                    isCorrectGuess
                      ? "bg-green-100 text-green-700 border-green-300"
                      : "bg-red-100 text-red-700 border-red-300"
                  }`}
                >
                  {guess}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
