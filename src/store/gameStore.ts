import { getCountryCoordsMap } from "@/utils/countries";
import {
  calculateDirection,
  calculateDistance,
  capitalizeFirst,
  loadDishes as fetchDishes,
  isDishGuessCorrect,
  normalizeString,
} from "@/utils/gameHelpers";
import confetti from "canvas-confetti";
import { create } from "zustand";
import { enrichDishesWithCoords } from "../../public/data/dishes";
import { GameResults, GameState } from "../types/game";
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
    const savedDishGuesses = localStorage.getItem("fft-dish-guesses");
    const savedCountryGuesses = localStorage.getItem("fft-country-guesses");

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
        dishGuesses: savedDishGuesses ? JSON.parse(savedDishGuesses) : [],
        countryGuesses: savedCountryGuesses
          ? JSON.parse(savedCountryGuesses)
          : [],
        modalVisible: true,
        gamePhase: "complete",
      });
    }
  },
  currentDish: null,
  dishes: [],
  loadDishes: async () => {
    const rawDishes = await fetchDishes();
    const countryCoords = getCountryCoordsMap();
    const enriched = enrichDishesWithCoords(rawDishes, countryCoords);
    set({ dishes: enriched });
  },
  gamePhase: "dish",
  revealedIngredients: 1,
  dishGuesses: [],
  countryGuesses: [],
  gameResults: {
    dishGuesses: [],
    dishGuessSuccess: false,
    countryGuesses: [],
    countryGuessSuccess: false,
  },
  revealedTiles: [false, false, false, false, false, false],
  countryGuessResults: [],
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
      gameResults: {
        dishGuesses: [],
        dishGuessSuccess: false,
        countryGuesses: [],
        countryGuessSuccess: false,
      },
      revealedTiles: [false, false, false, false, false, false],
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
      // const newGuesses = [...get().gameResults.countryGuesses, normalizedGuess];

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

  completeGame: () => {
    const newStreak = updateStreak();
    const state = get();

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "fft-current-dish",
        JSON.stringify(state.currentDish)
      );
      localStorage.setItem(
        "fft-game-results",
        JSON.stringify(state.gameResults)
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
        "fft-dish-guesses",
        JSON.stringify(state.dishGuesses)
      );
      localStorage.setItem(
        "fft-country-guesses",
        JSON.stringify(state.countryGuesses)
      );
    }

    set({
      gamePhase: "complete",
      modalVisible: true,
      streak: newStreak,
    });
  },

  resetCountryGuesses: () => set({ countryGuessResults: [] }),
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
      if (typeof window !== "undefined") confetti();
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
    const { currentDish, makeCountryGuess, completeGame } = get();
    if (!currentDish || !currentDish.coordinates) return false;
    const isCorrect = makeCountryGuess(guess);
    if (isCorrect) {
      if (typeof window !== "undefined") confetti();
      completeGame();
    }
    return isCorrect;
  },
  activePhase: "dish",
  setActivePhase: (phase: "dish" | "country") => set({ activePhase: phase }),
  streak: 0,
  setStreak: (value: number) => set({ streak: value }),
}));
