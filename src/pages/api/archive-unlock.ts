import { NextApiRequest, NextApiResponse } from "next";

interface UnlockRequest {
  localDate: string; // YYYY-MM-DD format
  tzOffsetMinutes: number; // timezone offset in minutes
}

interface UnlockTokenPayload {
  grantedOn: string; // YYYY-MM-DD in user's local calendar
  tzOffset: number;
  iat: number; // issued at
  exp: number; // expires at
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { localDate, tzOffsetMinutes }: UnlockRequest = req.body;

    // Validate input
    if (!localDate || typeof tzOffsetMinutes !== "number") {
      return res.status(400).json({
        error: "Missing required fields: localDate, tzOffsetMinutes",
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(localDate)) {
      return res.status(400).json({
        error: "Invalid date format. Expected YYYY-MM-DD",
      });
    }

    // Verify that the provided localDate is actually "today" in user's timezone
    const now = new Date();
    const userToday = new Date(now.getTime() - tzOffsetMinutes * 60 * 1000);
    const userTodayString = userToday.toISOString().split("T")[0];

    if (localDate !== userTodayString) {
      return res.status(400).json({
        error: "Can only unlock archives by sharing today's results",
        code: "NOT_TODAY",
      });
    }

    // Create token payload
    const now_timestamp = Date.now();
    const expires_timestamp = now_timestamp + 24 * 60 * 60 * 1000; // 24 hours

    const tokenPayload: UnlockTokenPayload = {
      grantedOn: localDate,
      tzOffset: tzOffsetMinutes,
      iat: now_timestamp,
      exp: expires_timestamp,
    };

    // In a real implementation, you'd sign this with a secret key
    // For now, we'll use a simple base64 encoding (NOT secure for production)
    const token = Buffer.from(JSON.stringify(tokenPayload)).toString("base64");

    // Set HTTP-only cookie
    res.setHeader("Set-Cookie", [
      `f4t_archives_unlock=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${
        24 * 60 * 60
      }`,
    ]);

    return res.status(200).json({
      success: true,
      expiresAt: expires_timestamp,
      message: "Archives unlocked for 24 hours",
    });
  } catch (error) {
    console.error("Archive unlock error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
