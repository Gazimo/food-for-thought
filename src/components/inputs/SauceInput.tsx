"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TextInput } from "./TextInput";
import { GiveUpButton } from "./GiveUpButton";
import { normalizeForComparison } from "@/utils/stringNormalization";

interface SauceInputProps {
  /** Autocomplete suggestions for sauce types */
  suggestions: string[];
  /** Previously guessed sauce types */
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
}

/**
 * Specialized input component for sauce guessing phase
 *
 * Handles:
 * - Autocomplete suggestions for sauce types
 * - Duplicate guess detection
 * - Give up functionality
 */
export const SauceInput: React.FC<SauceInputProps> = ({
  suggestions,
  previousGuesses,
  acceptableGuesses,
  onGuess,
  onGiveUp,
  isSubmitting = false,
  isComplete = false,
  placeholder = "Enter sauce name...",
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
      toast.error("You already guessed that sauce!");
      return;
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
        suggestions={suggestions}
        previousGuesses={previousGuesses}
        shake={shake}
        disabled={isSubmitting}
        entityType="sauce name"
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
