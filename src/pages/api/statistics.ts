import { StatisticsData } from "@/types/leaderboard";
import { calculateBestStreakFromDates } from "@/utils/streak";
import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sessionId, date } = req.query;

  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ error: "Session ID required" });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Database configuration error" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const targetDate =
    typeof date === "string" ? date : new Date().toISOString().split("T")[0];

  try {
    // Get user's all-time statistics
    const { data: userScores } = await supabase
      .from("game_scores")
      .select("total_score, dish_date, dish_score, country_score, protein_score")
      .eq("session_id", sessionId);

    const totalGames = userScores?.length || 0;
    const averageScore =
      totalGames > 0
        ? userScores!.reduce((sum, s) => sum + Number(s.total_score), 0) /
          totalGames
        : 0;
    const bestScore =
      totalGames > 0
        ? Math.max(...userScores!.map((s) => Number(s.total_score)))
        : 0;

    // Calculate best streak from dates
    const dates = userScores?.map((s) => s.dish_date) || [];
    const bestStreakFromDB = calculateBestStreakFromDates(dates);

    // Get current streak from request (will be passed from frontend)
    // For now, we'll use 0 as placeholder - frontend will provide this
    const currentStreak = 0; // Frontend will provide via localStorage

    // Get user's score for today (if exists)
    const { data: todayScore } = await supabase
      .from("game_scores")
      .select("*")
      .eq("session_id", sessionId)
      .eq("dish_date", targetDate)
      .single();

    let todayPerformance = undefined;
    let scoreDistribution = undefined;
    let totalPlayersToday = 0;

    if (todayScore) {
      // Get all scores for today to calculate percentile and distribution
      const { data: allTodayScores } = await supabase
        .from("game_scores")
        .select("total_score")
        .eq("dish_date", targetDate);

      const todayScoreValues =
        allTodayScores?.map((s) => Number(s.total_score)) || [];
      totalPlayersToday = todayScoreValues.length;

      // Calculate percentile
      const scoresAbove = todayScoreValues.filter(
        (s) => s > Number(todayScore.total_score)
      ).length;
      const percentile =
        todayScoreValues.length > 0
          ? ((todayScoreValues.length - scoresAbove) /
              todayScoreValues.length) *
            100
          : 100;

      const rank = scoresAbove + 1;

      todayPerformance = {
        dishScore: Number(todayScore.dish_score),
        countryScore: Number(todayScore.country_score),
        proteinScore: Number(todayScore.protein_score),
        totalScore: Number(todayScore.total_score),
        percentile: Math.round(percentile),
        rank,
      };

      // Generate baseline scores for better distribution visualization
      // These represent typical player performance patterns
      const generateBaselineScores = (userScore: number): number[] => {
        const baseline: number[] = [];
        
        // Add scores in a bell curve distribution centered around 50-60
        // Low scores (0-30): Few players
        baseline.push(15, 22, 28);
        
        // Mid-low scores (30-50): Some players
        baseline.push(35, 38, 42, 45, 48);
        
        // Mid scores (50-70): Most players (bell curve peak)
        baseline.push(52, 55, 58, 61, 63, 65, 67, 69);
        
        // Mid-high scores (70-85): Decent players
        baseline.push(72, 75, 78, 81, 84);
        
        // High scores (85-100): Few skilled players
        baseline.push(87, 91, 95);
        
        // Add some variation around user's score for context
        // But not too close to avoid looking fake
        const userBucket = Math.floor(userScore / 10);
        const nearbyScores: number[] = [];
        
        // Add 2-3 scores in adjacent buckets
        if (userBucket > 0) {
          nearbyScores.push((userBucket - 1) * 10 + 5);
        }
        if (userBucket < 9) {
          nearbyScores.push((userBucket + 1) * 10 + 5);
        }
        
        return [...baseline, ...nearbyScores];
      };

      const userScore = Number(todayScore.total_score);
      
      // Combine real scores with baseline scores
      const allScoresForDistribution = [
        ...todayScoreValues,
        ...generateBaselineScores(userScore),
      ];

      // Calculate score distribution (10-point buckets)
      const buckets = [
        { range: "0-10", min: 0, max: 10, count: 0, hasUser: false },
        { range: "10-20", min: 10, max: 20, count: 0, hasUser: false },
        { range: "20-30", min: 20, max: 30, count: 0, hasUser: false },
        { range: "30-40", min: 30, max: 40, count: 0, hasUser: false },
        { range: "40-50", min: 40, max: 50, count: 0, hasUser: false },
        { range: "50-60", min: 50, max: 60, count: 0, hasUser: false },
        { range: "60-70", min: 60, max: 70, count: 0, hasUser: false },
        { range: "70-80", min: 70, max: 80, count: 0, hasUser: false },
        { range: "80-90", min: 80, max: 90, count: 0, hasUser: false },
        { range: "90-100", min: 90, max: 100, count: 0, hasUser: false },
      ];

      // Count all scores (real + baseline) in each bucket
      allScoresForDistribution.forEach((score) => {
        const bucketIndex = Math.min(Math.floor(score / 10), 9);
        buckets[bucketIndex].count++;
      });
      
      // Mark user's bucket (only based on real user score)
      const userBucketIndex = Math.min(Math.floor(userScore / 10), 9);
      buckets[userBucketIndex].hasUser = true;

      scoreDistribution = {
        buckets: buckets.map(({ range, count, hasUser }) => ({
          range,
          count,
          hasUser,
        })),
        userScore,
        userRank: rank, // Still based on real players only
        totalPlayers: totalPlayersToday, // Still real count
      };
    }

    const statistics: StatisticsData = {
      userStats: {
        currentStreak, // Will be updated by frontend
        bestStreak: bestStreakFromDB,
        totalGames,
        averageScore: Math.round(averageScore * 100) / 100,
        bestScore: Math.round(bestScore * 100) / 100,
      },
      todayPerformance,
      scoreDistribution,
      totalPlayersToday,
    };

    return res.status(200).json(statistics);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

