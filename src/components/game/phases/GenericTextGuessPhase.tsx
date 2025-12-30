"use client";

import { TileGrid } from "@/components/dish-image/TileGrid";
import { memo, ReactNode } from "react";
import { PhaseConfig } from "@/config/games/types";

interface GenericTextGuessPhaseProps {
  /** Phase configuration */
  phaseConfig: PhaseConfig;
  /** Current item being guessed */
  item: any;
  /** Previous guesses made */
  guesses: string[];
  /** Which tiles are currently revealed */
  revealedTiles: boolean[];
  /** Number of hints revealed */
  hintsRevealed: number;
  /** Array of hints to display */
  hints: string[];
  /** Callback when a guess is made */
  onGuess: (guess: string) => void;
  /** Whether this phase is complete */
  isComplete: boolean;
  /** Callback to move to next phase */
  onContinue: () => void;
  /** Callback when give up is clicked */
  onGiveUp?: () => void;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Autocomplete suggestions */
  suggestions?: string[];
  /** Acceptable correct answers */
  acceptableGuesses: string[];
  /** Function to generate tile URLs */
  generateTileUrl: (tileIndex: number, isBlurred: boolean) => string;
  /** Optional custom input component */
  inputComponent?: ReactNode;
  /** Label for hints section */
  hintsLabel?: string;
  /** Content to show when phase is complete */
  completionContent?: ReactNode;
  /** Label for continue button */
  continueButtonLabel?: string;
}

/**
 * Generic phase component for text-based guessing games
 *
 * This component provides a reusable structure for phases where users:
 * 1. See a tiled image that reveals gradually
 * 2. Get hints as they make wrong guesses
 * 3. Make text-based guesses with autocomplete
 * 4. See their guess history
 * 5. Continue to next phase when complete
 *
 * Used by: Dish, Pasta, Sauce phases
 */
export const GenericTextGuessPhase = memo(function GenericTextGuessPhase({
  phaseConfig,
  item,
  guesses,
  revealedTiles,
  hintsRevealed,
  hints,
  onGuess,
  isComplete,
  onContinue,
  onGiveUp,
  isSubmitting = false,
  suggestions = [],
  acceptableGuesses,
  generateTileUrl,
  inputComponent,
  hintsLabel = "Hints",
  completionContent,
  continueButtonLabel = "Continue to next phase",
}: GenericTextGuessPhaseProps) {
  // Generate tile URLs
  const blurredTiles = Array.from({ length: phaseConfig.tileCount || 6 }, (_, i) =>
    generateTileUrl(i, true)
  );
  const fullTiles = Array.from({ length: phaseConfig.tileCount || 6 }, (_, i) =>
    generateTileUrl(i, false)
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Tile Grid */}
      <TileGrid
        revealedTiles={revealedTiles}
        blurredTiles={blurredTiles}
        fullTiles={fullTiles}
      />

      {/* Hints Section (if configured) */}
      {phaseConfig.revealsHints && hints.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="text-sm text-gray-600">{hintsLabel}</div>
          <div className="flex flex-wrap gap-1">
            {(isComplete ? hints : hints.slice(0, hintsRevealed)).map(
              (hint, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded border border-amber-300"
                >
                  {hint}
                </span>
              )
            )}
            {!isComplete && hintsRevealed === 0 && (
              <div className="text-sm text-gray-500 italic">
                Make guesses to reveal hints
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Component */}
      {!isComplete && inputComponent}

      {/* Guess History */}
      {guesses.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="text-sm text-gray-600">
            Guesses: {guesses.length} of {phaseConfig.maxGuesses}
          </div>
          <div className="flex flex-wrap gap-1">
            {guesses.map((guess, index) => {
              const isCorrectGuess = acceptableGuesses?.some(
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

      {/* Completion Content */}
      {isComplete && (
        <>
          {completionContent}

          {/* Navigation button */}
          <button
            onClick={onContinue}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {continueButtonLabel}
          </button>
        </>
      )}
    </div>
  );
});
