import { GameSliceCreator, StreakSlice } from "../types/slices";

export const createStreakSlice: GameSliceCreator<StreakSlice> = (set, get) => ({
  streak: 0,

  setStreak: (value) => set({ streak: value }),

  markGameTracked: () => {
    set((state) => ({
      gameResults: { ...state.gameResults, tracked: true },
    }));
  },
});
