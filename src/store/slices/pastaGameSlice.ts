import {
  Pasta,
  PastaGamePhase,
  PastaGameResults,
  PASTA_SCORING,
  RegionGuessResult,
  calculatePhaseScore,
  isGuessCorrect,
} from "@/types/pasta";
import { ProteinGuessResult } from "@/types/game";
import { launchEmojiBurst, emojiThemes } from "@/utils/celebration";
import { StateCreator } from "zustand";
import { processLocationGuess } from "../utils/locationGuessLogic";
import italianRegionsData from "../../../public/data/italian-regions.json";

type ItalianRegionsData = Record<string, { lat: number; lng: number; capital: string; cities: string[] }>;
const italianRegions = italianRegionsData as ItalianRegionsData;

export interface PastaGameState {
  // Current pasta
  currentPasta: Pasta | null;
  currentPhase: PastaGamePhase;

  // Phase 1: Pasta guessing
  pastaGuesses: string[];
  pastaRevealedTiles: boolean[];
  pastaRevealedAbout: number;

  // Phase 2: Sauce guessing
  sauceGuesses: string[];
  sauceRevealedTiles: boolean[];
  sauceRevealedIngredients: number;

  // Phase 3: Region guessing
  regionGuesses: string[];
  regionGuessResults: RegionGuessResult[];

  // Phase 4: Protein guessing
  proteinGuesses: number[];
  proteinGuessResults: ProteinGuessResult[];

  // Game results
  gameResults: PastaGameResults;

  // Actions
  setCurrentPasta: (pasta: Pasta) => void;
  startNewGame: () => void;
  guessPasta: (guess: string) => void;
  guessSauce: (guess: string) => void;
  guessRegion: (guess: string) => void;
  guessProtein: (guess: number) => void;
  moveToSaucePhase: () => void;
  moveToRegionPhase: () => void;
  moveToProteinPhase: () => void;
  goBackToPastaPhase: () => void;
  goBackToSaucePhase: () => void;
  goBackToRegionPhase: () => void;
  completeGame: () => void;
  isPastaPhaseComplete: () => boolean;
  isSaucePhaseComplete: () => boolean;
  isRegionPhaseComplete: () => boolean;
  isProteinPhaseComplete: () => boolean;
  saveCurrentGameState: () => void;
  loadGameState: (date: string) => void;
  giveUpPastaPhase: () => void;
  giveUpSaucePhase: () => void;
}

