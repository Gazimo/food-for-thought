"use client";

import { LocationInput } from "@/components/inputs/LocationInput";
import {
  LocationGuessFeedback,
  LocationGuessResult,
} from "@/components/game/LocationGuessFeedback";
import { ReactNode } from "react";

interface MapGuessPhaseProps {
  mapVisualizer: ReactNode;
  suggestions: string[];
  previousGuesses: string[];
  onGuess: (guess: string) => void;
  onGiveUp?: () => void;
  placeholder: string;
  locationType: "country" | "region";
  guessResults: LocationGuessResult[];
  getColorForDistance: (distance: number) => string;
  getDirectionArrow: (direction: string) => string;
  funFact?: string;
  isComplete: boolean;
  isSubmitting?: boolean;
}

export const MapGuessPhase: React.FC<MapGuessPhaseProps> = ({
  mapVisualizer,
  suggestions,
  previousGuesses,
  onGuess,
  onGiveUp,
  placeholder,
  locationType,
  guessResults,
  getColorForDistance,
  getDirectionArrow,
  funFact,
  isComplete,
  isSubmitting = false,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 pb-2">
        {mapVisualizer}
      </div>

      {!isComplete && (
        <LocationInput
          suggestions={suggestions}
          previousGuesses={previousGuesses}
          onGuess={onGuess}
          onGiveUp={onGiveUp}
          isSubmitting={isSubmitting}
          isComplete={isComplete}
          placeholder={placeholder}
          locationType={locationType}
        />
      )}

      <LocationGuessFeedback
        guessResults={guessResults}
        getColorForDistance={getColorForDistance}
        getDirectionArrow={getDirectionArrow}
        locationType={locationType}
        funFact={funFact}
      />
    </div>
  );
};
