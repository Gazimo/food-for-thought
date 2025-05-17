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
  dishGuesses: 0,
  countryGuesses: 0,
  gameResults: {
    dishGuesses: 0,
    dishGuessSuccess: false,
    countryGuesses: 0,
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
      dishGuesses: 0,
      countryGuesses: 0,
      gameResults: {
        dishGuesses: 0,
        dishGuessSuccess: false,
        countryGuesses: 0,
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
      const newGuesses = get().dishGuesses + 1;
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
      const newGuesses = get().countryGuesses + 1;
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
    set({
      gamePhase: "complete",
      modalVisible: true,
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
      if (dishGuesses >= 6) {
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
