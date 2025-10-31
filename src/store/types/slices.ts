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
import { LeaderboardStats, StatisticsData } from "../../types/leaderboard";

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
  markGameTracked: () => void;

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
}

export interface LeaderboardSlice {
  leaderboardStats: LeaderboardStats | null;
  leaderboardLoading: boolean;
  leaderboardError: string | null;
  statisticsData: StatisticsData | null;
  statisticsLoading: boolean;
  statisticsError: string | null;
  showStatsAnnouncement: boolean;

  setLeaderboardStats: (stats: LeaderboardStats | null) => void;
  setLeaderboardLoading: (loading: boolean) => void;
  setLeaderboardError: (error: string | null) => void;
  setStatisticsData: (data: StatisticsData | null) => void;
  setStatisticsLoading: (loading: boolean) => void;
  setStatisticsError: (error: string | null) => void;
  setShowStatsAnnouncement: (show: boolean) => void;
  checkStatsAnnouncement: () => void;
  markStatsAnnouncementSeen: () => void;
  submitScore: (gameResults: GameResults, currentDish: Dish) => Promise<void>;
  fetchLeaderboardStats: (date?: string) => Promise<void>;
  loadLeaderboardFromStorage: () => void;
  fetchStatistics: (date?: string) => Promise<void>;
  loadStatisticsFromStorage: () => void;
}

export interface GameStoreState
  extends PersistenceSlice,
    GameSlice,
    UiSlice,
    GuessSlice,
    ArchiveSlice,
    StreakSlice,
    LeaderboardSlice {}

export type GameSliceCreator<T> = StateCreator<GameStoreState, [], [], T>;
