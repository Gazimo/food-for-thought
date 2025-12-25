import { PastaLeaderboardStats, PastaScoreSubmission } from "@/types/pasta";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Submit pasta game score to leaderboard
 */
export function useSubmitPastaScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submission: PastaScoreSubmission) => {
      const response = await fetch("/api/pasta/leaderboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pastaDate: submission.pastaDate,
          pastaId: submission.pastaId,
          sessionId: submission.sessionId,
          pastaScore: submission.pastaScore,
          sauceScore: submission.sauceScore,
          regionScore: submission.regionScore,
          proteinScore: submission.proteinScore,
          totalScore: submission.totalScore,
          pastaGuesses: submission.pastaGuesses,
          sauceGuesses: submission.sauceGuesses,
          regionGuesses: submission.regionGuesses,
          proteinGuesses: submission.proteinGuesses,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit score");
      }

      return response.json() as Promise<PastaLeaderboardStats>;
    },
    onSuccess: (data, variables) => {
      // Invalidate leaderboard cache for this date
      queryClient.invalidateQueries({
        queryKey: ["pasta-leaderboard", variables.pastaDate, variables.sessionId],
      });
    },
  });
}

/**
 * Fetch pasta leaderboard stats for a specific date
 */
export function usePastaLeaderboard(date?: string, sessionId?: string) {
  return useQuery({
    queryKey: ["pasta-leaderboard", date, sessionId],
    queryFn: async () => {
      if (!sessionId) {
        throw new Error("Session ID is required");
      }

      const url = date
        ? `/api/pasta/leaderboard?date=${date}&sessionId=${sessionId}`
        : `/api/pasta/leaderboard?sessionId=${sessionId}`;

      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch leaderboard");
      }

      return response.json() as Promise<PastaLeaderboardStats>;
    },
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Check if user has already submitted a score for a date
 */
export function usePastaScoreExists(date: string, sessionId?: string) {
  return useQuery({
    queryKey: ["pasta-score-exists", date, sessionId],
    queryFn: async () => {
      if (!sessionId) return false;

      try {
        const response = await fetch(
          `/api/pasta/leaderboard?date=${date}&sessionId=${sessionId}`
        );

        // If we get a 404 with code NO_SCORE, user hasn't submitted yet
        if (response.status === 404) {
          const error = await response.json();
          return error.code !== "NO_SCORE";
        }

        // If we get 200, user has submitted
        return response.ok;
      } catch {
        return false;
      }
    },
    enabled: !!sessionId && !!date,
  });
}
