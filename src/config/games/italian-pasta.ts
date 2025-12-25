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

import { GameConfig } from "./types";

export const italianPastaConfig: GameConfig = {
  id: "italian-pasta",
  name: "Pasta Perfetto",
  description:
    "A daily Italian pasta guessing game. Identify the pasta shape, its classic sauce, and where it comes from.",
  urlPath: "/pasta",
  icon: "🍝",
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
    },
    {
      id: "region",
      title: "🇮🇹 Guess the Region",
      icon: "🇮🇹",
      description: "Identify which Italian region this pasta originates from",
      inputType: "region-map",
      maxGuesses: 6,
      revealsTiles: false,
      revealsHints: false,
      baseScore: 100,
      penaltyPerGuess: 15,
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
    },
  ],
  hints: {
    type: "ingredient",
    perWrongGuess: 1,
    maxHints: 6,
  },
  postGameContent: {
    type: "story",
    title: "The Story of This Pasta",
  },
  tableName: "pasta",
  apiPrefix: "/api/pasta",
  storageKeyPrefix: "fft-pasta-state",
  enabled: true, // Will be enabled when ready for launch
  releaseDate: null, // TBD
};
