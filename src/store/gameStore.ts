import { getCountryCoordsMap } from "@/utils/countries";
import {
  calculateDirection,
  calculateDistance,
  capitalizeFirst,
  isDishGuessCorrect,
  loadDishes,
  normalizeString,
} from "@/utils/gameHelpers";
import { create } from "zustand";
import { enrichDishesWithCoords } from "../../public/data/dishes";
import { GameResults, GameState } from "../types/game";
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
  restoreGameStateFromStorage: () => {
    if (typeof window === "undefined") return;

    const savedDish = localStorage.getItem("fft-current-dish");
    const savedResults = localStorage.getItem("fft-game-results");
    const savedTiles = localStorage.getItem("fft-revealed-tiles");
    const savedIngredients = localStorage.getItem("fft-revealed-ingredients");
    const savedCountryResults = localStorage.getItem("fft-country-results");
    const savedProteinResults = localStorage.getItem("fft-protein-results");
    const savedDishGuesses = localStorage.getItem("fft-dish-guesses");
    const savedCountryGuesses = localStorage.getItem("fft-country-guesses");
    const savedProteinGuesses = localStorage.getItem("fft-protein-guesses");

    if (savedDish && savedResults) {
      set({
        currentDish: JSON.parse(savedDish),
        gameResults: JSON.parse(savedResults),
        revealedTiles: savedTiles
          ? JSON.parse(savedTiles)
          : [false, false, false, false, false, false],
        revealedIngredients: savedIngredients ? Number(savedIngredients) : 1,
        countryGuessResults: savedCountryResults
          ? JSON.parse(savedCountryResults)
          : [],
        proteinGuessResults: savedProteinResults
          ? JSON.parse(savedProteinResults)
          : [],
        dishGuesses: savedDishGuesses ? JSON.parse(savedDishGuesses) : [],
        countryGuesses: savedCountryGuesses
          ? JSON.parse(savedCountryGuesses)
          : [],
        proteinGuesses: savedProteinGuesses
          ? JSON.parse(savedProteinGuesses)
          : [],
        modalVisible: true,
        gamePhase: "complete",
      });
    }
  },
  currentDish: null,
  dishes: [],
  loadDishes: async () => {
    const rawDishes = await loadDishes();
    const countryCoords = getCountryCoordsMap();
    const enriched = enrichDishesWithCoords(rawDishes, countryCoords);
    const todayDish = enriched[0] || null;
    set({
      dishes: enriched,
      currentDish: todayDish,
    });
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

    set({ revealedTiles: newTiles });
  },

  revealAllTiles: () => {
    set({ revealedTiles: [true, true, true, true, true, true] });
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

  makeDishGuess: (guess: string): boolean => {
    const { currentDish, gamePhase } = get();
    if (!currentDish) return false;
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
      return isCorrect;
    }
    return false;
  },

  makeCountryGuess: (guess: string): boolean => {
    const { currentDish, gamePhase } = get();
    if (!currentDish) return false;
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
      return isCorrect;
    }
    return false;
  },

  makeProteinGuess: (guess: number): boolean => {
    const { currentDish, gamePhase } = get();
    if (!currentDish || gamePhase !== "protein") return false;

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

    return isCorrect;
  },

  revealNextIngredient: () => {
    const { revealedIngredients, currentDish } = get();

    if (revealedIngredients < (currentDish?.ingredients.length || 0)) {
      set((state) => ({ revealedIngredients: state.revealedIngredients + 1 }));
    } else if (currentDish) {
      get().moveToCountryPhase();
    }
  },

  moveToCountryPhase: () => {
    set({ gamePhase: "country" });
  },

  moveToProteinPhase: () => {
    set({ gamePhase: "protein" });
  },

  completeGame: () => {
    const newStreak = updateStreak();
    const state = get();

    const hasAnySuccess =
      state.gameResults.dishGuessSuccess ||
      state.gameResults.countryGuessSuccess ||
      state.gameResults.proteinGuessSuccess;

    const finalStatus = hasAnySuccess ? "won" : "lost";

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "fft-current-dish",
        JSON.stringify(state.currentDish)
      );
      localStorage.setItem(
        "fft-game-results",
        JSON.stringify({
          ...state.gameResults,
          status: finalStatus,
          tracked: false,
        })
      );
      localStorage.setItem(
        "fft-revealed-tiles",
        JSON.stringify(state.revealedTiles)
      );
      localStorage.setItem(
        "fft-revealed-ingredients",
        String(state.revealedIngredients)
      );
      localStorage.setItem(
        "fft-country-results",
        JSON.stringify(state.countryGuessResults)
      );
      localStorage.setItem(
        "fft-protein-results",
        JSON.stringify(state.proteinGuessResults)
      );
      localStorage.setItem(
        "fft-dish-guesses",
        JSON.stringify(state.dishGuesses)
      );
      localStorage.setItem(
        "fft-country-guesses",
        JSON.stringify(state.countryGuesses)
      );
      localStorage.setItem(
        "fft-protein-guesses",
        JSON.stringify(state.proteinGuesses)
      );
    }

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
  setActivePhase: (phase: "dish" | "country" | "protein") =>
    set({ activePhase: phase }),
  streak: 0,
  setStreak: (value: number) => set({ streak: value }),
  markGameTracked: () =>
    set((state) => ({
      gameResults: {
        ...state.gameResults,
        tracked: true,
      },
    })),
}));
