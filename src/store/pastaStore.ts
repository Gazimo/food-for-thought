import { create } from "zustand";
import { createPastaGameSlice, PastaGameState } from "./slices/pastaGameSlice";

/**
 * Dedicated Zustand store for Pasta Perfetto game
 * Separate from the main dish game store for better isolation and clarity
 */
export const usePastaStore = create<PastaGameState>()((...a) => ({
  ...createPastaGameSlice(...a),
}));
