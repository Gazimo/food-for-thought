import { ItalyMapVisualizer } from "@/components/pasta/ItalyMapVisualizer";
import { Pasta, RegionGuessResult } from "@/types/pasta";
import { memo } from "react";

interface ItalianRegionPhaseProps {
  pasta: Pasta;
  guesses: string[];
  guessResults: RegionGuessResult[];
  onGuess: (guess: string) => void;
  isComplete: boolean;
  onContinue: () => void;
}

export const ItalianRegionPhase = memo(function ItalianRegionPhase({
  pasta,
  guesses,
  guessResults,
  onGuess,
  isComplete,
  onContinue,
}: ItalianRegionPhaseProps) {
  const correctRegion = pasta.region;
  const correctCoords = pasta.regionCoordinates;

  if (!correctCoords) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600">
          Region data not available for this pasta.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Map Visualizer */}
      <ItalyMapVisualizer
        correctRegion={correctRegion}
        guessedRegions={guessResults}
        onRegionClick={onGuess}
        isComplete={isComplete}
      />

      {/* Guess Count */}
      {guesses.length > 0 && (
        <div className="text-center text-sm text-gray-600">
          Guesses: {guesses.length} of 6
        </div>
      )}

      {/* Phase Complete - Show Navigation */}
      {isComplete && (
        <button
          onClick={onContinue}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Guess the protein
        </button>
      )}
    </div>
  );
});
