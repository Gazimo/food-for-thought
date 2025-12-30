"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TextInput } from "./TextInput";
import { GiveUpButton } from "./GiveUpButton";
import { normalizeForComparison } from "@/utils/stringNormalization";

interface LocationInputProps {
  /** Autocomplete suggestions for locations (countries/regions) */
  suggestions: string[];
  /** Previously guessed locations */
  previousGuesses: string[];
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
  /** Type of location being guessed (country, region, etc.) */
  locationType?: "country" | "region";
}

/**
 * Specialized input component for location guessing (country/region)
 *
 * Handles:
 * - Autocomplete from valid locations list
 * - Validation that guess is in suggestions
 * - Duplicate guess detection
 * - Give up functionality
 */
export const LocationInput: React.FC<LocationInputProps> = ({
  suggestions,
  previousGuesses,
  onGuess,
  onGiveUp,
  isSubmitting = false,
  isComplete = false,
  placeholder = "Enter location...",
  locationType = "country",
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

    // Validate against suggestions list
    const isValidLocation = suggestions.some(
      (suggestion) => normalizeForComparison(suggestion) === normalized
    );

    if (!isValidLocation) {
      toast.error(
        `"${guess.trim()}" is not a valid ${locationType} name. Please select from the suggestions.`
      );
      return;
    }

    // Check if already guessed
    if (previousGuesses.some((g) => normalizeForComparison(g) === normalized)) {
      triggerShake();
      toast.error("You already guessed that!");
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
        entityType={`${locationType} name`}
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
