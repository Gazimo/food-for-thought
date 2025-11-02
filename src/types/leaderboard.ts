export interface LeaderboardScore {
  dishScore: number;
  countryScore: number;
  proteinScore: number;
  totalScore: number;
  percentile: number;
  rank?: number;
}

export interface LeaderboardStats {
  todayRank: LeaderboardScore;
  overallRank?: LeaderboardScore;
}

export interface UserStatistics {
  currentStreak: number;
  bestStreak: number;
  totalGames: number;
  averageScore: number;
  bestScore: number;
}

export interface TodayTopScores {
  topScores: number[]; // Top 10 scores
  userRank: number;
  userScore: number;
}

export interface ScoreDistribution {
  buckets: {
    range: string; // e.g., "0-10", "10-20", etc.
    count: number;
    hasUser: boolean; // Whether user's score is in this bucket
  }[];
  userScore: number;
  userRank: number;
  totalPlayers: number;
}

export interface StatisticsData {
  userStats: UserStatistics;
  todayPerformance?: LeaderboardScore; // Only if played today
  scoreDistribution?: ScoreDistribution; // Only if played today
  totalPlayersToday: number;
}

export interface ScoreSubmission {
  dishDate: string;
  dishId?: number;
  sessionId: string;
  dishScore: number;
  countryScore: number;
  proteinScore: number;
  totalScore: number;
  dishGuesses: number;
  countryGuesses: number;
  proteinGuesses: number;
}

export interface GameScoreRecord {
  id: number;
  dish_date: string;
  dish_id: number | null;
  session_id: string;
  dish_score: number;
  country_score: number;
  protein_score: number;
  total_score: number;
  dish_guesses: number;
  country_guesses: number;
  protein_guesses: number;
  completed_at: string;
  created_at: string;
}

export interface PerformanceTier {
  name: string;
  emoji: string;
  minPercentile: number;
  color: string;
}

export const PERFORMANCE_TIERS: PerformanceTier[] = [
  { name: "Culinary Legend", emoji: "🏆", minPercentile: 95, color: "#FFD700" },
  { name: "Master Chef", emoji: "👨‍🍳", minPercentile: 85, color: "#C0C0C0" },
  { name: "Expert Cook", emoji: "⭐", minPercentile: 70, color: "#CD7F32" },
  { name: "Skilled Foodie", emoji: "🍽️", minPercentile: 50, color: "#4CAF50" },
  { name: "Enthusiast", emoji: "🍴", minPercentile: 0, color: "#2196F3" },
];

export function getPerformanceTier(percentile: number): PerformanceTier {
  return (
    PERFORMANCE_TIERS.find((tier) => percentile >= tier.minPercentile) ||
    PERFORMANCE_TIERS[PERFORMANCE_TIERS.length - 1]
  );
}

/**
 * Get display title based on rank and percentile
 * Uses rank to determine if user is in top position, otherwise shows percentile
 */
export function getDisplayTitle(rank: number, percentile: number): string {
  // If user is ranked #1, show "Top Player" or "Leading Player"
  if (rank === 1) {
    // If percentile is 100, they're the only player or scored perfectly
    if (percentile === 100) {
      return "Top Player";
    }
    return "Leading Player";
  }

  // For all other ranks, show percentile-based title
  const topPercent = Math.round(100 - percentile);
  return `Top ${topPercent}%`;
}
