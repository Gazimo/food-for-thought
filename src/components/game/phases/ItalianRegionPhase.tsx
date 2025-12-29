"use client";

import { ItalyMapVisualizer } from "@/components/pasta/ItalyMapVisualizer";
import { MapGuessPhase } from "@/components/game/phases/MapGuessPhase";
import { LocationGuessResult } from "@/components/game/LocationGuessFeedback";
import { PhaseConfig } from "@/config/games/types";
import { Pasta, RegionGuessResult } from "@/types/pasta";
import { getColorClassForItalyDistance } from "@/utils/italyColors";
import { getDirectionArrow } from "@/utils/colors";
import { memo } from "react";
import italianRegionsData from "../../../../public/data/italian-regions.json";

type ItalianRegionsData = Record<string, { lat: number; lng: number; capital: string; cities: string[] }>;
const italianRegions = italianRegionsData as ItalianRegionsData;

interface ItalianRegionPhaseProps {
  /** Phase configuration */
  phaseConfig: PhaseConfig;
  /** Current pasta being guessed */
  pasta: Pasta;
  /** Previous guesses made */
  guesses: string[];
  /** Guess results with distance/direction feedback */
  guessResults: RegionGuessResult[];
  /** Callback when a guess is made */
  onGuess: (guess: string) => void;
  /** Whether this phase is complete */
  isComplete: boolean;
  /** Optional callback to give up and reveal answer */
  onGiveUp?: () => void;
}

/**
 * Italian Region guessing phase component
 *
 * Features:
 * - Interactive SVG Italy map with clickable regions
 * - Text input with autocomplete for region names
 * - Distance/direction feedback using Haversine formula
 * - Compass directions (N, NE, E, SE, S, SW, W, NW)
 * - Shared layout with F4T country phase
 *
 * Props-based with no store coupling for use in unified architecture.
 */
export const ItalianRegionPhase = memo(function ItalianRegionPhase({
  phaseConfig,
  pasta,
  guesses,
  guessResults,
  onGuess,
  isComplete,
  onGiveUp,
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

  const locationResults: LocationGuessResult[] = guessResults.map((r) => ({
    location: r.region,
    distance: r.distance,
    direction: r.direction,
    isCorrect: r.isCorrect,
  }));

  const regions = Object.keys(italianRegions);

  return (
    <MapGuessPhase
      mapVisualizer={
        <ItalyMapVisualizer
          correctRegion={correctRegion}
          guessedRegions={guessResults}
          onRegionClick={onGuess}
          isComplete={isComplete}
        />
      }
      suggestions={regions}
      previousGuesses={guesses}
      onGuess={onGuess}
      onGiveUp={onGiveUp}
      placeholder="Enter an Italian region or click on the map..."
      locationType="region"
      guessResults={locationResults}
      getColorForDistance={getColorClassForItalyDistance}
      getDirectionArrow={getDirectionArrow}
      funFact={pasta.funFact || pasta.originStory}
      isComplete={isComplete}
      isSubmitting={false}
    />
  );
});
