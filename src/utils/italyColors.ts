/**
 * Italy-specific color utilities for the pasta region guessing game
 * Distance thresholds are scaled for Italy's geography (~1,400km max distance)
 */

/**
 * Get color for distance based on Italy-specific thresholds
 * Scaled approximately 4x smaller than world thresholds since Italy is much smaller
 */
export const getColorForItalyDistance = (distance: number): string => {
  if (distance === 0) return "#22c55e";      // green-500 - Correct!
  if (distance < 50) return "#4ade80";       // green-400 - Very close
  if (distance < 100) return "#86efac";      // green-300 - Close
  if (distance < 200) return "#facc15";      // yellow-400 - Moderate
  if (distance < 350) return "#fb923c";      // orange-400 - Far
  if (distance < 600) return "#fca5a5";      // red-300 - Very far
  return "#ef4444";                          // red-500 - Extremely far
};

/**
 * Get Tailwind CSS class for distance-based background color
 */
export const getColorClassForItalyDistance = (distance: number): string => {
  if (distance === 0) return "bg-green-500";
  if (distance < 50) return "bg-green-400";
  if (distance < 100) return "bg-green-300";
  if (distance < 200) return "bg-yellow-400";
  if (distance < 350) return "bg-orange-400";
  if (distance < 600) return "bg-red-300";
  return "bg-red-500";
};

/**
 * Map compass directions to arrow emojis
 */
export const getDirectionArrow = (direction: string): string => {
  const directionMap: Record<string, string> = {
    N: "⬆️",
    NE: "↗️",
    E: "➡️",
    SE: "↘️",
    S: "⬇️",
    SW: "↙️",
    W: "⬅️",
    NW: "↖️",
    "": "",
    "N/A": "",
  };
  return directionMap[direction] || direction;
};

/**
 * Map TopoJSON region names to ITALIAN_REGIONS names
 * Handles naming variations like hyphens and multilingual names
 */
export const normalizeTopoJsonRegionName = (topoJsonName: string): string => {
  const nameMap: Record<string, string> = {
    "Valle d'Aosta/Vallée d'Aoste": "Valle d'Aosta",
    "Trentino-Alto Adige/Südtirol": "Trentino-Alto Adige",
    "Friuli-Venezia Giulia": "Friuli Venezia Giulia",  // Remove hyphen
  };

  return nameMap[topoJsonName] || topoJsonName;
};

/**
 * Normalize region name for comparison (case-insensitive, remove spaces and hyphens)
 */
export const normalizeRegionForComparison = (regionName: string): string => {
  return regionName
    .toLowerCase()
    .replace(/[-\s]/g, "")
    .replace(/'/g, "");
};
