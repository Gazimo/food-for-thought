/**
 * Pasta Score Submission Utility
 *
 * Handles score submission to the pasta leaderboard API.
 * Includes all 4 phase scores (pasta, sauce, region, protein) and calculates
 * weighted total score (0-100).
 */

import {
  calculatePastaTotalScore,
  PastaPhaseScores,
} from "@/utils/scoreCalculators";
import {
  PastaScoreSubmission,
  PastaLeaderboardStats,
  Pasta,
} from "@/types/pasta";

// Helper function to get or create a session ID
function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "server-session";

  const SESSION_KEY = "fft-session-id";
  let sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

/**
 * Submit pasta game scores to the leaderboard
 *
 * @param phaseScores - Individual phase scores (0-100 each)
 * @param guessCount - Number of guesses per phase
 * @param pasta - The pasta item being played
 * @returns Leaderboard stats with percentile and rank
 */
export async function submitPastaScore(
  phaseScores: PastaPhaseScores,
  guessCount: {
    pasta: number;
    sauce: number;
    region: number;
    protein: number;
  },
  pasta: Pasta
): Promise<PastaLeaderboardStats> {
  // Calculate weighted total score (0-100)
  const totalScore = calculatePastaTotalScore(phaseScores);

  // Get session ID
  const sessionId = getOrCreateSessionId();

  // Get pasta date
  const pastaDate = pasta.releaseDate || new Date().toISOString().split("T")[0];

  // Prepare submission
  const submission: PastaScoreSubmission = {
    pastaDate,
    pastaId: pasta.id,
    sessionId,
    pastaScore: phaseScores.pasta,
    sauceScore: phaseScores.sauce,
    regionScore: phaseScores.region,
    proteinScore: phaseScores.protein,
    totalScore,
    pastaGuesses: guessCount.pasta,
    sauceGuesses: guessCount.sauce,
    regionGuesses: guessCount.region,
    proteinGuesses: guessCount.protein,
  };

  // Submit to API
  const response = await fetch("/api/pasta/leaderboard", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    const errorData = await response.json();

    // If score already submitted, fetch existing stats
    if (errorData.code === "ALREADY_SUBMITTED") {
      return fetchPastaLeaderboardStats(pastaDate);
    }

    throw new Error(errorData.error || "Failed to submit pasta score");
  }

  const data: PastaLeaderboardStats = await response.json();
  return data;
}

/**
 * Fetch pasta leaderboard stats for a specific date
 *
 * @param date - The pasta date (YYYY-MM-DD)
 * @returns Leaderboard stats
 */
export async function fetchPastaLeaderboardStats(
  date?: string
): Promise<PastaLeaderboardStats | null> {
  const sessionId = getOrCreateSessionId();
  const targetDate = date || new Date().toISOString().split("T")[0];

  const response = await fetch(
    `/api/pasta/leaderboard?date=${targetDate}&sessionId=${sessionId}`
  );

  if (!response.ok) {
    const errorData = await response.json();

    // If no score found, return null (user hasn't played yet)
    if (errorData.code === "NO_SCORE") {
      return null;
    }

    throw new Error(errorData.error || "Failed to fetch pasta leaderboard stats");
  }

  const data: PastaLeaderboardStats = await response.json();
  return data;
}
