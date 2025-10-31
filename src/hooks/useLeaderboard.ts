import { useGameStore } from "@/store";
import { useEffect } from "react";

/**
 * Hook for managing leaderboard functionality
 * Provides easy access to leaderboard state and actions
 */
export function useLeaderboard() {
  const {
    leaderboardStats,
    leaderboardLoading,
    leaderboardError,
    submitScore,
    fetchLeaderboardStats,
    loadLeaderboardFromStorage,
  } = useGameStore();

  // Load from storage on mount
  useEffect(() => {
    loadLeaderboardFromStorage();
  }, [loadLeaderboardFromStorage]);

  return {
    stats: leaderboardStats,
    loading: leaderboardLoading,
    error: leaderboardError,
    submitScore,
    fetchStats: fetchLeaderboardStats,
    hasStats: !!leaderboardStats,
  };
}
