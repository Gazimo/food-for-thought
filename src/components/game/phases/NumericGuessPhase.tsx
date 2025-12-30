"use client";

import { NumberInput, GiveUpButton } from "@/components/inputs";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PhaseConfig } from "@/config/games/types";
import { ProteinGuessResult } from "@/types/game";
import { memo, ReactNode, useState } from "react";
import { toast } from "react-hot-toast";

interface NumericGuessPhaseProps {
  /** Phase configuration */
  phaseConfig: PhaseConfig;
  /** Item being guessed (Dish or Pasta) */
  item: any;
  /** Actual numeric value to guess */
  actualValue: number;
  /** Tolerance for correct guess (default: 0 = exact match) */
  tolerance?: number;
  /** Previous guesses made */
  guesses: number[];
  /** Guess results with higher/lower hints */
  guessResults: ProteinGuessResult[];
  /** Callback when a guess is made */
  onGuess: (guess: number) => void;
  /** Whether this phase is complete */
  isComplete: boolean;
  /** Callback to move to next phase */
  onContinue: () => void;
  /** Callback when give up is clicked */
  onGiveUp?: () => void;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Custom header content */
  customHeader?: ReactNode;
  /** Custom hints content */
  customHints?: ReactNode;
  /** Unit label (e.g., "g" for grams) */
  unit?: string;
  /** Minimum value for input */
  minValue?: number;
  /** Maximum value for input */
  maxValue?: number;
  /** Continue button label */
  continueButtonLabel?: string;
}

/**
 * Generic numeric guessing phase component
 *
 * Features:
 * - Numeric input with validation
 * - Optional tolerance for "correct" answers (default 0 = exact match)
 * - Higher/lower hint system
 * - Customizable via props for different games
 *
 * Used by: F4T protein phase, Pasta protein phase
 */
export const NumericGuessPhase = memo(function NumericGuessPhase({
  phaseConfig,
  item,
  actualValue,
  tolerance = 0,
  guesses,
  guessResults,
  onGuess,
  isComplete,
  onContinue,
  onGiveUp,
  isSubmitting = false,
  customHeader,
  customHints,
  unit = "g",
  minValue = 0,
  maxValue = 200,
  continueButtonLabel = "Continue to next phase",
}: NumericGuessPhaseProps) {
  const [input, setInput] = useState("");
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(false);
    requestAnimationFrame(() => {
      setShake(true);
      setTimeout(() => setShake(false), 300);
    });
  };

  const handleGuess = (guess: number) => {
    if (guesses.includes(guess)) {
      triggerShake();
      toast.error("You already guessed that number!");
      return;
    }

    const difference = Math.abs(guess - actualValue);
    const isCorrect = difference <= tolerance;

    onGuess(guess);
    setInput("");

    if (isCorrect) {
      toast.success(`Correct! ${actualValue}${unit}!`);
    } else {
      // Provide distance feedback
      if (difference <= 2) {
        toast("🔥 Very close!");
      } else if (difference <= 5) {
        toast("🌡️ Getting warm!");
      } else if (difference <= 10) {
        toast("❄️ Getting cold!");
      } else {
        toast("🧊 Freezing!");
      }
    }
  };

  const canSubmit =
    !isNaN(parseInt(input)) &&
    parseInt(input) >= minValue &&
    parseInt(input) <= maxValue;

  return (
    <div className="flex flex-col gap-4">
      {/* Custom Header */}
      {customHeader}

      {/* Input Section */}
      {!isComplete && (
        <div className="flex flex-col gap-2">
          {guesses.length === 0 && customHints && (
            <div className="text-center text-sm text-gray-600 mb-2">
              {customHints}
            </div>
          )}
          <div className="w-full flex gap-2 items-center">
            {onGiveUp && <GiveUpButton onGiveUp={onGiveUp} />}
            <NumberInput
              value={input}
              onChange={setInput}
              onSubmit={handleGuess}
              placeholder={`Enter ${unit} (${minValue}-${maxValue})`}
              shake={shake}
              min={minValue}
              max={maxValue}
              disabled={isSubmitting}
            />
            <Button
              variant="primary"
              onClick={() => handleGuess(parseInt(input))}
              disabled={!canSubmit || isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>Processing...</span>
                </div>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Guess Results */}
      {guessResults.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold mb-2">Your Guesses:</h4>
          <div className="space-y-2">
            {guessResults.map((result, index) => {
              const hint = result.isCorrect
                ? "correct"
                : result.guess < actualValue
                ? "higher"
                : "lower";

              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    hint === "correct"
                      ? "bg-green-50 border-green-300"
                      : "bg-yellow-50 border-yellow-300"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {result.guess}
                      {unit}
                    </span>
                    {hint === "correct" ? (
                      <span className="text-green-600 font-semibold">
                        ✓ Correct!
                        {tolerance > 0 && ` (within ±${tolerance}${unit})`}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {hint === "higher" ? "↑ Higher" : "↓ Lower"}
                        </span>
                        {result.difference !== undefined && (
                          <span className="text-xs text-gray-500">
                            (off by {Math.round(result.difference)}
                            {unit})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Guess Count */}
      {guesses.length > 0 && (
        <div className="text-center text-sm text-gray-600">
          Guesses: {guesses.length} of {phaseConfig.maxGuesses}
        </div>
      )}

      {/* Phase Complete - Show Answer */}
      {isComplete && (
        <>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <h4 className="font-semibold text-lg mb-1">Answer</h4>
            <p className="text-2xl font-bold text-green-700">
              {actualValue}
              {unit}
            </p>
          </div>

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
