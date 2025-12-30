"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { NumberInput } from "./NumberInput";
import { GiveUpButton } from "./GiveUpButton";

interface ProteinInputProps {
  /** Previously guessed protein values */
  previousGuesses: number[];
  /** Actual protein value (for showing feedback) */
  actualProtein?: number;
  /** Callback when a guess is made, returns true if correct */
  onGuess: (guess: number) => boolean;
  /** Callback when give up is clicked */
  onGiveUp?: () => void;
  /** Whether the input is currently submitting */
  isSubmitting?: boolean;
  /** Whether the phase is complete */
  isComplete?: boolean;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
}

/**
 * Specialized input component for protein guessing phase
 *
 * Handles:
 * - Numeric input with validation
 * - Duplicate guess detection
 * - Distance-based feedback (hot/cold hints)
 * - Give up functionality (shown after 3 guesses)
 */
export const ProteinInput: React.FC<ProteinInputProps> = ({
  previousGuesses,
  actualProtein,
  onGuess,
  onGiveUp,
  isSubmitting = false,
  isComplete = false,
  placeholder = "Enter protein amount (grams)...",
  min = 0,
  max = 200,
}) => {
  const [input, setInput] = useState("");
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(false);
    requestAnimationFrame(() => {
      setShake(true);
      setTimeout(() => setShake(false), 300);
    });
  };

  const handleSubmit = (guess: number) => {
    // Check if already guessed
    if (previousGuesses.includes(guess)) {
      triggerShake();
      toast.error("You already guessed that number!");
      return;
    }

    const isCorrect = onGuess(guess);

    if (isCorrect) {
      toast.success(`Correct! ${actualProtein}g protein per serving!`);
    } else if (actualProtein !== undefined) {
      // Provide distance-based feedback
      const difference = Math.abs(guess - actualProtein);
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

    setInput("");
  };

  const canSubmit = !isNaN(parseInt(input)) && parseInt(input) >= 0;
  const shouldShowGiveUp = previousGuesses.length >= 3;

  return (
    <div className="w-full flex gap-2 items-center">
      {onGiveUp && <GiveUpButton onGiveUp={onGiveUp} />}

      <NumberInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        placeholder={placeholder}
        shake={shake}
        min={min}
        max={max}
        disabled={isSubmitting}
      />

      <Button
        variant="primary"
        onClick={() => handleSubmit(parseInt(input))}
        disabled={!canSubmit || isComplete || isSubmitting}
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

      {shouldShowGiveUp && !isComplete && onGiveUp && (
        <div className="absolute top-full left-0 right-0 text-center mt-2">
          <Button
            onClick={onGiveUp}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Give up and see results
          </Button>
        </div>
      )}
    </div>
  );
};
