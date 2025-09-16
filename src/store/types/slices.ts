import { StateCreator } from "zustand";
import { Dish } from "../../types/dishes";
import {
  ArchivesUnlock,
  CountryGuessResult,
  GamePhase,
  GameResults,
  LoadingStates,
  ProteinGuessResult,
} from "../../types/game";

export interface PersistenceSlice {
  saveCurrentGameState: () => void;
  restoreGameStateFromStorage: (forceRestore?: boolean) => boolean;
  resetTodaysProgress: () => void;
}

export interface GameSlice {
  currentDish: Dish | null;
  dishes: Dish[];
  gamePhase: GamePhase;
  gameResults: GameResults;

  setCurrentDish: (dish: Dish | null) => void;
  startNewGame: () => void;
  moveToCountryPhase: () => void;
  moveToProteinPhase: () => void;
  completeGame: () => void;
  updateGameResults: (results: Partial<GameResults>) => void;

  isDishPhaseComplete: () => boolean;
  isCountryPhaseComplete: () => boolean;
  isProteinPhaseComplete: () => boolean;
  isPhaseComplete: (phase: "dish" | "country" | "protein") => boolean;
}

export interface UiSlice {
  modalVisible: boolean;
  activePhase: "dish" | "country" | "protein";
  loading: LoadingStates;
  revealedTiles: boolean[];
  revealedIngredients: number;
  hasRestoredState: boolean;

  toggleModal: (visible?: boolean) => void;
  setActivePhase: (phase: "dish" | "country" | "protein") => void;
  setLoading: (key: keyof LoadingStates, value: boolean) => void;
  revealRandomTile: () => void;
  revealAllTiles: () => void;
  revealNextIngredient: () => void;
}

export interface GuessSlice {
  dishGuesses: string[];
  countryGuesses: string[];
  proteinGuesses: number[];
  countryGuessResults: CountryGuessResult[];
  proteinGuessResults: ProteinGuessResult[];

  makeDishGuess: (guess: string) => boolean;
  makeCountryGuess: (guess: string) => boolean;
  makeProteinGuess: (guess: number) => boolean;
  guessDish: (guess: string) => boolean;
  guessCountry: (guess: string) => boolean;
  guessProtein: (guess: number) => boolean;
  resetCountryGuesses: () => void;
  resetProteinGuesses: () => void;
  revealCorrectCountry: () => void;
  revealCorrectProtein: () => void;
  getSortedCountryCoords: () => Record<string, { lat: number; lng: number }>;
}

export interface ArchiveSlice {
  archivesUnlock?: ArchivesUnlock;
  isPlayingArchive: boolean;
  archiveDate?: string;
  _exitingArchive?: boolean;

  isArchivesUnlockedNow: () => boolean;
  unlockArchives: () => void;
  startArchiveMode: (date: string) => void;
  exitArchiveMode: () => void;
}

export interface StreakSlice {
  streak: number;

  setStreak: (value: number) => void;
  markGameTracked: () => void;
}

export interface GameStoreState
  extends PersistenceSlice,
    GameSlice,
    UiSlice,
    GuessSlice,
    ArchiveSlice,
    StreakSlice {}

export type GameSliceCreator<T> = StateCreator<GameStoreState, [], [], T>;
