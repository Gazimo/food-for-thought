import { RegionGuessResult } from "@/types/pasta";
import { memo } from "react";
import { ItalyRegionMap } from "./ItalyRegionMap";

interface ItalyMapVisualizerProps {
  selectedRegion?: string;
  correctRegion: string;
  guessedRegions: RegionGuessResult[];
  onRegionClick?: (region: string) => void;
  isComplete: boolean;
}

export const ItalyMapVisualizer = memo(function ItalyMapVisualizer({
  selectedRegion,
  correctRegion,
  guessedRegions,
  onRegionClick,
  isComplete,
}: ItalyMapVisualizerProps) {
  return (
    <div className="w-full max-w-md mx-auto overflow-hidden rounded border shadow">
      <ItalyRegionMap
        guessResults={guessedRegions}
        onRegionClick={onRegionClick || (() => {})}
        correctRegion={correctRegion}
        isComplete={isComplete}
        selectedRegion={selectedRegion}
      />
    </div>
  );
});
