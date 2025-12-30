import { NextApiRequest, NextApiResponse } from "next";
import {
  handleScoreSubmission,
  handleLeaderboardStats
} from "@/utils/api/leaderboardHandlers";
import { fftLeaderboardConfig } from "@/utils/api/leaderboardConfigs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    return handleScoreSubmission(req, res, fftLeaderboardConfig);
  }
  if (req.method === "GET") {
    return handleLeaderboardStats(req, res, fftLeaderboardConfig);
  }
  return res.status(405).json({ error: "Method not allowed" });
}
