/**
 * Food for Thought - Original Game Configuration
 *
 * The classic "Guess the Dish" game with three phases:
 * 1. Guess the Dish - Identify the dish from a partially revealed image
 * 2. Guess the Country - Identify the country of origin
 * 3. Guess the Protein - Estimate protein content per serving
 */

import { GameConfig } from "./types";

export const foodForThoughtConfig: GameConfig = {
  id: "food-for-thought",
  name: "Food for Thought",
  description:
    "A daily global game about food and geography. Uncover the dish. Track it to its origin. Become a Chef.",
  urlPath: "/play",
  icon: "🍽️",
  phases: [
    {
      id: "dish",
      title: "🍽️ Guess the Dish",
      icon: "🍽️",
      description: "Identify the dish from the partially revealed image",
      inputType: "text",
      maxGuesses: 6,
      revealsTiles: true,
      revealsHints: true,
      tileCount: 6,
      tileGrid: [3, 2],
      baseScore: 100,
      penaltyPerGuess: 15,
    },
    {
      id: "country",
      title: "🌍 Guess the Country of Origin",
      icon: "🌍",
      description: "Identify which country this dish originates from",
      inputType: "country-map",
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
    type: "recipe",
    title: "Recipe",
  },
  tableName: "dishes",
  apiPrefix: "/api",
  storageKeyPrefix: "fft-game-state",
  enabled: true,
  releaseDate: null,
};
