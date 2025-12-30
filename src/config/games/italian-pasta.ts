/**
 * Italian Pasta Game Configuration
 *
 * A specialized pasta-focused game with four phases:
 * 1. Guess the Pasta - Identify the pasta type/shape from a plain pasta image
 *    - Reveals pasta metadata hints (shape, ingredients, preparation, etymology)
 * 2. Guess the Sauce - Identify the classic sauce that pairs with this pasta
 *    - Reveals sauce ingredient hints
 * 3. Guess the Region - Identify the Italian region of origin
 * 4. Guess the Protein - Estimate protein content per serving
 *
 * See /docs/PRD_ITALIAN_PASTA.md for full product requirements.
 */

import { GameConfig, ScoreSubmitter, PhaseResult, LeaderboardStats } from "./types";
import { calculatePastaTotalScore } from "@/utils/scoreCalculators/pastaScoreCalculator";
import { submitPastaScore } from "@/utils/submitPastaScore";
import { PastaPhaseScores } from "@/utils/scoreCalculators/pastaScoreCalculator";

const pastaScoreSubmitter: ScoreSubmitter = {
  async submit(phaseResults: PhaseResult[], item: any, updateStreak: () => number): Promise<LeaderboardStats> {
    updateStreak();

    const pastaScores: PastaPhaseScores = {
      pasta: phaseResults.find((p) => p.phaseId === "pasta")?.score || 0,
      sauce: phaseResults.find((p) => p.phaseId === "sauce")?.score || 0,
      region: phaseResults.find((p) => p.phaseId === "region")?.score || 0,
      protein: phaseResults.find((p) => p.phaseId === "protein")?.score || 0,
    };

    const guessCount = {
      pasta: phaseResults.find((p) => p.phaseId === "pasta")?.guesses.length || 0,
      sauce: phaseResults.find((p) => p.phaseId === "sauce")?.guesses.length || 0,
      region: phaseResults.find((p) => p.phaseId === "region")?.guesses.length || 0,
      protein: phaseResults.find((p) => p.phaseId === "protein")?.guesses.length || 0,
    };

    try {
      const stats = await submitPastaScore(pastaScores, guessCount, item);

      // Map PastaLeaderboardStats to LeaderboardStats
      return {
        rank: stats?.todayRank?.rank,
        percentile: stats?.todayRank?.percentile,
      };
    } catch (error) {
      console.error("Score submission error details:", {
        pastaScores,
        guessCount,
        item,
        error,
      });
      throw error;
    }
  },
};

export const italianPastaConfig: GameConfig = {
  id: "italian-pasta",
  name: "Guess'é di Pasta",
  description:
    "A daily Italian pasta guessing game. Identify the pasta shape, its classic sauce, and where it comes from.",
  urlPath: "/pasta",
  icon: "🍝",
  architecture: "unified",
  scoreAggregator: (scores) =>
    calculatePastaTotalScore({
      pasta: scores.pasta || 0,
      sauce: scores.sauce || 0,
      region: scores.region || 0,
      protein: scores.protein || 0,
    }),
  scoreSubmitter: pastaScoreSubmitter,
  phases: [
    {
      id: "pasta",
      title: "🍝 Guess the Pasta",
      icon: "🍝",
      description:
        "Identify the type of pasta from its shape (no sauce, plain pasta)",
      inputType: "text",
      maxGuesses: 6,
      revealsTiles: true,
      revealsHints: true, // Pasta metadata revealed (shape, ingredients, preparation, etymology)
      tileCount: 6,
      tileGrid: [3, 2],
      baseScore: 100,
      penaltyPerGuess: 15,
      enforceClosedList: true,
      navigationLabel: "Guess the sauce",
    },
    {
      id: "sauce",
      title: "🍅 Guess the Sauce",
      icon: "🍅",
      description: "Identify the classic sauce that pairs with this pasta",
      inputType: "text",
      maxGuesses: 6,
      revealsTiles: true,
      revealsHints: true, // Sauce ingredients are revealed on wrong guesses
      tileCount: 6,
      tileGrid: [3, 2],
      baseScore: 100,
      penaltyPerGuess: 15,
      navigationLabel: "Guess the region",
      acceptableGuessesField: "sauceAcceptableGuesses",
    },
    {
      id: "region",
      title: "🇮🇹 Guess the Region",
      icon: "🇮🇹",
      description: "Identify which Italian region this pasta originates from",
      inputType: "region-map",
      maxGuesses: null,
      revealsTiles: false,
      revealsHints: false,
      baseScore: 100,
      penaltyPerGuess: 15,
      navigationLabel: "Guess the protein",
      getCorrectAnswer: (item) =>
        item.region
          ? {
              answer: item.region,
              result: {
                region: item.region,
                isCorrect: true,
                distance: 0,
                direction: "",
              },
            }
          : null,
    },
    {
      id: "protein",
      title: "💪 Guess the Protein Content",
      icon: "💪",
      description: "Estimate the protein content per serving (in grams)",
      inputType: "numeric",
      maxGuesses: 4,
      revealsTiles: false,
      revealsHints: false,
      baseScore: 100,
      penaltyPerGuess: 20,
      getCorrectAnswer: (item) =>
        item.proteinPerServing
          ? {
              answer: item.proteinPerServing,
              result: {
                guess: item.proteinPerServing,
                isCorrect: true,
                difference: 0,
              },
            }
          : null,
    },
  ],
  hints: {
    type: "ingredient",
    perWrongGuess: 1,
    maxHints: 6,
  },
  postGameContent: {
    type: "recipe",
    title: "Recipe",
  },
  tableName: "pasta",
  apiPrefix: "/api/pasta",
  storageKeyPrefix: "fft-pasta-state",
  enabled: true, // Will be enabled when ready for launch
  releaseDate: null, // TBD
};
