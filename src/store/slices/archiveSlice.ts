import { ArchiveSlice, GameSliceCreator } from "../types/slices";

export const createArchiveSlice: GameSliceCreator<ArchiveSlice> = (
  set,
  get
) => ({
  archivesUnlock: undefined,
  isPlayingArchive: false,
  archiveDate: undefined,
  _exitingArchive: false,

  isArchivesUnlockedNow: () => {
    const { archivesUnlock } = get();
    if (!archivesUnlock) return false;

    const now = Date.now();
    const today = new Date().toISOString().split("T")[0];

    return (
      now < archivesUnlock.expiresAt &&
      archivesUnlock.grantedOnLocalISO === today
    );
  },

  unlockArchives: () => {
    const today = new Date().toISOString().split("T")[0];
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    set({
      archivesUnlock: {
        grantedOnLocalISO: today,
        expiresAt,
      },
    });

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "fft-archives-unlock",
        JSON.stringify({
          grantedOnLocalISO: today,
          expiresAt,
        })
      );
    }
  },

  startArchiveMode: (date) => {
    const state = get();
    if (state.gamePhase === "complete") {
      get().saveCurrentGameState();
    }

    set({
      isPlayingArchive: true,
      archiveDate: date,
      gamePhase: "dish",
      activePhase: "dish",
      revealedIngredients: 1,
      dishGuesses: [],
      countryGuesses: [],
      proteinGuesses: [],
      gameResults: {
        dishGuesses: [],
        dishGuessSuccess: false,
        countryGuesses: [],
        countryGuessSuccess: false,
        proteinGuesses: [],
        proteinGuessSuccess: false,
        tracked: false,
      },
      revealedTiles: [false, false, false, false, false, false],
      countryGuessResults: [],
      proteinGuessResults: [],
      modalVisible: true,
      currentDish: null,
    });
  },

  exitArchiveMode: () => {
    const state = get();
    if (!state.isPlayingArchive || state._exitingArchive) {
      return;
    }

    set({
      _exitingArchive: true,
      isPlayingArchive: false,
      archiveDate: undefined,
      currentDish: null,
    });

    setTimeout(() => {
      const restored = get().restoreGameStateFromStorage(true);

      if (!restored) {
        set({
          gamePhase: "dish",
          activePhase: "dish",
          revealedIngredients: 1,
          dishGuesses: [],
          countryGuesses: [],
          proteinGuesses: [],
          gameResults: {
            dishGuesses: [],
            dishGuessSuccess: false,
            countryGuesses: [],
            countryGuessSuccess: false,
            proteinGuesses: [],
            proteinGuessSuccess: false,
            tracked: false,
          },
          revealedTiles: [false, false, false, false, false, false],
          countryGuessResults: [],
          proteinGuessResults: [],
          modalVisible: false,
        });
      }

      set({ _exitingArchive: false });
    }, 50);
  },
});
