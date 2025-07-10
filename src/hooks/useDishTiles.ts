import { useQuery } from "@tanstack/react-query";

export function useDishTiles(dishId: string | undefined) {
  return useQuery({
    queryKey: ["dish-tiles", dishId],
    queryFn: async () => {
      if (!dishId) return [];
      // Version-based cache busting - only changes when we need to invalidate cache
      const TILE_VERSION = "v2"; // Increment this when tiles change
      return Array.from({ length: 6 }).map(
        (_, index) =>
          `/images/tiles/${dishId}/regular-${index}.jpg?v=${TILE_VERSION}`
      );
    },
    enabled: !!dishId,
  });
}

export function useBlurredTiles(dishId: string | undefined) {
  return useQuery({
    queryKey: ["blurred-tiles", dishId],
    queryFn: async () => {
      if (!dishId) return [];
      // Version-based cache busting - only changes when we need to invalidate cache
      const TILE_VERSION = "v2"; // Increment this when tiles change
      return Array.from({ length: 6 }).map(
        (_, index) =>
          `/images/tiles/${dishId}/blurred-${index}.jpg?v=${TILE_VERSION}`
      );
    },
    enabled: !!dishId,
  });
}
