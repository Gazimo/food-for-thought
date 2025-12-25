"use client";

import { ProteinInput } from "@/components/inputs/ProteinInput";
import { IngredientProteinStrip } from "@/components/IngredientProteinStrip";
import { ProteinGuessFeedback } from "@/components/ProteinGuessFeedback";
import { ProteinSkeleton } from "@/components/GameSkeleton";
import { useGameStore } from "@/store";
import { useTodaysDish } from "@/hooks/useDishes";

/**
 * ProteinPhaseV2 - Refactored version using specialized ProteinInput component
 *
 * Changes from original ProteinPhase:
 * - Uses ProteinInput instead of GuessInput
 * - Cleaner separation of concerns
 * - Same functionality, better architecture
 */
export function ProteinPhaseV2() {
  const {
    guessProtein,
    proteinGuesses,
    proteinGuessResults,
    currentDish,
    isProteinPhaseComplete,
    revealCorrectProtein,
    archiveDate,
    loading,
  } = useGameStore();
  const { isLoading } = useTodaysDish(archiveDate);

  if (isLoading) {
    return <ProteinSkeleton />;
  }

  const isComplete = isProteinPhaseComplete();
  const isSubmitting = loading.proteinGuess;

  if (!currentDish?.proteinPerServing) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600">
          Protein data not available for this dish.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Protein Strip */}
      <div className="w-full">
        <IngredientProteinStrip
          imageUrl={currentDish.imageUrl}
          dishName={currentDish.name}
          keyIngredients={currentDish.ingredients}
        />
      </div>

      {/* Input Section */}
      {!isComplete && (
        <div className="flex flex-col gap-4">
          <ProteinInput
            previousGuesses={proteinGuesses}
            actualProtein={currentDish.proteinPerServing}
            onGuess={guessProtein}
            onGiveUp={revealCorrectProtein}
            isSubmitting={isSubmitting}
            isComplete={isComplete}
            placeholder="Enter grams of protein..."
          />
        </div>
      )}

      {/* Feedback */}
      <ProteinGuessFeedback
        guessResults={proteinGuessResults}
        actualProtein={currentDish.proteinPerServing}
      />
    </div>
  );
}
