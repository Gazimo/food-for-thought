import { GuessInput } from "@/components/GuessInput";
import { TileGrid } from "@/components/dish-image/TileGrid";
import { Pasta } from "@/types/pasta";
import { normalizeForComparison } from "@/utils/stringNormalization";
import { memo } from "react";

interface SaucePhaseProps {
  pasta: Pasta;
  guesses: string[];
  revealedTiles: boolean[];
  revealedIngredients: number;
  onGuess: (guess: string) => void;
  isComplete: boolean;
  onContinue: () => void;
  onGiveUp: () => void;
}

export const SaucePhase = memo(function SaucePhase({
  pasta,
  guesses,
  revealedTiles,
  revealedIngredients,
  onGuess,
  isComplete,
  onContinue,
  onGiveUp,
}: SaucePhaseProps) {
  const pastaId = pasta.id?.toString();

  // Generate tile URLs for sauce phase
  const blurredTiles = Array.from({ length: 6 }, (_, i) =>
    `/api/pasta/tiles?pastaId=${pastaId}&tileIndex=${i}&phase=sauce&blur=true`
  );
  const fullTiles = Array.from({ length: 6 }, (_, i) =>
    `/api/pasta/tiles?pastaId=${pastaId}&tileIndex=${i}&phase=sauce`
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Tile Grid */}
      <TileGrid
        revealedTiles={revealedTiles}
        blurredTiles={blurredTiles}
        fullTiles={fullTiles}
      />

      {/* Sauce Ingredient Hints */}
      <div className="flex flex-col gap-1">
        <div className="text-sm text-gray-600">Sauce Ingredients</div>
        <div className="flex flex-wrap gap-1">
          {(isComplete
            ? pasta.sauceIngredients
            : pasta.sauceIngredients.slice(0, revealedIngredients)
          ).map((ingredient, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded border border-amber-300"
            >
              {ingredient}
            </span>
          ))}
          {!isComplete && revealedIngredients === 0 && (
            <div className="text-sm text-gray-500 italic">
              Make guesses to reveal ingredients in the sauce
            </div>
          )}
        </div>
      </div>

      {/* Guess Input */}
      {!isComplete && (
        <div className="flex flex-col gap-2">
          {guesses.length === 0 && (
            <div className="text-center text-sm text-gray-600 mb-2">
              Identify the classic sauce that pairs with this pasta
            </div>
          )}
          <GuessInput
            placeholder="e.g. Carbonara, Bolognese, Pesto..."
            onGuess={onGuess}
            onGiveUp={onGiveUp}
            previousGuesses={guesses}
            acceptableGuesses={pasta.sauceAcceptableGuesses}
            entityType="sauce type"
          />
        </div>
      )}

      {/* Guess History */}
      {guesses.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="text-sm text-gray-600">
            Guesses: {guesses.length} of 6
          </div>
          <div className="flex flex-wrap gap-1">
            {guesses.map((guess, index) => {
              const isCorrectGuess = pasta.sauceAcceptableGuesses?.some(
                (acceptable) =>
                  normalizeForComparison(acceptable) === normalizeForComparison(guess)
              );

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

      {/* Phase Complete - Show Recipe Instructions */}
      {isComplete && (
        <>
          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-lg">{pasta.name} {pasta.sauceName}</h3>

            {/* Instructions */}
            <div>
              <h4 className="font-semibold text-sm mb-1">Instructions:</h4>
              <ol className="list-decimal list-inside space-y-1">
                {pasta.sauceInstructions.map((instruction, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    {instruction}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Navigation button */}
          <button
            onClick={onContinue}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Guess the region
          </button>
        </>
      )}
    </div>
  );
});
