import { create } from "zustand";
import { createArchiveSlice } from "./slices/archiveSlice";
import { createGameSlice } from "./slices/gameSlice";
import { createGuessSlice } from "./slices/guessSlice";
import { createLeaderboardSlice } from "./slices/leaderboardSlice";
import { createPersistenceSlice } from "./slices/persistenceSlice";
import { createStreakSlice } from "./slices/streakSlice";
import { createUiSlice } from "./slices/uiSlice";
import { GameStoreState } from "./types/slices";

export const useGameStore = create<GameStoreState>()((...a) => ({
  ...createPersistenceSlice(...a),
  ...createGameSlice(...a),
  ...createUiSlice(...a),
  ...createGuessSlice(...a),
  ...createArchiveSlice(...a),
  ...createStreakSlice(...a),
  ...createLeaderboardSlice(...a),
}));
