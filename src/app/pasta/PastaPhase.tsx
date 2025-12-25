import { GuessInput } from "@/components/GuessInput";
import { TileGrid } from "@/components/dish-image/TileGrid";
import { PASTA_TYPES } from "@/data/pastaTypes";
import { Pasta } from "@/types/pasta";
import { memo } from "react";

interface PastaPhaseProps {
  pasta: Pasta;
  guesses: string[];
  revealedTiles: boolean[];
  revealedAbout: number;
  onGuess: (guess: string) => void;
  isComplete: boolean;
  onContinue: () => void;
  onGiveUp: () => void;
}

export const PastaPhase = memo(function PastaPhase({
  pasta,
  guesses,
  revealedTiles,
  revealedAbout,
  onGuess,
  isComplete,
  onContinue,
  onGiveUp,
}: PastaPhaseProps) {
  const pastaId = pasta.id?.toString();

  // Generate tile URLs for pasta phase
  const blurredTiles = Array.from({ length: 6 }, (_, i) =>
    `/api/pasta/tiles?pastaId=${pastaId}&tileIndex=${i}&phase=pasta&blur=true`
  );
  const fullTiles = Array.from({ length: 6 }, (_, i) =>
    `/api/pasta/tiles?pastaId=${pastaId}&tileIndex=${i}&phase=pasta`
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Tile Grid */}
      <TileGrid
        revealedTiles={revealedTiles}
        blurredTiles={blurredTiles}
        fullTiles={fullTiles}
      />

      {/* Pasta About Hints */}
      <div className="flex flex-col gap-1">
        <div className="text-sm text-gray-600">About This Pasta</div>
        <div className="flex flex-wrap gap-1">
          {(isComplete
            ? pasta.pastaAbout
            : pasta.pastaAbout.slice(0, revealedAbout)
          ).map((hint, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded border border-amber-300"
            >
              {hint}
            </span>
          ))}
          {!isComplete && revealedAbout === 0 && (
            <div className="text-sm text-gray-500 italic">
              Make guesses to reveal hints about the pasta
            </div>
          )}
        </div>
      </div>

      {/* Guess Input */}
      {!isComplete && (
        <div className="flex flex-col gap-2">
          {guesses.length === 0 && (
            <div className="text-center text-sm text-gray-600 mb-2">
              Identify the pasta type from its shape
            </div>
          )}
          <GuessInput
            placeholder="e.g. Spaghetti, Penne, Fusilli..."
            onGuess={onGuess}
            onGiveUp={onGiveUp}
            previousGuesses={guesses}
            acceptableGuesses={pasta.acceptableGuesses}
            entityType="pasta type"
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
              const isCorrectGuess = pasta.acceptableGuesses?.some(
                (acceptable) =>
                  acceptable.toLowerCase() === guess.toLowerCase()
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

      {/* Phase Complete - Show Origin Story */}
      {isComplete && (
        <>
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-lg">
              {pasta.name}
            </h3>
            {pasta.originStory && (
              <div className="text-sm text-gray-700 leading-relaxed">
                {pasta.originStory}
              </div>
            )}
          </div>

          {/* Navigation button */}
          <button
            onClick={onContinue}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Guess the sauce
          </button>
        </>
      )}
    </div>
  );
});
