import { RegionGuessResult } from "@/types/pasta";
import { memo } from "react";
import { ItalyRegionMap } from "./ItalyRegionMap";
import { RegionGuessFeedback } from "./RegionGuessFeedback";

interface ItalyMapVisualizerProps {
  selectedRegion?: string;
  correctRegion: string;
  guessedRegions: RegionGuessResult[];
  onRegionClick: (region: string) => void;
  isComplete: boolean;
}

export const ItalyMapVisualizer = memo(function ItalyMapVisualizer({
  selectedRegion,
  correctRegion,
  guessedRegions,
  onRegionClick,
  isComplete,
}: ItalyMapVisualizerProps) {
  // Italian regions list for dropdown fallback
  const regions = [
    "Abruzzo",
    "Basilicata",
    "Calabria",
    "Campania",
    "Emilia-Romagna",
    "Friuli Venezia Giulia",
    "Lazio",
    "Liguria",
    "Lombardia",
    "Marche",
    "Molise",
    "Piemonte",
    "Puglia",
    "Sardegna",
    "Sicilia",
    "Toscana",
    "Trentino-Alto Adige",
    "Umbria",
    "Valle d'Aosta",
    "Veneto",
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Interactive SVG Map */}
      <ItalyRegionMap
        guessResults={guessedRegions}
        onRegionClick={onRegionClick}
        correctRegion={correctRegion}
        isComplete={isComplete}
        selectedRegion={selectedRegion}
      />

      {/* Dropdown Fallback (for accessibility/mobile) */}
      {!isComplete && (
        <div className="bg-gray-50 rounded-lg p-4">
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Or select from dropdown:
          </label>
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedRegion || ""}
            onChange={(e) => {
              if (e.target.value) {
                onRegionClick(e.target.value);
              }
            }}
            disabled={isComplete}
          >
            <option value="">-- Select a region --</option>
            {regions.map((region) => {
              const isGuessed = guessedRegions.some(
                (g) => g.region.toLowerCase() === region.toLowerCase()
              );

              return (
                <option key={region} value={region} disabled={isGuessed}>
                  {region} {isGuessed ? "✗" : ""}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Feedback List with Arrow Emojis */}
      {guessedRegions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <RegionGuessFeedback guessResults={guessedRegions} />
        </div>
      )}

      {/* Instructions */}
      {!isComplete && guessedRegions.length === 0 && (
        <div className="text-center text-sm text-gray-600">
          <p>Click on the map or select the Italian region where this pasta originates</p>
          <p className="mt-1">You&apos;ll get distance and direction hints for wrong guesses</p>
        </div>
      )}

      {/* Completion message */}
      {isComplete && (
        <div className="text-center">
          <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold">
            ✓ Correct Region: {correctRegion}
          </div>
        </div>
      )}
    </div>
  );
});
