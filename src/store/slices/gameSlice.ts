import { updateStreak } from "../../utils/streak";
import { GameSlice, GameSliceCreator } from "../types/slices";

export const createGameSlice: GameSliceCreator<GameSlice> = (set, get) => ({
  currentDish: null,
  dishes: [],
  gamePhase: "dish",
  gameResults: {
    dishGuesses: [],
    dishGuessSuccess: false,
    countryGuesses: [],
    countryGuessSuccess: false,
    proteinGuesses: [],
    proteinGuessSuccess: false,
    tracked: false,
  },

  setCurrentDish: (dish) => {
    set({ currentDish: dish });
  },

  startNewGame: () => {
    const dishes = get().dishes;
    const dish =
      dishes.length > 0
        ? dishes[Math.floor(Math.random() * dishes.length)]
        : null;
    set({
      currentDish: dish,
      gamePhase: "dish",
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
    });
  },

  moveToCountryPhase: () => {
    set({ gamePhase: "country" });
    get().saveCurrentGameState();
  },

  moveToProteinPhase: () => {
    set({ gamePhase: "protein" });
    get().saveCurrentGameState();
  },

  completeGame: () => {
    const newStreak = updateStreak();
    const state = get();

    const hasAnySuccess =
      state.gameResults.dishGuessSuccess ||
      state.gameResults.countryGuessSuccess ||
      state.gameResults.proteinGuessSuccess;

    const finalStatus = hasAnySuccess ? "won" : "lost";

    set({
      gamePhase: "complete",
      modalVisible: true,
      streak: newStreak,
      gameResults: {
        ...state.gameResults,
        status: finalStatus,
        tracked: false,
      },
    });

    setTimeout(() => {
      get().saveCurrentGameState();
    }, 0);
  },

  updateGameResults: (results) => {
    set((state) => ({
      gameResults: { ...state.gameResults, ...results },
    }));
  },

  isDishPhaseComplete: () => {
    const { gamePhase } = get();
    return gamePhase === "complete" || gamePhase !== "dish";
  },

  isCountryPhaseComplete: () => {
    const { gamePhase } = get();
    return gamePhase === "complete" || gamePhase === "protein";
  },

  isProteinPhaseComplete: () => {
    const { gamePhase } = get();
    return gamePhase === "complete";
  },

  isPhaseComplete: (phase) => {
    const { gamePhase } = get();
    if (gamePhase === "complete") return true;

    switch (phase) {
      case "dish":
        return gamePhase !== "dish";
      case "country":
        return gamePhase === "protein";
      case "protein":
        return false;
      default:
        return false;
    }
  },
});
