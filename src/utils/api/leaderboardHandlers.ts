import { calculatePercentile } from "@/utils/scoreCalculator";
import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";
import PostHogClient from "@/lib/posthog";

export interface LeaderboardConfig {
  tableName: string;
  dateField: string;
  idField: string;
  scoreFields: Record<string, string>;
  guessFields: Record<string, string>;
  analyticsEvent: string;
  validateScores?: (scores: Record<string, number>) => boolean;
}

const submissionCache = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000;

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const lastSubmission = submissionCache.get(sessionId);

  if (lastSubmission && now - lastSubmission < RATE_LIMIT_WINDOW) {
    return false;
  }

  submissionCache.set(sessionId, now);
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [sessionId, timestamp] of submissionCache.entries()) {
    if (now - timestamp > RATE_LIMIT_WINDOW) {
      submissionCache.delete(sessionId);
    }
  }
}, RATE_LIMIT_WINDOW);

export async function handleScoreSubmission(
  req: NextApiRequest,
  res: NextApiResponse,
  config: LeaderboardConfig
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.status(500).json({ error: "Database configuration error" });
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = req.body;
    const date = body[`${Object.keys(config.scoreFields)[0].replace('Score', '')}Date`];
    const itemId = body[`${Object.keys(config.scoreFields)[0].replace('Score', '')}Id`];
    const { sessionId, totalScore } = body;

    const scores: Record<string, number> = {};
    const guesses: Record<string, number> = {};

    for (const [phaseKey, dbField] of Object.entries(config.scoreFields)) {
      scores[phaseKey] = body[phaseKey];
    }

    for (const [phaseKey, dbField] of Object.entries(config.guessFields)) {
      guesses[phaseKey] = body[phaseKey];
    }

    if (!date || !sessionId || totalScore === undefined) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    if (config.validateScores && !config.validateScores(scores)) {
      res.status(400).json({ error: "Invalid score values" });
      return;
    }

    if (!checkRateLimit(sessionId)) {
      res.status(429).json({ error: "Too many submissions. Please try again later." });
      return;
    }

    const { data: existingScore } = await supabase
      .from(config.tableName)
      .select("id")
      .eq(config.dateField, date)
      .eq("session_id", sessionId)
      .single();

    if (existingScore) {
      res.status(400).json({
        error: "Score already submitted for this date",
        code: "ALREADY_SUBMITTED",
      });
      return;
    }

    const scoreData: Record<string, any> = {
      [config.dateField]: date,
      [config.idField]: itemId || null,
      session_id: sessionId,
      total_score: totalScore,
    };

    for (const [phaseKey, dbField] of Object.entries(config.scoreFields)) {
      scoreData[dbField] = scores[phaseKey];
    }

    for (const [phaseKey, dbField] of Object.entries(config.guessFields)) {
      scoreData[dbField] = guesses[phaseKey];
    }

    const { error: insertError } = await supabase
      .from(config.tableName)
      .insert(scoreData);

    if (insertError) {
      console.error("Error inserting score:", insertError);
      res.status(500).json({ error: "Failed to save score" });
      return;
    }

    const stats = await calculateLeaderboardStats(
      supabase,
      config,
      date,
      sessionId,
      totalScore
    );

    const posthog = PostHogClient();
    if (posthog) {
      try {
        await posthog.capture({
          distinctId: sessionId,
          event: config.analyticsEvent,
          properties: {
            date,
            totalScore,
            percentile: stats.todayRank.percentile,
            ...scores,
          },
        });
      } catch (error) {
        console.error("PostHog capture error:", error);
      }
    }

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error in leaderboard submission:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function handleLeaderboardStats(
  req: NextApiRequest,
  res: NextApiResponse,
  config: LeaderboardConfig
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.status(500).json({ error: "Database configuration error" });
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { date, sessionId } = req.query;

    if (!sessionId || typeof sessionId !== "string") {
      res.status(400).json({ error: "Session ID required" });
      return;
    }

    const targetDate =
      typeof date === "string"
        ? date
        : new Date().toISOString().split("T")[0];

    const { data: userScore } = await supabase
      .from(config.tableName)
      .select("*")
      .eq(config.dateField, targetDate)
      .eq("session_id", sessionId)
      .single();

    if (!userScore) {
      res.status(404).json({
        error: "No score found for this date",
        code: "NO_SCORE",
      });
      return;
    }

    const stats = await calculateLeaderboardStats(
      supabase,
      config,
      targetDate,
      sessionId,
      userScore.total_score
    );

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error in leaderboard stats retrieval:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function calculateLeaderboardStats(
  supabase: any,
  config: LeaderboardConfig,
  date: string,
  sessionId: string,
  userScore: number
) {
  const { data: todayScores } = await supabase
    .from(config.tableName)
    .select("total_score")
    .eq(config.dateField, date);

  const { data: allScores } = await supabase
    .from(config.tableName)
    .select("total_score");

  const { data: userTodayScore } = await supabase
    .from(config.tableName)
    .select("*")
    .eq(config.dateField, date)
    .eq("session_id", sessionId)
    .single();

  const todayScoreValues = (todayScores?.map((s: { total_score: number }) =>
    Number(s.total_score)
  ) || []) as number[];
  const allScoreValues = (allScores?.map((s: { total_score: number }) =>
    Number(s.total_score)
  ) || []) as number[];

  const todayPercentile = calculatePercentile(userScore, todayScoreValues);
  const overallPercentile = calculatePercentile(userScore, allScoreValues);
  const todayRank = todayScoreValues.filter((s) => s > userScore).length + 1;

  const todayRankScores: Record<string, number> = {};
  const overallRankScores: Record<string, number> = {};

  for (const [phaseKey, dbField] of Object.entries(config.scoreFields)) {
    todayRankScores[phaseKey] = Number(userTodayScore?.[dbField] || 0);
    overallRankScores[phaseKey] = Number(userTodayScore?.[dbField] || 0);
  }

  return {
    todayRank: {
      ...todayRankScores,
      totalScore: userScore,
      percentile: todayPercentile,
      rank: todayRank,
    },
    overallRank: {
      ...overallRankScores,
      totalScore: userScore,
      percentile: overallPercentile,
    },
  };
}
