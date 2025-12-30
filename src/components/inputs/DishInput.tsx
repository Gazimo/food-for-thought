"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TextInput } from "./TextInput";
import { GiveUpButton } from "./GiveUpButton";
import { getClosestGuess } from "@/utils/gameHelpers";
import { normalizeForComparison } from "@/utils/stringNormalization";

interface DishInputProps {
  /** Autocomplete suggestions for dish names */
  suggestions: string[];
  /** Previously guessed dishes */
  previousGuesses: string[];
  /** Acceptable guesses that would be correct */
  acceptableGuesses: string[];
  /** Callback when a guess is made */
  onGuess: (guess: string) => void;
  /** Callback when give up is clicked */
  onGiveUp?: () => void;
  /** Whether the input is currently submitting */
  isSubmitting?: boolean;
  /** Whether the phase is complete */
  isComplete?: boolean;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether to disable "Did you mean" suggestions */
  disableDidYouMean?: boolean;
  /** Whether to enforce closed-list validation (restricts to acceptableGuesses only) */
  enforceClosedList?: boolean;
}

/**
 * Specialized input component for dish guessing phase
 *
 * Handles:
 * - Autocomplete suggestions
 * - Duplicate guess detection
 * - "Did you mean" suggestions for close matches
 * - Give up functionality
 */
export const DishInput: React.FC<DishInputProps> = ({
  suggestions,
  previousGuesses,
  acceptableGuesses,
  onGuess,
  onGiveUp,
  isSubmitting = false,
  isComplete = false,
  placeholder = "Enter dish name...",
  disableDidYouMean = false,
  enforceClosedList = false,
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

  const handleSubmit = (guess: string) => {
    const trimmed = guess.trim().toLowerCase();
    const normalized = normalizeForComparison(guess);
    if (!trimmed) return;

    // Check if already guessed
    if (previousGuesses.includes(trimmed)) {
      triggerShake();
      toast.error("You already guessed that!");
      return;
    }

    // Check if guess is correct
    const isCorrect = acceptableGuesses.some(
      (acceptable) => normalizeForComparison(acceptable) === normalized
    );

    // If incorrect and "Did you mean" is enabled, suggest close matches
    if (!isCorrect && !disableDidYouMean && !enforceClosedList) {
      const suggestion = getClosestGuess(trimmed, acceptableGuesses);

      if (suggestion) {
        toast((t) => (
          <span>
            Did you mean{" "}
            <button
              className="text-blue-600 underline"
              onClick={() => {
                toast.dismiss(t.id);
                handleSubmit(suggestion);
              }}
            >
              {suggestion}
            </button>
            ?
          </span>
        ));
        return;
      }
    }

    onGuess(trimmed);
    setInput("");
  };

  const canSubmit = !!input.trim();

  return (
    <div className="w-full flex gap-2 items-center">
      {onGiveUp && <GiveUpButton onGiveUp={onGiveUp} />}

      <TextInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        placeholder={placeholder}
        suggestions={enforceClosedList ? acceptableGuesses : suggestions}
        previousGuesses={previousGuesses}
        shake={shake}
        disabled={isSubmitting}
        entityType="dish name"
      />

      <Button
        variant="primary"
        onClick={() => handleSubmit(input)}
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
    </div>
  );
};
