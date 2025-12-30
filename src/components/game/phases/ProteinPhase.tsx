"use client";

import { ProteinInput } from "@/components/inputs/ProteinInput";
import { IngredientProteinStrip } from "@/components/IngredientProteinStrip";
import { ProteinGuessFeedback } from "@/components/ProteinGuessFeedback";
import { ProteinSkeleton } from "@/components/GameSkeleton";
import { PhaseConfig } from "@/config/games/types";
import { ProteinGuessResult } from "@/types/game";
import { ReactNode } from "react";

interface ProteinPhaseProps {
  imageUrl: string;
  imageName: string;
  proteinSources: string[];
  actualProtein: number;

  guesses: number[];
  guessResults: ProteinGuessResult[];
  isComplete: boolean;
  isSubmitting?: boolean;

  onGuess: (guess: number) => void;
  onGiveUp?: () => void;

  phaseConfig?: PhaseConfig;
  customHints?: ReactNode;
  maxIngredients?: number;
}

export function ProteinPhase({
  imageUrl,
  imageName,
  proteinSources,
  actualProtein,
  guesses,
  guessResults,
  isComplete,
  isSubmitting = false,
  onGuess,
  onGiveUp,
  customHints,
  maxIngredients = 4,
}: ProteinPhaseProps) {
  if (!actualProtein) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600">
          Protein data not available for this item.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {customHints && <div className="w-full">{customHints}</div>}

      <div className="w-full">
        <IngredientProteinStrip
          imageUrl={imageUrl}
          dishName={imageName}
          keyIngredients={proteinSources}
          maxItems={maxIngredients}
        />
      </div>

      {!isComplete && (
        <div className="flex flex-col gap-4">
          <ProteinInput
            previousGuesses={guesses}
            actualProtein={actualProtein}
            onGuess={(guess: number) => {
              onGuess(guess);
              return Math.abs(guess - actualProtein) === 0;
            }}
            onGiveUp={onGiveUp}
            isSubmitting={isSubmitting}
            isComplete={isComplete}
            placeholder="Enter grams of protein..."
          />
        </div>
      )}

      <ProteinGuessFeedback
        guessResults={guessResults}
        actualProtein={actualProtein}
        isComplete={isComplete}
      />
    </div>
  );
}
