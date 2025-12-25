import {
  PastaLeaderboardInsert,
  PastaLeaderboardStats,
} from "@/types/pasta";
import { calculatePercentile } from "@/utils/scoreCalculator";
import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";
import PostHogClient from "../../../lib/posthog";

// Rate limiting: Track submissions by session
const submissionCache = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute

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
        pastaDate,
        pastaId,
        sessionId,
        pastaScore,
        sauceScore,
        regionScore,
        proteinScore,
        totalScore,
        pastaGuesses,
        sauceGuesses,
        regionGuesses,
        proteinGuesses,
      } = req.body;

      // Validation
      if (
        !pastaDate ||
        !sessionId ||
        pastaScore === undefined ||
        sauceScore === undefined ||
        regionScore === undefined ||
        proteinScore === undefined ||
        totalScore === undefined
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate score ranges (0-100 per phase, 0-400 total)
      if (
        pastaScore < 0 ||
        pastaScore > 100 ||
        sauceScore < 0 ||
        sauceScore > 100 ||
        regionScore < 0 ||
        regionScore > 100 ||
        proteinScore < 0 ||
        proteinScore > 100 ||
        totalScore < 0 ||
        totalScore > 400
      ) {
        return res.status(400).json({ error: "Invalid score values" });
      }

      // Rate limiting
      if (!checkRateLimit(sessionId)) {
        return res
          .status(429)
          .json({ error: "Too many submissions. Please try again later." });
      }

      // Check if this session already submitted for this date
      const { data: existingScore } = await supabase
        .from("pasta_leaderboard")
        .select("id")
        .eq("pasta_date", pastaDate)
        .eq("session_id", sessionId)
        .single();

      if (existingScore) {
        return res.status(400).json({
          error: "Score already submitted for this date",
          code: "ALREADY_SUBMITTED",
        });
      }

      // Insert the score
      const scoreData: PastaLeaderboardInsert = {
        pasta_date: pastaDate,
        pasta_id: pastaId || null,
        session_id: sessionId,
        pasta_score: pastaScore,
        sauce_score: sauceScore,
        region_score: regionScore,
        protein_score: proteinScore,
        total_score: totalScore,
        pasta_guesses: pastaGuesses,
        sauce_guesses: sauceGuesses,
        region_guesses: regionGuesses,
        protein_guesses: proteinGuesses,
      };

      const { error: insertError } = await supabase
        .from("pasta_leaderboard")
        .insert(scoreData);

      if (insertError) {
        console.error("Error inserting pasta score:", insertError);
        return res.status(500).json({ error: "Failed to save score" });
      }

      // Calculate percentiles
      const stats = await calculateLeaderboardStats(
        supabase,
        pastaDate,
        sessionId,
        totalScore
      );

      // Track analytics
      const posthog = PostHogClient();
      try {
        await posthog.capture({
          distinctId: sessionId,
          event: "pasta_leaderboard_score_submitted",
          properties: {
            pastaDate,
            totalScore,
            percentile: stats.todayRank.percentile,
            pastaScore,
            sauceScore,
            regionScore,
            proteinScore,
          },
        });
      } catch (error) {
        console.error("PostHog capture error:", error);
      }

      return res.status(200).json(stats);
    } catch (error) {
      console.error("Error in POST /api/pasta/leaderboard:", error);
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
        .from("pasta_leaderboard")
        .select("*")
        .eq("pasta_date", targetDate)
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
      console.error("Error in GET /api/pasta/leaderboard:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

async function calculateLeaderboardStats(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  pastaDate: string,
  sessionId: string,
  userScore: number
): Promise<PastaLeaderboardStats> {
  // Get all scores for today
  const { data: todayScores } = await supabase
    .from("pasta_leaderboard")
    .select("total_score")
    .eq("pasta_date", pastaDate);

  // Get all scores overall
  const { data: allScores } = await supabase
    .from("pasta_leaderboard")
    .select("total_score");

  // Get user's specific scores for today
  const { data: userTodayScore } = await supabase
    .from("pasta_leaderboard")
    .select("*")
    .eq("pasta_date", pastaDate)
    .eq("session_id", sessionId)
    .single();

  const todayScoreValues = (todayScores?.map((s: { total_score: number }) =>
    Number(s.total_score)
  ) || []) as number[];
  const allScoreValues = (allScores?.map((s: { total_score: number }) =>
    Number(s.total_score)
  ) || []) as number[];

  // Calculate percentiles from REAL scores only
  const todayPercentile = calculatePercentile(userScore, todayScoreValues);
  const overallPercentile = calculatePercentile(userScore, allScoreValues);

  // Calculate rank (position in sorted list)
  const todayRank = todayScoreValues.filter((s) => s > userScore).length + 1;

  return {
    todayRank: {
      pastaScore: Number(userTodayScore?.pasta_score || 0),
      sauceScore: Number(userTodayScore?.sauce_score || 0),
      regionScore: Number(userTodayScore?.region_score || 0),
      proteinScore: Number(userTodayScore?.protein_score || 0),
      totalScore: userScore,
      percentile: todayPercentile,
      rank: todayRank,
    },
    overallRank: {
      pastaScore: Number(userTodayScore?.pasta_score || 0),
      sauceScore: Number(userTodayScore?.sauce_score || 0),
      regionScore: Number(userTodayScore?.region_score || 0),
      proteinScore: Number(userTodayScore?.protein_score || 0),
      totalScore: userScore,
      percentile: overallPercentile,
    },
  };
}
