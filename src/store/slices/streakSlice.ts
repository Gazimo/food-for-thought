import { GameSliceCreator, StreakSlice } from "../types/slices";

export const createStreakSlice: GameSliceCreator<StreakSlice> = (set) => ({
  streak: 0,

  setStreak: (value) => set({ streak: value }),
});
