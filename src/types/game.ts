import { Dish } from "../../public/data/dishes";

export type GamePhase = "dish" | "country" | "complete";

export interface GameResults {
  dishGuesses: number;
  dishGuessSuccess: boolean;
  countryGuesses: number;
  countryGuessSuccess: boolean;
  totalTime?: number; // We could add this later for tracking completion time
}

export interface CountryGuessResult {
  country: string;
  distance: number;
  direction: string;
  isCorrect: boolean;
}

export interface GameState {
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
  guessDish: (guess: string) => boolean;
  guessCountry: (guess: string) => boolean;
  modalVisible: boolean;
  toggleModal: (visible?: boolean) => void;
  activePhase: "dish" | "country";
  setActivePhase: (phase: "dish" | "country") => void;
  streak: number;
  setStreak: (value: number) => void;
}
