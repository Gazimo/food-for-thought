import { useQuery } from "@tanstack/react-query";

/**
 * Fetch pasta tiles for a specific phase (pasta or sauce)
 */
export function usePastaTiles(pastaId: string | undefined, phase: "pasta" | "sauce") {
  return useQuery({
    queryKey: ["pasta-tiles", pastaId, phase],
    queryFn: async () => {
      if (!pastaId) throw new Error("Pasta ID is required");

      // Generate tile URLs for all 6 tiles
      const tiles = Array.from({ length: 6 }, (_, index) =>
        `/api/pasta/tiles?pastaId=${pastaId}&tileIndex=${index}&phase=${phase}`
      );

      return tiles;
    },
    enabled: !!pastaId,
    staleTime: Infinity, // Tiles don't change
  });
}

/**
 * Fetch blurred pasta tiles for a specific phase
 */
export function useBlurredPastaTiles(
  pastaId: string | undefined,
  phase: "pasta" | "sauce"
) {
  return useQuery({
    queryKey: ["pasta-tiles-blurred", pastaId, phase],
    queryFn: async () => {
      if (!pastaId) throw new Error("Pasta ID is required");

      // Generate blurred tile URLs for all 6 tiles
      const tiles = Array.from({ length: 6 }, (_, index) =>
        `/api/pasta/tiles?pastaId=${pastaId}&tileIndex=${index}&phase=${phase}&blur=true`
      );

      return tiles;
    },
    enabled: !!pastaId,
    staleTime: Infinity, // Tiles don't change
  });
}

/**
 * Convenience hook for Phase 1 (pasta) tiles
 */
export function usePastaPhaseTiles(pastaId: string | undefined) {
  const fullTiles = usePastaTiles(pastaId, "pasta");
  const blurredTiles = useBlurredPastaTiles(pastaId, "pasta");

  return {
    fullTiles: fullTiles.data,
    blurredTiles: blurredTiles.data,
    isLoading: fullTiles.isLoading || blurredTiles.isLoading,
    isError: fullTiles.isError || blurredTiles.isError,
  };
}

/**
 * Convenience hook for Phase 2 (sauce) tiles
 */
export function useSaucePhaseTiles(pastaId: string | undefined) {
  const fullTiles = usePastaTiles(pastaId, "sauce");
  const blurredTiles = useBlurredPastaTiles(pastaId, "sauce");

  return {
    fullTiles: fullTiles.data,
    blurredTiles: blurredTiles.data,
    isLoading: fullTiles.isLoading || blurredTiles.isLoading,
    isError: fullTiles.isError || blurredTiles.isError,
  };
}
