import { LeaderboardConfig } from "./leaderboardHandlers";

export const fftLeaderboardConfig: LeaderboardConfig = {
  tableName: "game_scores",
  dateField: "dish_date",
  idField: "dish_id",
  scoreFields: {
    dishScore: "dish_score",
    countryScore: "country_score",
    proteinScore: "protein_score",
  },
  guessFields: {
    dishGuesses: "dish_guesses",
    countryGuesses: "country_guesses",
    proteinGuesses: "protein_guesses",
  },
  analyticsEvent: "leaderboard_score_submitted",
};

export const pastaLeaderboardConfig: LeaderboardConfig = {
  tableName: "pasta_leaderboard",
  dateField: "pasta_date",
  idField: "pasta_id",
  scoreFields: {
    pastaScore: "pasta_score",
    sauceScore: "sauce_score",
    regionScore: "region_score",
    proteinScore: "protein_score",
  },
  guessFields: {
    pastaGuesses: "pasta_guesses",
    sauceGuesses: "sauce_guesses",
    regionGuesses: "region_guesses",
    proteinGuesses: "protein_guesses",
  },
  analyticsEvent: "pasta_leaderboard_score_submitted",
  validateScores: (scores) => Object.values(scores).every(s => s >= 0 && s <= 100),
};

export function getLeaderboardConfigById(gameId: string): LeaderboardConfig {
  switch (gameId) {
    case "food-for-thought":
      return fftLeaderboardConfig;
    case "italian-pasta":
      return pastaLeaderboardConfig;
    default:
      throw new Error(`No leaderboard config found for game: ${gameId}`);
  }
}
