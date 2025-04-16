import { Dish, getRandomDish } from "@/data/dishes";
import { create } from "zustand";

export type GamePhase = "dish" | "country" | "complete";

interface GameState {
  currentDish: Dish | null;
  gamePhase: GamePhase;
  revealedIngredients: number;
  dishGuesses: number;
  countryGuesses: number;
  startNewGame: () => void;
  makeGuess: (guess: string) => boolean;
  revealNextIngredient: () => void;
  moveToCountryPhase: () => void;
  completeGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentDish: null,
  gamePhase: "dish",
  revealedIngredients: 1,
  dishGuesses: 0,
  countryGuesses: 0,

  startNewGame: () => {
    const dish = getRandomDish();
    set({
      currentDish: dish,
      gamePhase: "dish",
      revealedIngredients: 1,
      dishGuesses: 0,
      countryGuesses: 0,
    });
  },

  makeGuess: (guess: string): boolean => {
    const { currentDish, gamePhase } = get();

    if (!currentDish) return false;

    if (gamePhase === "dish") {
      set((state) => ({ dishGuesses: state.dishGuesses + 1 }));
      return guess.toLowerCase() === currentDish.name.toLowerCase();
    } else if (gamePhase === "country") {
      set((state) => ({ countryGuesses: state.countryGuesses + 1 }));
      return guess.toLowerCase() === currentDish.country.toLowerCase();
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
}));

// Initialize the game when the store is first used
if (typeof window !== "undefined") {
  // Only run on client side
  const { currentDish, startNewGame } = useGameStore.getState();
  if (!currentDish) {
    startNewGame();
  }
}
