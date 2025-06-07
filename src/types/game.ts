import { Dish } from "./dishes";

export type GamePhase = "dish" | "country" | "protein" | "complete";

export interface GameResults {
  status?: "won" | "lost";
  dishGuesses: string[];
  dishGuessSuccess: boolean;
  countryGuesses: string[];
  countryGuessSuccess: boolean;
  proteinGuesses: number[];
  proteinGuessSuccess: boolean;
  tracked?: boolean;
  totalTime?: number; // We could add this later for tracking completion time
}

export interface CountryGuessResult {
  country: string;
  distance: number;
  direction: string;
  isCorrect: boolean;
}

export interface ProteinGuessResult {
  guess: number;
  actualProtein: number;
  difference: number;
  isCorrect: boolean;
}

export interface GameState {
  restoreGameStateFromStorage: () => void;
  currentDish: Dish | null;
  dishes: Dish[];
  loadDishes: () => Promise<void>;
  gamePhase: GamePhase;
  revealedIngredients: number;
  dishGuesses: string[];
  countryGuesses: string[];
  proteinGuesses: number[];
  gameResults: GameResults;
  startNewGame: () => void;
  makeDishGuess: (guess: string) => boolean;
  makeCountryGuess: (guess: string) => boolean;
  makeProteinGuess: (guess: number) => boolean;
  revealNextIngredient: () => void;
  moveToCountryPhase: () => void;
  moveToProteinPhase: () => void;
  completeGame: () => void;
  revealedTiles: boolean[];
  revealRandomTile: () => void;
  revealAllTiles: () => void;
  resetCountryGuesses: () => void;
  resetProteinGuesses: () => void;
  revealCorrectCountry: () => void;
  revealCorrectProtein: () => void;
  countryGuessResults: CountryGuessResult[];
  proteinGuessResults: ProteinGuessResult[];
  updateGameResults: (results: Partial<GameResults>) => void;
  getSortedCountryCoords: () => Record<string, { lat: number; lng: number }>;
  guessDish: (guess: string) => boolean;
  guessCountry: (guess: string) => boolean;
  guessProtein: (guess: number) => boolean;
  modalVisible: boolean;
  toggleModal: (visible?: boolean) => void;
  activePhase: "dish" | "country" | "protein";
  setActivePhase: (phase: "dish" | "country" | "protein") => void;
  streak: number;
  setStreak: (value: number) => void;
  markGameTracked: () => void;
  isDishPhaseComplete: () => boolean;
  isCountryPhaseComplete: () => boolean;
  isProteinPhaseComplete: () => boolean;
  isPhaseComplete: (phase: "dish" | "country" | "protein") => boolean;
}
