import { Dish } from "@/types/dishes";
import { getCountryCoordsMap } from "@/utils/countries";
import {
  calculateDirection,
  calculateDistance,
  capitalizeFirst,
  isDishGuessCorrect,
  normalizeString,
} from "@/utils/gameHelpers";
import { create } from "zustand";
import { GameResults, GameState, LoadingStates } from "../types/game";
import { emojiThemes, launchEmojiBurst } from "../utils/celebration";
import { getStreak, updateStreak } from "../utils/streak";

const countryCoords = getCountryCoordsMap();

function getSortedCountryCoords() {
  return Object.keys(countryCoords)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, key) => {
      acc[key] = countryCoords[key];
      return acc;
    }, {} as typeof countryCoords);
}

export const useGameStore = create<GameState>((set, get) => ({
  streak: 0, // Initialize streak to 0 for SSR
  setStreak: (value: number) => set({ streak: value }),
  hasRestoredState: false,

  saveCurrentGameState: () => {
    if (typeof window === "undefined") return;
    const state = get();
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
      savedDate: new Date().toISOString().split("T")[0],
    };
    localStorage.setItem("fft-game-state", JSON.stringify(gameStateToSave));
  },

  restoreGameStateFromStorage: () => {
    if (typeof window === "undefined") return false;
    try {
      const saved = localStorage.getItem("fft-game-state");
      if (!saved) return false;
      const parsedState = JSON.parse(saved);
      const today = new Date().toISOString().split("T")[0];
      const savedDate = parsedState.savedDate;
      if (!savedDate || savedDate !== today) {
        localStorage.removeItem("fft-game-state");
        return false;
      }
      const isComplete = parsedState.gamePhase === "complete";
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
          revealedTiles:
            parsedState.revealedTiles || Array(6).fill(false),
          revealedIngredients: parsedState.revealedIngredients || 1,
          countryGuessResults: parsedState.countryGuessResults || [],
          proteinGuessResults: parsedState.proteinGuessResults || [],
          dishGuesses: parsedState.dishGuesses || [],
          countryGuesses: parsedState.countryGuesses || [],
          proteinGuesses: parsedState.proteinGuesses || [],
          modalVisible: isComplete,
          hasRestoredState: true,
        });
        return true;
      }
      return false;
    } catch {
      localStorage.removeItem("fft-game-state");
      return false;
    }
  },

  currentDish: null,
  dishes: [],

  loading: {
    dishGuess: false,
    countryGuess: false,
    proteinGuess: false,
  },

  setLoading: (key: keyof LoadingStates, value: boolean) => {
    set((state) => ({
      loading: { ...state.loading, [key]: value },
    }));
  },

  setCurrentDish: (dish: Dish | null) => {
    set({ currentDish: dish });
  },

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
  revealedTiles: Array(6).fill(false),
  countryGuessResults: [],
  proteinGuessResults: [],
  modalVisible: true,

  toggleModal: (visible?: boolean) => {
    set((state) => ({ modalVisible: visible ?? !state.modalVisible }));
  },

  updateGameResults: (results: Partial<GameResults>) => {
    set((state) => ({
      gameResults: { ...state.gameResults, ...results },
    }));
  },

  revealRandomTile: () => {
    const { revealedTiles } = get();
    const unrevealed = revealedTiles
      .map((val, idx) => (!val ? idx : null))
      .filter((v) => v !== null) as number[];
    if (unrevealed.length === 0) return;
    const index = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    const newTiles = [...revealedTiles];
    newTiles[index] = true;
    set({ revealedTiles: newTiles });
    setTimeout(() => get().saveCurrentGameState(), 0);
  },

  revealAllTiles: () => {
    set({ revealedTiles: Array(6).fill(true) });
    get().saveCurrentGameState();
  },

  startNewGame: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("fft-game-state");
    }
    const dishes = get().dishes;
    const dish =
      dishes.length > 0
        ? dishes[Math.floor(Math.random() * dishes.length)]
        : null;
    set({
      currentDish: dish,
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
      revealedTiles: Array(6).fill(false),
      countryGuessResults: [],
      proteinGuessResults: [],
    });
  },

  makeDishGuess: (guess: string): boolean => {
    const { currentDish, gamePhase, loading } = get();
    if (!currentDish || loading.dishGuess) return false;
    try {
      get().setLoading("dishGuess", true);
      const normalizedGuess = normalizeString(guess);
      if (gamePhase === "dish") {
        const isCorrect = isDishGuessCorrect(normalizedGuess, currentDish);
        const newGuesses = [...get().dishGuesses, normalizedGuess];
        set((state) => ({
          dishGuesses: newGuesses,
          gameResults: {
            ...state.gameResults,
            dishGuesses: newGuesses,
            dishGuessSuccess: isCorrect,
          },
        }));
        get().saveCurrentGameState();
        return isCorrect;
      }
      return false;
    } finally {
      get().setLoading("dishGuess", false);
    }
  },

  makeCountryGuess: (guess: string): boolean => {
    const { currentDish, gamePhase, loading } = get();
    if (!currentDish || loading.countryGuess) return false;
    try {
      get().setLoading("countryGuess", true);
      const normalizedGuess = normalizeString(guess);
      if (gamePhase === "country") {
        const isCorrect = normalizeString(currentDish.country) === normalizedGuess;
        const [lat, lng] = countryCoords[currentDish.country]
          ? [countryCoords[currentDish.country].lat, countryCoords[currentDish.country].lng]
          : [0, 0];
        const [guessLat, guessLng] = countryCoords[capitalizeFirst(normalizedGuess)]
          ? [
              countryCoords[capitalizeFirst(normalizedGuess)].lat,
              countryCoords[capitalizeFirst(normalizedGuess)].lng,
            ]
          : [0, 0];
        const distance = calculateDistance(lat, lng, guessLat, guessLng);
        const direction = calculateDirection(lat, lng, guessLat, guessLng);
        set((state) => ({
          countryGuesses: newGuesses,
          countryGuessResults: [
            ...state.countryGuessResults,
            { country: guess, distance, direction, isCorrect },
          ],
          gameResults: {
            ...state.gameResults,
            countryGuesses: newGuesses,
            countryGuessSuccess: isCorrect,
          },
        }));
        if (isCorrect) launchEmojiBurst(emojiThemes.correct);
        get().saveCurrentGameState();
        return isCorrect;
      }
      return false;
    } finally {
      get().setLoading("countryGuess", false);
    }
  },

  makeProteinGuess: (guess: number): boolean => {
    const { currentDish, gamePhase, loading } = get();
    if (!currentDish || !currentDish.proteinPerServing || loading.proteinGuess) return false;
    try {
      get().setLoading("proteinGuess", true);
      if (gamePhase === "protein") {
        const isCorrect = guess === currentDish.proteinPerServing;
        const newGuesses = [...get().proteinGuesses, guess];
        const difference = Math.abs(guess - currentDish.proteinPerServing);
        set((state) => ({
          proteinGuesses: newGuesses,
          proteinGuessResults: [
            ...state.proteinGuessResults,
            { guess, actualProtein: currentDish.proteinPerServing!, difference, isCorrect },
          ],
          gameResults: {
            ...state.gameResults,
            proteinGuesses: newGuesses,
            proteinGuessSuccess: isCorrect,
          },
        }));
        if (isCorrect) launchEmojiBurst(emojiThemes.correct);
        get().saveCurrentGameState();
        return isCorrect;
      }
      return false;
    } finally {
      get().setLoading("proteinGuess", false);
    }
  },

  revealNextIngredient: () => {
    set((state) => ({
      revealedIngredients: Math.min(
        state.revealedIngredients + 1,
        state.currentDish?.recipe.ingredients.length || 1
      ),
    }));
  },

  moveToCountryPhase: () => {
    set({ gamePhase: "country", activePhase: "country" });
    get().saveCurrentGameState();
  },

  moveToProteinPhase: () => {
    set({ gamePhase: "protein", activePhase: "protein" });
    get().saveCurrentGameState();
  },

  completeGame: () => {
    updateStreak();
    set({ gamePhase: "complete", modalVisible: true });
    get().saveCurrentGameState();
  },

  resetCountryGuesses: () => set({ countryGuesses: [] }),
  resetProteinGuesses: () => set({ proteinGuesses: [] }),

  revealCorrectCountry: () => {
    const { currentDish } = get();
    if (currentDish) {
      set({ countryGuesses: [currentDish.country], countryGuessResults: [] });
    }
  },

  revealCorrectProtein: () => {
    const { currentDish } = get();
    if (currentDish?.proteinPerServing) {
      set({ proteinGuesses: [currentDish.proteinPerServing] });
    }
  },

  getSortedCountryCoords: () => getSortedCountryCoords(),

  guessDish: (guess: string) => {
    const isCorrect = get().makeDishGuess(guess);
    if (isCorrect) {
      launchEmojiBurst(emojiThemes.correct);
      setTimeout(() => get().moveToCountryPhase(), 1200);
    }
    return isCorrect;
  },

  guessCountry: (guess: string) => {
    const isCorrect = get().makeCountryGuess(guess);
    if (isCorrect) {
      launchEmojiBurst(emojiThemes.correct);
      setTimeout(() => get().moveToProteinPhase(), 1200);
    }
    return isCorrect;
  },

  guessProtein: (guess: number) => {
    const isCorrect = get().makeProteinGuess(guess);
    if (isCorrect) {
      launchEmojiBurst(emojiThemes.correct);
      setTimeout(() => get().completeGame(), 1200);
    }
    return isCorrect;
  },

  setActivePhase: (phase: "dish" | "country" | "protein") => {
    set({ activePhase: phase });
  },

  markGameTracked: () => {
    set((state) => ({
      gameResults: { ...state.gameResults, tracked: true },
    }));
    get().saveCurrentGameState();
  },

  isDishPhaseComplete: () => {
    const { gameResults, dishGuesses } = get();
    return gameResults.dishGuessSuccess || dishGuesses.length >= 3;
  },

  isCountryPhaseComplete: () => {
    const { gameResults, countryGuesses } = get();
    return gameResults.countryGuessSuccess || countryGuesses.length >= 3;
  },

  isProteinPhaseComplete: () => {
    const { gameResults, proteinGuesses } = get();
    return gameResults.proteinGuessSuccess || proteinGuesses.length >= 3;
  },

  isPhaseComplete: (phase: "dish" | "country" | "protein") => {
    if (phase === "dish") return get().isDishPhaseComplete();
    if (phase === "country") return get().isCountryPhaseComplete();
    if (phase === "protein") return get().isProteinPhaseComplete();
    return false;
  },
}));