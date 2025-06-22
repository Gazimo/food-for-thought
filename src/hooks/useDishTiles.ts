import { useQuery } from "@tanstack/react-query";

export function useDishTiles(dishId: string | undefined) {
  return useQuery({
    queryKey: ["dish-tiles", dishId],
    queryFn: async () => {
      if (!dishId) return [];
      return Array.from({ length: 6 }).map(
        (_, index) =>
          `/api/dish-tiles?dishId=${encodeURIComponent(
            dishId
          )}&tileIndex=${index}&cb=${Date.now()}`
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
      return Array.from({ length: 6 }).map(
        (_, index) =>
          `/api/dish-tiles-blurred?dishId=${encodeURIComponent(
            dishId
          )}&tileIndex=${index}&cb=${Date.now()}`
      );
    },
    enabled: !!dishId,
  });
}
