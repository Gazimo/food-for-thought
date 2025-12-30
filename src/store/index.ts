import { create } from "zustand";
import { createArchiveSlice } from "./slices/archiveSlice";
import { createLeaderboardSlice } from "./slices/leaderboardSlice";
import { createPersistenceSlice } from "./slices/persistenceSlice";
import { createStreakSlice } from "./slices/streakSlice";
import { createUiSlice } from "./slices/uiSlice";
import { createUnifiedGameSlice, UnifiedGameState } from "./slices/unifiedGameSlice";
import {
  PersistenceSlice,
  UiSlice,
  ArchiveSlice,
  StreakSlice,
  LeaderboardSlice
} from "./types/slices";

// Store state with only active slices (legacy GameSlice and GuessSlice removed)
export interface ExtendedGameStoreState
  extends PersistenceSlice,
    UiSlice,
    ArchiveSlice,
    StreakSlice,
    LeaderboardSlice,
    UnifiedGameState {}

export const useGameStore = create<ExtendedGameStoreState>()((...a) => ({
  ...createPersistenceSlice(...a),
  ...createUiSlice(...a),
  ...createArchiveSlice(...a),
  ...createStreakSlice(...a),
  ...createLeaderboardSlice(...a),
  ...createUnifiedGameSlice(...a),
}));
