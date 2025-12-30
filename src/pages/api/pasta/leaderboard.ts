import { NextApiRequest, NextApiResponse } from "next";
import {
  handleScoreSubmission,
  handleLeaderboardStats
} from "@/utils/api/leaderboardHandlers";
import { pastaLeaderboardConfig } from "@/utils/api/leaderboardConfigs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    return handleScoreSubmission(req, res, pastaLeaderboardConfig);
  }
  if (req.method === "GET") {
    return handleLeaderboardStats(req, res, pastaLeaderboardConfig);
  }
  return res.status(405).json({ error: "Method not allowed" });
}
