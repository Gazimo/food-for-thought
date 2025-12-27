"use client";

import { ProteinPhase } from "@/components/game/phases/ProteinPhase";
import { ProteinSkeleton } from "@/components/GameSkeleton";
import { useGameStore } from "@/store";
import { useTodaysDish } from "@/hooks/useDishes";

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
    <ProteinPhase
      imageUrl={currentDish.imageUrl}
      imageName={currentDish.name}
      proteinSources={currentDish.ingredients}
      actualProtein={currentDish.proteinPerServing}
      guesses={proteinGuesses}
      guessResults={proteinGuessResults}
      isComplete={isComplete}
      isSubmitting={isSubmitting}
      onGuess={guessProtein}
      onGiveUp={revealCorrectProtein}
    />
  );
}
