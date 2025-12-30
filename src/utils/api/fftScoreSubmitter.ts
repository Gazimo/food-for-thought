import { ScoreSubmitter } from "@/config/games/types";
import { calculateTotalScore } from "@/utils/scoreCalculator";

export const fftScoreSubmitter: ScoreSubmitter = {
  async submit(phaseResults, dish, updateStreak) {
    const dishPhase = phaseResults.find((p) => p.phaseId === "dish");
    const countryPhase = phaseResults.find((p) => p.phaseId === "country");
    const proteinPhase = phaseResults.find((p) => p.phaseId === "protein");

    const dishGuesses = (dishPhase?.guesses || []) as string[];
    const countryGuesses = (countryPhase?.guesses || []) as string[];
    const proteinGuesses = (proteinPhase?.guesses || []) as number[];

    const gameResults = {
      dishGuesses,
      countryGuesses,
      proteinGuesses,
      dishGuessSuccess: dishPhase?.success || false,
      countryGuessSuccess: countryPhase?.success || false,
      proteinGuessSuccess: proteinPhase?.success || false,
    };

    const scores = calculateTotalScore(gameResults, dish);

    const sessionId =
      localStorage.getItem("sessionId") || crypto.randomUUID();
    localStorage.setItem("sessionId", sessionId);

    const dishDate = new Date().toISOString().split("T")[0];

    const response = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dishDate,
        dishId: dish.id,
        sessionId,
        dishScore: scores.dishScore,
        countryScore: scores.countryScore,
        proteinScore: scores.proteinScore,
        totalScore: scores.totalScore,
        dishGuesses: dishGuesses.length,
        countryGuesses: countryGuesses.length,
        proteinGuesses: proteinGuesses.length,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.code === "ALREADY_SUBMITTED") {
        throw new Error("Score already submitted for today");
      }
      throw new Error(error.error || "Failed to submit score");
    }

    const stats = await response.json();

    const newStreak = updateStreak();

    return {
      rank: stats.todayRank.rank,
      percentile: stats.todayRank.percentile,
      dishScore: scores.dishScore,
      countryScore: scores.countryScore,
      proteinScore: scores.proteinScore,
    };
  },
};
