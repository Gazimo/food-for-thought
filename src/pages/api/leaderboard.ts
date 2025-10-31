import { GameScoreInsert } from "@/types/database";
import { LeaderboardStats } from "@/types/leaderboard";
import { calculatePercentile } from "@/utils/scoreCalculator";
import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";
import PostHogClient from "../../lib/posthog";

// Rate limiting: Track submissions by session
const submissionCache = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
// Rate limiting disabled for now
// const MAX_SUBMISSIONS_PER_WINDOW = 5;

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const lastSubmission = submissionCache.get(sessionId);

  if (lastSubmission && now - lastSubmission < RATE_LIMIT_WINDOW) {
    return false;
  }

  submissionCache.set(sessionId, now);
  return true;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, timestamp] of submissionCache.entries()) {
    if (now - timestamp > RATE_LIMIT_WINDOW) {
      submissionCache.delete(sessionId);
    }
  }
}, RATE_LIMIT_WINDOW);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Database configuration error" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // POST: Submit a score
  if (req.method === "POST") {
    try {
      const {
        dishDate,
        dishId,
        sessionId,
        dishScore,
        countryScore,
        proteinScore,
        totalScore,
        dishGuesses,
        countryGuesses,
        proteinGuesses,
      } = req.body;

      // Validation
      if (
        !dishDate ||
        !sessionId ||
        dishScore === undefined ||
        countryScore === undefined ||
        proteinScore === undefined ||
        totalScore === undefined
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Rate limiting
      if (!checkRateLimit(sessionId)) {
        return res
          .status(429)
          .json({ error: "Too many submissions. Please try again later." });
      }

      // Check if this session already submitted for this date
      const { data: existingScore } = await supabase
        .from("game_scores")
        .select("id")
        .eq("dish_date", dishDate)
        .eq("session_id", sessionId)
        .single();

      if (existingScore) {
        return res.status(400).json({
          error: "Score already submitted for this date",
          code: "ALREADY_SUBMITTED",
        });
      }

      // Insert the score
      const scoreData: GameScoreInsert = {
        dish_date: dishDate,
        dish_id: dishId || null,
        session_id: sessionId,
        dish_score: dishScore,
        country_score: countryScore,
        protein_score: proteinScore,
        total_score: totalScore,
        dish_guesses: dishGuesses,
        country_guesses: countryGuesses,
        protein_guesses: proteinGuesses,
      };

      const { error: insertError } = await supabase
        .from("game_scores")
        .insert(scoreData);

      if (insertError) {
        console.error("Error inserting score:", insertError);
        return res.status(500).json({ error: "Failed to save score" });
      }

      // Calculate percentiles
      const stats = await calculateLeaderboardStats(
        supabase,
        dishDate,
        sessionId,
        totalScore
      );

      // Track analytics
      const posthog = PostHogClient();
      try {
        await posthog.capture({
          distinctId: sessionId,
          event: "leaderboard_score_submitted",
          properties: {
            dishDate,
            totalScore,
            percentile: stats.todayRank.percentile,
            dishScore,
            countryScore,
            proteinScore,
          },
        });
      } catch (error) {
        console.error("PostHog capture error:", error);
      }

      return res.status(200).json(stats);
    } catch (error) {
      console.error("Error in POST /api/leaderboard:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // GET: Retrieve leaderboard stats
  if (req.method === "GET") {
    try {
      const { date, sessionId } = req.query;

      if (!sessionId || typeof sessionId !== "string") {
        return res.status(400).json({ error: "Session ID required" });
      }

      const targetDate =
        typeof date === "string"
          ? date
          : new Date().toISOString().split("T")[0];

      // Get user's score for this date
      const { data: userScore } = await supabase
        .from("game_scores")
        .select("*")
        .eq("dish_date", targetDate)
        .eq("session_id", sessionId)
        .single();

      if (!userScore) {
        return res.status(404).json({
          error: "No score found for this date",
          code: "NO_SCORE",
        });
      }

      const stats = await calculateLeaderboardStats(
        supabase,
        targetDate,
        sessionId,
        userScore.total_score
      );

      return res.status(200).json(stats);
    } catch (error) {
      console.error("Error in GET /api/leaderboard:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

async function calculateLeaderboardStats(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  dishDate: string,
  sessionId: string,
  userScore: number
): Promise<LeaderboardStats> {
  // Get all scores for today
  const { data: todayScores } = await supabase
    .from("game_scores")
    .select("total_score")
    .eq("dish_date", dishDate);

  // Get all scores overall
  const { data: allScores } = await supabase
    .from("game_scores")
    .select("total_score");

  // Get user's specific scores for today
  const { data: userTodayScore } = await supabase
    .from("game_scores")
    .select("*")
    .eq("dish_date", dishDate)
    .eq("session_id", sessionId)
    .single();

  const todayScoreValues = (todayScores?.map((s: { total_score: number }) =>
    Number(s.total_score)
  ) || []) as number[];
  const allScoreValues = (allScores?.map((s: { total_score: number }) => Number(s.total_score)) ||
    []) as number[];

  // Calculate percentiles from REAL scores only (no synthetic data)
  const todayPercentile = calculatePercentile(userScore, todayScoreValues);
  const overallPercentile = calculatePercentile(userScore, allScoreValues);

  // Calculate rank (position in sorted list)
  const todayRank = todayScoreValues.filter((s) => s > userScore).length + 1;

  return {
    todayRank: {
      dishScore: Number(userTodayScore?.dish_score || 0),
      countryScore: Number(userTodayScore?.country_score || 0),
      proteinScore: Number(userTodayScore?.protein_score || 0),
      totalScore: userScore,
      percentile: todayPercentile,
      rank: todayRank,
    },
    overallRank: {
      dishScore: Number(userTodayScore?.dish_score || 0),
      countryScore: Number(userTodayScore?.country_score || 0),
      proteinScore: Number(userTodayScore?.protein_score || 0),
      totalScore: userScore,
      percentile: overallPercentile,
    },
    totalPlayersToday: todayScoreValues.length,
  };
}