export const createPastaGameSlice: StateCreator<PastaGameState> = (
  set,
  get
) => ({
  currentPasta: null,
  currentPhase: "pasta",
  pastaGuesses: [],
  pastaRevealedTiles: [false, false, false, false, false, false],
  pastaRevealedAbout: 0,
  sauceGuesses: [],
  sauceRevealedTiles: [false, false, false, false, false, false],
  sauceRevealedIngredients: 0,
  regionGuesses: [],
  regionGuessResults: [],
  proteinGuesses: [],
  proteinGuessResults: [],
  gameResults: {
    pastaSuccess: false,
    sauceSuccess: false,
    regionSuccess: false,
    proteinSuccess: false,
    pastaGuesses: 0,
    sauceGuesses: 0,
    regionGuesses: 0,
    proteinGuesses: 0,
    pastaScore: 0,
    sauceScore: 0,
    regionScore: 0,
    proteinScore: 0,
    totalScore: 0,
    revealedPastaAbout: 0,
    revealedSauceIngredients: 0,
  },

  setCurrentPasta: (pasta) => {
    set({ currentPasta: pasta });
  },

  startNewGame: () => {
    set({
      currentPhase: "pasta",
      pastaGuesses: [],
      pastaRevealedTiles: [false, false, false, false, false, false],
      pastaRevealedAbout: 0,
      sauceGuesses: [],
      sauceRevealedTiles: [false, false, false, false, false, false],
      sauceRevealedIngredients: 0,
      regionGuesses: [],
      regionGuessResults: [],
      proteinGuesses: [],
      proteinGuessResults: [],
      gameResults: {
        pastaSuccess: false,
        sauceSuccess: false,
        regionSuccess: false,
        proteinSuccess: false,
        pastaGuesses: 0,
        sauceGuesses: 0,
        regionGuesses: 0,
        proteinGuesses: 0,
        pastaScore: 0,
        sauceScore: 0,
        regionScore: 0,
        proteinScore: 0,
        totalScore: 0,
        revealedPastaAbout: 0,
        revealedSauceIngredients: 0,
      },
    });
  },

  guessPasta: (guess) => {
    const state = get();
    const { currentPasta, pastaGuesses, pastaRevealedTiles, pastaRevealedAbout } =
      state;

    if (!currentPasta || state.currentPhase !== "pasta") return;

    const newGuesses = [...pastaGuesses, guess];
    const isCorrect = isGuessCorrect(guess, currentPasta.acceptableGuesses);

    const maxGuessesReached = newGuesses.length >= PASTA_SCORING.PASTA.MAX_GUESSES;
    const phaseComplete = isCorrect || maxGuessesReached;

    // Reveal all tiles if correct OR max guesses, one tile if still playing
    const newRevealedTiles = phaseComplete
      ? [true, true, true, true, true, true]
      : (() => {
          const tiles = [...pastaRevealedTiles];
          const nextTileIndex = tiles.findIndex((t) => !t);
          if (nextTileIndex !== -1) {
            tiles[nextTileIndex] = true;
          }
          return tiles;
        })();

    // Reveal one hint per wrong guess (up to 6)
    const newRevealedAbout = isCorrect
      ? pastaRevealedAbout
      : Math.min(pastaRevealedAbout + 1, 6);

    // Calculate score
    const wrongGuesses = newGuesses.length - (isCorrect ? 1 : 0);
    const pastaScore = calculatePhaseScore(
      PASTA_SCORING.PASTA.BASE_SCORE,
      PASTA_SCORING.PASTA.PENALTY_PER_GUESS,
      wrongGuesses,
      isCorrect
    );

    set({
      pastaGuesses: newGuesses,
      pastaRevealedTiles: newRevealedTiles,
      pastaRevealedAbout: newRevealedAbout,
      gameResults: {
        ...state.gameResults,
        pastaSuccess: isCorrect,
        pastaGuesses: newGuesses.length,
        pastaScore,
        revealedPastaAbout: newRevealedAbout,
      },
    });

    // Celebration on correct guess (no auto-advance)
    if (isCorrect) {
      if (typeof window !== "undefined") {
        launchEmojiBurst(emojiThemes.pasta);
      }
    }

    get().saveCurrentGameState();
  },

  giveUpPastaPhase: () => {
    const state = get();
    const { currentPasta } = state;

    if (!currentPasta || state.currentPhase !== "pasta") return;

    // Reveal all tiles and all hints
    set({
      pastaRevealedTiles: [true, true, true, true, true, true],
      pastaRevealedAbout: 6,
      gameResults: {
        ...state.gameResults,
        pastaSuccess: false,
        pastaGuesses: state.pastaGuesses.length,
        pastaScore: 0,
        revealedPastaAbout: 6,
      },
    });

    get().saveCurrentGameState();
  },

  guessSauce: (guess) => {
    const state = get();
    const {
      currentPasta,
      sauceGuesses,
      sauceRevealedTiles,
      sauceRevealedIngredients,
    } = state;

    if (!currentPasta || state.currentPhase !== "sauce") return;

    const newGuesses = [...sauceGuesses, guess];
    const isCorrect = isGuessCorrect(guess, currentPasta.sauceAcceptableGuesses);

    const maxGuessesReached = newGuesses.length >= PASTA_SCORING.SAUCE.MAX_GUESSES;
    const phaseComplete = isCorrect || maxGuessesReached;

    // Reveal all tiles if correct OR max guesses, one tile if still playing
    const newRevealedTiles = phaseComplete
      ? [true, true, true, true, true, true]
      : (() => {
          const tiles = [...sauceRevealedTiles];
          const nextTileIndex = tiles.findIndex((t) => !t);
          if (nextTileIndex !== -1) {
            tiles[nextTileIndex] = true;
          }
          return tiles;
        })();

    // Reveal one ingredient per wrong guess (up to 6)
    const newRevealedIngredients = isCorrect
      ? sauceRevealedIngredients
      : Math.min(sauceRevealedIngredients + 1, 6);

    // Calculate score
    const wrongGuesses = newGuesses.length - (isCorrect ? 1 : 0);
    const sauceScore = calculatePhaseScore(
      PASTA_SCORING.SAUCE.BASE_SCORE,
      PASTA_SCORING.SAUCE.PENALTY_PER_GUESS,
      wrongGuesses,
      isCorrect
    );

    set({
      sauceGuesses: newGuesses,
      sauceRevealedTiles: newRevealedTiles,
      sauceRevealedIngredients: newRevealedIngredients,
      gameResults: {
        ...state.gameResults,
        sauceSuccess: isCorrect,
        sauceGuesses: newGuesses.length,
        sauceScore,
        revealedSauceIngredients: newRevealedIngredients,
      },
    });

    // Celebration on correct guess (no auto-advance)
    if (isCorrect) {
      if (typeof window !== "undefined") {
        launchEmojiBurst(emojiThemes.sauce);
      }
    }

    get().saveCurrentGameState();
  },

  giveUpSaucePhase: () => {
    const state = get();
    const { currentPasta } = state;

    if (!currentPasta || state.currentPhase !== "sauce") return;

    // Reveal all tiles and all ingredients
    set({
      sauceRevealedTiles: [true, true, true, true, true, true],
      sauceRevealedIngredients: 6,
      gameResults: {
        ...state.gameResults,
        sauceSuccess: false,
        sauceGuesses: state.sauceGuesses.length,
        sauceScore: 0,
        revealedSauceIngredients: 6,
      },
    });

    get().saveCurrentGameState();
  },

  guessRegion: (guess) => {
    const state = get();
    const { currentPasta, regionGuesses, regionGuessResults } = state;

    if (!currentPasta || state.currentPhase !== "region") return;

    const guessCoords = italianRegions[guess as keyof typeof italianRegions];
    const correctCoords = currentPasta.regionCoordinates;

    if (!guessCoords || !correctCoords) {
      console.error("Region coordinates not found");
      return;
    }

    const result = processLocationGuess({
      guess,
      correctLocation: currentPasta.region,
      guessCoords,
      correctCoords,
      currentGuesses: regionGuesses,
      maxGuesses: null,
    });

    const newGuesses = [...regionGuesses, guess];
    const newGuessResult: RegionGuessResult = {
      region: guess,
      distance: result.guessResult.distance,
      direction: result.guessResult.direction,
      isCorrect: result.isCorrect,
    };
    const newGuessResults = [...regionGuessResults, newGuessResult];

    const wrongGuesses = newGuesses.length - (result.isCorrect ? 1 : 0);
    const regionScore = calculatePhaseScore(
      PASTA_SCORING.REGION.BASE_SCORE,
      PASTA_SCORING.REGION.PENALTY_PER_GUESS,
      wrongGuesses,
      result.isCorrect
    );

    set({
      regionGuesses: newGuesses,
      regionGuessResults: newGuessResults,
      gameResults: {
        ...state.gameResults,
        regionSuccess: result.isCorrect,
        regionGuesses: newGuesses.length,
        regionScore,
      },
    });

    if (result.isCorrect) {
      if (typeof window !== "undefined") {
        launchEmojiBurst(emojiThemes.region);
      }
    }

    get().saveCurrentGameState();
  },

  guessProtein: (guess) => {
    const state = get();
    const { currentPasta, proteinGuesses, proteinGuessResults } = state;

    if (!currentPasta || state.currentPhase !== "protein") return;

    const newGuesses = [...proteinGuesses, guess];
    const actualProtein = currentPasta.proteinPerServing || 0;
    const tolerance = PASTA_SCORING.PROTEIN.TOLERANCE;

    const isCorrect =
      Math.abs(guess - actualProtein) <= tolerance;

    const newGuessResult: ProteinGuessResult = {
      guess,
      actualProtein,
      difference: Math.abs(guess - actualProtein),
      isCorrect,
    };

    const newGuessResults = [...proteinGuessResults, newGuessResult];
    const maxGuessesReached =
      newGuesses.length >= PASTA_SCORING.PROTEIN.MAX_GUESSES;
    const phaseComplete = isCorrect || maxGuessesReached;

    // Calculate score
    const wrongGuesses = newGuesses.length - (isCorrect ? 1 : 0);
    const proteinScore = calculatePhaseScore(
      PASTA_SCORING.PROTEIN.BASE_SCORE,
      PASTA_SCORING.PROTEIN.PENALTY_PER_GUESS,
      wrongGuesses,
      isCorrect
    );

    set({
      proteinGuesses: newGuesses,
      proteinGuessResults: newGuessResults,
      gameResults: {
        ...state.gameResults,
        proteinSuccess: isCorrect,
        proteinGuesses: newGuesses.length,
        proteinScore,
      },
    });

    // Celebration on correct guess (no auto-advance)
    if (isCorrect) {
      if (typeof window !== "undefined") {
        launchEmojiBurst(emojiThemes.protein);
      }
    }

    get().saveCurrentGameState();
  },

  moveToSaucePhase: () => {
    set({ currentPhase: "sauce" });
    get().saveCurrentGameState();
  },

  moveToRegionPhase: () => {
    set({ currentPhase: "region" });
    get().saveCurrentGameState();
  },

  moveToProteinPhase: () => {
    set({ currentPhase: "protein" });
    get().saveCurrentGameState();
  },

  goBackToPastaPhase: () => {
    set({ currentPhase: "pasta" });
    get().saveCurrentGameState();
  },

  goBackToSaucePhase: () => {
    set({ currentPhase: "sauce" });
    get().saveCurrentGameState();
  },

  goBackToRegionPhase: () => {
    set({ currentPhase: "region" });
    get().saveCurrentGameState();
  },

  completeGame: () => {
    const state = get();
    const totalScore =
      state.gameResults.pastaScore +
      state.gameResults.sauceScore +
      state.gameResults.regionScore +
      state.gameResults.proteinScore;

    set({
      currentPhase: "complete",
      gameResults: {
        ...state.gameResults,
        totalScore,
      },
    });

    get().saveCurrentGameState();
  },

  isPastaPhaseComplete: () => {
    const { gameResults, pastaGuesses, pastaRevealedTiles } = get();
    // Phase is complete if correct guess OR max guesses reached OR all tiles revealed (gave up)
    return (
      gameResults.pastaSuccess ||
      pastaGuesses.length >= PASTA_SCORING.PASTA.MAX_GUESSES ||
      pastaRevealedTiles.every((tile) => tile === true)
    );
  },

  isSaucePhaseComplete: () => {
    const { gameResults, sauceGuesses, sauceRevealedTiles } = get();
    // Phase is complete if correct guess OR max guesses reached OR all tiles revealed (gave up)
    return (
      gameResults.sauceSuccess ||
      sauceGuesses.length >= PASTA_SCORING.SAUCE.MAX_GUESSES ||
      sauceRevealedTiles.every((tile) => tile === true)
    );
  },

  isRegionPhaseComplete: () => {
    const { gameResults } = get();
    return gameResults.regionSuccess;
  },

  isProteinPhaseComplete: () => {
    const { gameResults, proteinGuesses } = get();
    return gameResults.proteinSuccess || proteinGuesses.length >= PASTA_SCORING.PROTEIN.MAX_GUESSES;
  },

  saveCurrentGameState: () => {
    const state = get();
    const date = state.currentPasta?.releaseDate || new Date().toISOString().split("T")[0];
    const storageKey = `fft-pasta-state-${date}`;

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          currentPhase: state.currentPhase,
          pastaGuesses: state.pastaGuesses,
          pastaRevealedTiles: state.pastaRevealedTiles,
          pastaRevealedAbout: state.pastaRevealedAbout,
          sauceGuesses: state.sauceGuesses,
          sauceRevealedTiles: state.sauceRevealedTiles,
          sauceRevealedIngredients: state.sauceRevealedIngredients,
          regionGuesses: state.regionGuesses,
          regionGuessResults: state.regionGuessResults,
          proteinGuesses: state.proteinGuesses,
          proteinGuessResults: state.proteinGuessResults,
          gameResults: state.gameResults,
        })
      );
    } catch (error) {
      console.error("Error saving pasta game state:", error);
    }
  },

  loadGameState: (date) => {
    const storageKey = `fft-pasta-state-${date}`;

    try {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        set({
          currentPhase: parsed.currentPhase,
          pastaGuesses: parsed.pastaGuesses,
          pastaRevealedTiles: parsed.pastaRevealedTiles,
          pastaRevealedAbout: parsed.pastaRevealedAbout,
          sauceGuesses: parsed.sauceGuesses,
          sauceRevealedTiles: parsed.sauceRevealedTiles,
          sauceRevealedIngredients: parsed.sauceRevealedIngredients,
          regionGuesses: parsed.regionGuesses,
          regionGuessResults: parsed.regionGuessResults,
          proteinGuesses: parsed.proteinGuesses,
          proteinGuessResults: parsed.proteinGuessResults,
          gameResults: parsed.gameResults,
        });
      }
    } catch (error) {
      console.error("Error loading pasta game state:", error);
    }
  },
});
