import { LeaderboardStats, StatisticsData } from "@/types/leaderboard";
import { getStreak, getBestStreak } from "@/utils/streak";
import { GameSliceCreator, LeaderboardSlice } from "../types/slices";

const LEADERBOARD_STORAGE_KEY = "fft-leaderboard";
const STATISTICS_STORAGE_KEY = "fft-statistics";
const STATS_ANNOUNCEMENT_KEY = "fft-stats-announcement-seen";

export const createLeaderboardSlice: GameSliceCreator<LeaderboardSlice> = (
  set,
  get
) => ({
  leaderboardStats: null,
  leaderboardLoading: false,
  leaderboardError: null,
  statisticsData: null,
  statisticsLoading: false,
  statisticsError: null,
  showStatsAnnouncement: false,

  setLeaderboardStats: (stats) => {
    set({ leaderboardStats: stats });
    // Persist to localStorage
    if (typeof window !== "undefined" && stats) {
      localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(stats));
    }
  },

  setLeaderboardLoading: (loading) => {
    set({ leaderboardLoading: loading });
  },

  setLeaderboardError: (error) => {
    set({ leaderboardError: error });
  },

  setStatisticsData: (data) => {
    set({ statisticsData: data });
    if (typeof window !== "undefined" && data) {
      localStorage.setItem(STATISTICS_STORAGE_KEY, JSON.stringify(data));
    }
  },

  setStatisticsLoading: (loading) => {
    set({ statisticsLoading: loading });
  },

  setStatisticsError: (error) => {
    set({ statisticsError: error });
  },

  setShowStatsAnnouncement: (show) => {
    set({ showStatsAnnouncement: show });
  },

  checkStatsAnnouncement: () => {
    if (typeof window === "undefined") return;
    
    const seen = localStorage.getItem(STATS_ANNOUNCEMENT_KEY);
    if (!seen) {
      set({ showStatsAnnouncement: true });
    }
  },

  markStatsAnnouncementSeen: () => {
    if (typeof window === "undefined") return;
    
    localStorage.setItem(STATS_ANNOUNCEMENT_KEY, "true");
    set({ showStatsAnnouncement: false });
  },

  submitScore: async (gameResults, currentDish) => {
    const state = get();
    set({ leaderboardLoading: true, leaderboardError: null });

    try {
      // Import here to avoid circular dependencies
      const { calculateTotalScore } = await import("@/utils/scoreCalculator");

      const scores = calculateTotalScore(gameResults, currentDish);
      const sessionId = getOrCreateSessionId();
      const dishDate =
        currentDish.releaseDate || new Date().toISOString().split("T")[0];

      const response = await fetch("/api/leaderboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dishDate,
          dishId: currentDish.id,
          sessionId,
          dishScore: scores.dishScore,
          countryScore: scores.countryScore,
          proteinScore: scores.proteinScore,
          totalScore: scores.totalScore,
          dishGuesses: gameResults.dishGuesses.length,
          countryGuesses: gameResults.countryGuesses.length,
          proteinGuesses: gameResults.proteinGuesses.length,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // If already submitted, try to fetch existing stats
        if (errorData.code === "ALREADY_SUBMITTED") {
          await state.fetchLeaderboardStats(dishDate);
          return;
        }

        throw new Error(errorData.error || "Failed to submit score");
      }

      const stats: LeaderboardStats = await response.json();
      state.setLeaderboardStats(stats);
    } catch (error) {
      console.error("Error submitting score:", error);
      set({
        leaderboardError:
          error instanceof Error ? error.message : "Failed to submit score",
      });
    } finally {
      set({ leaderboardLoading: false });
    }
  },

  fetchLeaderboardStats: async (date) => {
    const state = get();
    set({ leaderboardLoading: true, leaderboardError: null });

    try {
      const sessionId = getOrCreateSessionId();
      const targetDate = date || new Date().toISOString().split("T")[0];

      const response = await fetch(
        `/api/leaderboard?date=${targetDate}&sessionId=${sessionId}`
      );

      if (!response.ok) {
        const errorData = await response.json();

        // If no score found, that's okay - user hasn't played yet
        if (errorData.code === "NO_SCORE") {
          set({ leaderboardStats: null });
          return;
        }

        throw new Error(errorData.error || "Failed to fetch stats");
      }

      const stats: LeaderboardStats = await response.json();
      state.setLeaderboardStats(stats);
    } catch (error) {
      console.error("Error fetching leaderboard stats:", error);
      set({
        leaderboardError:
          error instanceof Error ? error.message : "Failed to fetch stats",
      });
    } finally {
      set({ leaderboardLoading: false });
    }
  },

  loadLeaderboardFromStorage: () => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
      if (stored) {
        const stats: LeaderboardStats = JSON.parse(stored);
        set({ leaderboardStats: stats });
      }
    } catch (error) {
      console.error("Error loading leaderboard from storage:", error);
    }
  },

  fetchStatistics: async (date?: string) => {
    const state = get();
    set({ statisticsLoading: true, statisticsError: null });

    try {
      const sessionId = getOrCreateSessionId();
      const targetDate = date || new Date().toISOString().split("T")[0];

      const response = await fetch(
        `/api/statistics?sessionId=${sessionId}&date=${targetDate}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch statistics");
      }

      const data: StatisticsData = await response.json();
      
      // Update with current streak from localStorage
      const currentStreak = getStreak();
      const bestStreak = Math.max(getBestStreak(), data.userStats.bestStreak);
      
      const updatedData = {
        ...data,
        userStats: {
          ...data.userStats,
          currentStreak,
          bestStreak,
        },
      };

      state.setStatisticsData(updatedData);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      set({
        statisticsError:
          error instanceof Error ? error.message : "Failed to fetch statistics",
      });
    } finally {
      set({ statisticsLoading: false });
    }
  },

  loadStatisticsFromStorage: () => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(STATISTICS_STORAGE_KEY);
      if (stored) {
        const data: StatisticsData = JSON.parse(stored);
        set({ statisticsData: data });
      }
    } catch (error) {
      console.error("Error loading statistics from storage:", error);
    }
  },
});

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
