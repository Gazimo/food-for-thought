import { getCountryCoordsMap } from "@/utils/countries";
import {
  calculateDirection,
  calculateDistance,
  capitalizeFirst,
  loadDishes as fetchDishes,
  isDishGuessCorrect,
  normalizeString,
} from "@/utils/gameHelpers";
import { create } from "zustand";
import { Dish, enrichDishesWithCoords } from "../../public/data/dishes";
import { CountryGuessResult } from "../components/CountryGuessFeedback";

export type GamePhase = "dish" | "country" | "complete";

export interface GameResults {
  dishGuesses: number;
  dishGuessSuccess: boolean;
  countryGuesses: number;
  countryGuessSuccess: boolean;
  totalTime?: number; // We could add this later for tracking completion time
}

interface GameState {
  currentDish: Dish | null;
  dishes: Dish[];
  loadDishes: () => Promise<void>;
  gamePhase: GamePhase;
  revealedIngredients: number;
  dishGuesses: number;
  countryGuesses: number;
  gameResults: GameResults;
  startNewGame: () => void;
  makeDishGuess: (guess: string) => boolean;
  makeCountryGuess: (guess: string) => boolean;
  revealNextIngredient: () => void;
  moveToCountryPhase: () => void;
  completeGame: () => void;
  revealedTiles: boolean[];
  revealRandomTile: () => void;
  revealAllTiles: () => void;
  resetCountryGuesses: () => void;
  countryGuessResults: CountryGuessResult[];
  updateGameResults: (results: Partial<GameResults>) => void;
  getSortedCountryCoords: () => Record<string, { lat: number; lng: number }>;
}
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
    set({ gamePhase: "complete" });
  },
  resetCountryGuesses: () => set({ countryGuessResults: [] }),
  getSortedCountryCoords,
}));
