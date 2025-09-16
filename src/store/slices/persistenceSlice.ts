import { GameSliceCreator, PersistenceSlice } from "../types/slices";

const getTodaysDate = () => new Date().toISOString().split("T")[0];

export const createPersistenceSlice: GameSliceCreator<PersistenceSlice> = (
  set,
  get
) => ({
  saveCurrentGameState: () => {
    if (typeof window === "undefined") return;

    const state = get();

    if (state.isPlayingArchive) {
      return;
    }

    const today = getTodaysDate();
    const gameStateToSave = {
      gamePhase: state.gamePhase,
      activePhase: state.activePhase,
      revealedTiles: state.revealedTiles,
      revealedIngredients: state.revealedIngredients,
      dishGuesses: state.dishGuesses,
      countryGuesses: state.countryGuesses,
      proteinGuesses: state.proteinGuesses,
      countryGuessResults: state.countryGuessResults,
      proteinGuessResults: state.proteinGuessResults,
      gameResults: state.gameResults,
      savedDate: today,
    };

    localStorage.setItem(
      `fft-game-state-${today}`,
      JSON.stringify(gameStateToSave)
    );
    localStorage.setItem("fft-game-state", JSON.stringify(gameStateToSave));
  },

  restoreGameStateFromStorage: (forceRestore?: boolean) => {
    if (typeof window === "undefined") {
      return false;
    }

    const state = get();

    if (state.isPlayingArchive && !forceRestore) {
      return false;
    }

    try {
      const archiveUnlock = localStorage.getItem("fft-archives-unlock");
      if (archiveUnlock) {
        const parsed = JSON.parse(archiveUnlock);
        set({ archivesUnlock: parsed });
      }
    } catch {
      localStorage.removeItem("fft-archives-unlock");
    }

    try {
      const today = getTodaysDate();
      const todayKey = `fft-game-state-${today}`;

      let saved = localStorage.getItem(todayKey);

      if (!saved) {
        saved = localStorage.getItem("fft-game-state");
      }

      if (!saved) {
        return false;
      }

      const parsedState = JSON.parse(saved);

      const savedDate = parsedState.savedDate;

      if (!savedDate || savedDate !== today) {
        if (saved === localStorage.getItem("fft-game-state")) {
          localStorage.removeItem("fft-game-state");
        }
        return false;
      }

      if (parsedState.gameResults) {
        set({
          gamePhase: parsedState.gamePhase || "dish",
          activePhase: parsedState.activePhase || "dish",
          gameResults: parsedState.gameResults || {
            dishGuesses: [],
            dishGuessSuccess: false,
            countryGuesses: [],
            countryGuessSuccess: false,
            proteinGuesses: [],
            proteinGuessSuccess: false,
            tracked: false,
          },
          revealedTiles: parsedState.revealedTiles || [
            false,
            false,
            false,
            false,
            false,
            false,
          ],
          revealedIngredients: parsedState.revealedIngredients || 1,
          countryGuessResults: parsedState.countryGuessResults || [],
          proteinGuessResults: parsedState.proteinGuessResults || [],
          dishGuesses: parsedState.dishGuesses || [],
          countryGuesses: parsedState.countryGuesses || [],
          proteinGuesses: parsedState.proteinGuesses || [],
          modalVisible: false,
          hasRestoredState: true,
        });
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error restoring game state:", error);
      localStorage.removeItem("fft-game-state");
      return false;
    }
  },

  resetTodaysProgress: () => {
    if (typeof window !== "undefined") {
      const today = getTodaysDate();
      console.log("🗑️ EXPLICITLY RESETTING TODAY'S PROGRESS");
      localStorage.removeItem("fft-game-state");
      localStorage.removeItem(`fft-game-state-${today}`);
    }
  },
});
