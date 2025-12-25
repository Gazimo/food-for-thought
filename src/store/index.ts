import { create } from "zustand";
import { createArchiveSlice } from "./slices/archiveSlice";
import { createGameSlice } from "./slices/gameSlice";
import { createGuessSlice } from "./slices/guessSlice";
import { createLeaderboardSlice } from "./slices/leaderboardSlice";
import { createPersistenceSlice } from "./slices/persistenceSlice";
import { createStreakSlice } from "./slices/streakSlice";
import { createUiSlice } from "./slices/uiSlice";
import { createUnifiedGameSlice, UnifiedGameState } from "./slices/unifiedGameSlice";
import { GameStoreState } from "./types/slices";

// Extended store state that includes the unified game slice
export interface ExtendedGameStoreState extends GameStoreState, UnifiedGameState {}

export const useGameStore = create<ExtendedGameStoreState>()((...a) => ({
  ...createPersistenceSlice(...a),
  ...createGameSlice(...a),
  ...createUiSlice(...a),
  ...createGuessSlice(...a),
  ...createArchiveSlice(...a),
  ...createStreakSlice(...a),
  ...createLeaderboardSlice(...a),
  ...createUnifiedGameSlice(...a),
}));
