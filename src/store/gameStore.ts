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
import { updateStreak } from "../utils/streak";
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
  archivesUnlock: undefined,
  isPlayingArchive: false,
  archiveDate: undefined,

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
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now

    set({
      archivesUnlock: {
        grantedOnLocalISO: today,
        expiresAt,
      },
    });

    // Persist to localStorage
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

  startArchiveMode: (date: string) => {
    // Save today's current state before switching to archive mode
    get().saveCurrentGameState();

    set({
      isPlayingArchive: true,
      archiveDate: date,
      // Reset game state for archive
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
      // Clear currentDish so it gets refreshed with archive dish data
      currentDish: null,
    });
  },

  exitArchiveMode: () => {
    // First, try to restore today's game state while still in archive mode
    // This prevents the isPlayingArchive check from interfering
    let todaysState = null;

    if (typeof window !== "undefined") {
      try {
        const today = new Date().toISOString().split("T")[0];

        // Try to get today's specific game state first
        let saved = localStorage.getItem(`fft-game-state-${today}`);

        // Fall back to legacy key if today's specific state doesn't exist
        if (!saved) {
          saved = localStorage.getItem("fft-game-state");
        }

        if (saved) {
          const parsedState = JSON.parse(saved);

          // Check if the saved game state is from today
          const savedDate = parsedState.savedDate;

          // If saved date matches today, prepare the state for restoration
          if (savedDate && savedDate === today && parsedState.gameResults) {
            console.log("🔄 Restoring today's game state from localStorage:", {
              gamePhase: parsedState.gamePhase,
              dishGuessSuccess: parsedState.gameResults.dishGuessSuccess,
              countryGuessSuccess: parsedState.gameResults.countryGuessSuccess,
              proteinGuessSuccess: parsedState.gameResults.proteinGuessSuccess,
            });
            todaysState = {
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
            };
          }
        } else {
          console.log("❌ No saved game state found for today");
        }
      } catch (error) {
        console.error("Error restoring today's state:", error);
        todaysState = null;
      }
    }

    console.log(
      "🏠 Exiting archive mode, restored state:",
      todaysState ? "✅ Found" : "❌ Not found"
    );

    // Now exit archive mode and apply the restored state
    set({
      isPlayingArchive: false,
      archiveDate: undefined,
      // Clear currentDish so it gets refreshed with today's dish data
      currentDish: null,
      // Apply restored state if available
      ...(todaysState || {
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
      }),
      // Always ensure modal is not visible when returning from archive
      modalVisible: false,
    });
  },

  saveCurrentGameState: () => {
    if (typeof window === "undefined") return;

    const state = get();

    // Don't save progress for archived games
    if (state.isPlayingArchive) {
      return;
    }

    const today = new Date().toISOString().split("T")[0];
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

    // Always save today's game state with today's date as key
    localStorage.setItem(
      `fft-game-state-${today}`,
      JSON.stringify(gameStateToSave)
    );
    // Keep legacy key for backward compatibility
    localStorage.setItem("fft-game-state", JSON.stringify(gameStateToSave));
  },

  restoreGameStateFromStorage: () => {
    if (typeof window === "undefined") return false;

    const state = get();

    // Don't restore state when in archive mode
    if (state.isPlayingArchive) {
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
      const today = new Date().toISOString().split("T")[0];

      // Try to get today's specific game state first
      let saved = localStorage.getItem(`fft-game-state-${today}`);

      // Fall back to legacy key if today's specific state doesn't exist
      if (!saved) {
        saved = localStorage.getItem("fft-game-state");
      }

      if (!saved) return false;

      const parsedState = JSON.parse(saved);

      // Check if the saved game state is from today
      const savedDate = parsedState.savedDate;

      // If no saved date or it's from a different day, clear the saved state and return
      if (!savedDate || savedDate !== today) {
        localStorage.removeItem("fft-game-state");
        localStorage.removeItem(`fft-game-state-${today}`);
        return false;
      }

      if (parsedState.gameResults) {
        set({
          // Don't restore currentDish - it will be loaded fresh from API
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
          // Don't show modal when restoring from archive mode return
          modalVisible: false,
          hasRestoredState: true,
        });
        return true;
      }
      return false;
    } catch {
      const today = new Date().toISOString().split("T")[0];
      localStorage.removeItem("fft-game-state");
      localStorage.removeItem(`fft-game-state-${today}`);
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
  toggleModal: (visible?: boolean) => {
    if (visible !== undefined) {
      set({ modalVisible: visible });
    } else {
      set((state) => ({ modalVisible: !state.modalVisible }));
    }
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

    if (process.env.NODE_ENV === "development") {
      console.log("Revealing tile:", index, "New tiles state:", newTiles);
    }

    set({ revealedTiles: newTiles });

    // Force a small delay to ensure state propagation
    setTimeout(() => {
      get().saveCurrentGameState();
    }, 0);
  },

  revealAllTiles: () => {
    set({ revealedTiles: [true, true, true, true, true, true] });
    get().saveCurrentGameState();
  },

  startNewGame: () => {
    if (typeof window !== "undefined") {
      const today = new Date().toISOString().split("T")[0];
      localStorage.removeItem("fft-game-state");
      localStorage.removeItem(`fft-game-state-${today}`);
    }

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
        const isCorrect =
          normalizedGuess === normalizeString(currentDish.country);

        const newGuesses = [...get().countryGuesses, normalizedGuess];
        const results = get().countryGuessResults;
        const updatedResults = [...results];
        if (isCorrect) {
          updatedResults.push({
            country: capitalizeFirst(normalizedGuess),
            isCorrect: true,
            distance: 0,
            direction: "N/A",
          });
        } else {
          const coords = countryCoords[normalizedGuess];
          if (!coords) {
            updatedResults.push({
              country: capitalizeFirst(normalizedGuess),
              isCorrect: false,
              distance: NaN,
              direction: "Invalid",
            });
          } else {
            const distance = calculateDistance(
              coords.lat,
              coords.lng,
              currentDish.coordinates?.lat || 0,
              currentDish.coordinates?.lng || 0
            );
            const direction = calculateDirection(
              coords.lat,
              coords.lng,
              currentDish.coordinates?.lat || 0,
              currentDish.coordinates?.lng || 0
            );
            updatedResults.push({
              country: capitalizeFirst(normalizedGuess),
              isCorrect: false,
              distance,
              direction,
            });
          }
        }
        set((state) => ({
          countryGuesses: newGuesses,
          countryGuessResults: updatedResults,
          gameResults: {
            ...state.gameResults,
            countryGuesses: newGuesses,
            countryGuessSuccess: isCorrect,
          },
        }));
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
    if (!currentDish || gamePhase !== "protein" || loading.proteinGuess)
      return false;

    try {
      get().setLoading("proteinGuess", true);
      const actualProtein = currentDish.proteinPerServing || 0;
      const isCorrect = guess === actualProtein;
      const difference = Math.abs(guess - actualProtein);

      const newGuesses = [...get().proteinGuesses, guess];
      const results = get().proteinGuessResults;
      const updatedResults = [
        ...results,
        {
          guess,
          actualProtein,
          difference,
          isCorrect,
        },
      ];

      set((state) => ({
        proteinGuesses: newGuesses,
        proteinGuessResults: updatedResults,
        gameResults: {
          ...state.gameResults,
          proteinGuesses: newGuesses,
          proteinGuessSuccess: isCorrect,
        },
      }));
      get().saveCurrentGameState();

      return isCorrect;
    } finally {
      get().setLoading("proteinGuess", false);
    }
  },

  revealNextIngredient: () => {
    const { revealedIngredients, currentDish } = get();

    if (revealedIngredients < (currentDish?.ingredients.length || 0)) {
      set((state) => ({ revealedIngredients: state.revealedIngredients + 1 }));
      get().saveCurrentGameState();
    } else if (currentDish) {
      get().moveToCountryPhase();
    }
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

    // Use setTimeout to ensure the state update is applied before saving
    // This fixes the timing issue where saveCurrentGameState was called before set() was applied
    setTimeout(() => {
      get().saveCurrentGameState();
    }, 0);
  },

  resetCountryGuesses: () => set({ countryGuessResults: [] }),
  resetProteinGuesses: () => set({ proteinGuessResults: [] }),

  revealCorrectCountry: () => {
    const { currentDish } = get();
    if (!currentDish || !currentDish.coordinates) return;

    const newGuesses = [
      ...get().countryGuesses,
      currentDish.country.toLowerCase(),
    ];
    const results = get().countryGuessResults;
    const updatedResults = [
      ...results,
      {
        country: currentDish.country,
        isCorrect: true,
        distance: 0,
        direction: "",
      },
    ];

    set(() => ({
      countryGuesses: newGuesses,
      countryGuessResults: updatedResults,
    }));
    get().moveToProteinPhase();
  },

  revealCorrectProtein: () => {
    const { currentDish } = get();
    if (!currentDish?.proteinPerServing) return;

    const actualProtein = currentDish.proteinPerServing;
    const newGuesses = [...get().proteinGuesses, actualProtein];
    const results = get().proteinGuessResults;
    const updatedResults = [
      ...results,
      {
        guess: actualProtein,
        actualProtein,
        difference: 0,
        isCorrect: true,
      },
    ];

    set(() => ({
      proteinGuesses: newGuesses,
      proteinGuessResults: updatedResults,
    }));
    get().completeGame();
  },

  getSortedCountryCoords,
  guessDish: (guess: string): boolean => {
    const {
      currentDish,
      makeDishGuess,
      revealAllTiles,
      moveToCountryPhase,
      revealRandomTile,
      revealNextIngredient,
    } = get();
    if (!currentDish) return false;
    const isCorrect = makeDishGuess(guess);
    if (isCorrect) {
      if (typeof window !== "undefined") launchEmojiBurst(emojiThemes.dish);
      revealAllTiles();
      moveToCountryPhase();
    } else {
      const { dishGuesses, revealedIngredients } = get();
      const ingredientsLength = currentDish.ingredients.length || 0;
      if (dishGuesses.length >= 6) {
        revealAllTiles();
        moveToCountryPhase();
      } else {
        revealRandomTile();
        if (revealedIngredients < ingredientsLength) {
          revealNextIngredient();
        }
      }
    }
    return isCorrect;
  },
  guessCountry: (guess: string): boolean => {
    const { currentDish, makeCountryGuess, moveToProteinPhase } = get();
    if (!currentDish || !currentDish.coordinates) return false;
    const isCorrect = makeCountryGuess(guess);
    if (isCorrect) {
      if (typeof window !== "undefined") launchEmojiBurst(emojiThemes.country);
      moveToProteinPhase();
    }
    return isCorrect;
  },
  guessProtein: (guess: number): boolean => {
    const { currentDish, makeProteinGuess, completeGame } = get();
    if (!currentDish) return false;
    const isCorrect = makeProteinGuess(guess);
    if (isCorrect) {
      if (typeof window !== "undefined") launchEmojiBurst(emojiThemes.protein);
      completeGame();
    } else {
      const { proteinGuesses } = get();
      if (proteinGuesses.length >= 4) {
        completeGame();
      }
    }
    return isCorrect;
  },
  activePhase: "dish",
  hasRestoredState: false,
  setActivePhase: (phase: "dish" | "country" | "protein") => {
    set({ activePhase: phase });
    get().saveCurrentGameState();
  },
  streak: 0,
  setStreak: (value: number) => set({ streak: value }),
  markGameTracked: () => {
    set((state) => ({
      gameResults: { ...state.gameResults, tracked: true },
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
  isPhaseComplete: (phase: "dish" | "country" | "protein") => {
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
}));
