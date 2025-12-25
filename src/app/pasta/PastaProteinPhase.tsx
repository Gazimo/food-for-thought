import { Pasta, ProteinGuessResult } from "@/types/pasta";
import { memo, useState } from "react";

interface PastaProteinPhaseProps {
  pasta: Pasta;
  guesses: number[];
  guessResults: ProteinGuessResult[];
  onGuess: (guess: number) => void;
  isComplete: boolean;
  onContinue: () => void;
}

export const PastaProteinPhase = memo(function PastaProteinPhase({
  pasta,
  guesses,
  guessResults,
  onGuess,
  isComplete,
  onContinue,
}: PastaProteinPhaseProps) {
  const [inputValue, setInputValue] = useState("");

  const actualProtein = pasta.proteinPerServing || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const guess = parseInt(inputValue);
    if (!isNaN(guess) && guess > 0 && guess <= 50) {
      onGuess(guess);
      setInputValue("");
    }
  };

  if (!pasta.proteinPerServing) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600">
          Protein data not available for this pasta.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Info Box */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Protein Content Challenge</h3>
        <p className="text-sm text-gray-700">
          Estimate the protein content per 100g serving of <strong>{pasta.name}</strong>
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Consider the flour type and egg content to make your guess
        </p>
      </div>

      {/* Input Form */}
      {!isComplete && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="number"
            min="1"
            max="50"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter grams (1-50)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!inputValue}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Guess
          </button>
        </form>
      )}

      {/* Guess Results */}
      {guessResults.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold mb-2">Your Guesses:</h4>
          <div className="space-y-2">
            {guessResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.hint === "correct"
                    ? "bg-green-50 border-green-300"
                    : "bg-yellow-50 border-yellow-300"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{result.guess}g</span>
                  {result.hint === "correct" ? (
                    <span className="text-green-600 font-semibold">
                      ✓ Correct! (within ±5g)
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {result.hint === "higher" ? "↑ Higher" : "↓ Lower"}
                      </span>
                      {result.difference !== undefined && (
                        <span className="text-xs text-gray-500">
                          (off by {Math.round(result.difference)}g)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guess Count */}
      {guesses.length > 0 && (
        <div className="text-center text-sm text-gray-600">
          Guesses: {guesses.length} of 4
        </div>
      )}

      {/* Phase Complete - Show Answer */}
      {isComplete && (
        <>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <h4 className="font-semibold text-lg mb-1">Protein Content</h4>
            <p className="text-2xl font-bold text-green-700">
              {actualProtein}g per 100g serving
            </p>
          </div>

          {/* Navigation button */}
          <button
            onClick={onContinue}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            View results
          </button>
        </>
      )}

      {/* Instructions */}
      {!isComplete && guesses.length === 0 && (
        <div className="text-center text-sm text-gray-500">
          <p>Typical pasta ranges from 10-15g protein per 100g</p>
          <p className="mt-1">Egg pasta tends to have slightly more protein</p>
        </div>
      )}
    </div>
  );
});
