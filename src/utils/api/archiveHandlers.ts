import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export async function handleAvailableDates(
  req: NextApiRequest,
  res: NextApiResponse,
  tableName: string
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials");
    return res.status(500).json({ error: "Database configuration error" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const today = new Date();
    const earliestDate = new Date();
    earliestDate.setDate(today.getDate() - 30);

    const todayStr = today.toISOString().split("T")[0];
    const earliestDateStr = earliestDate.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from(tableName)
      .select("release_date")
      .gte("release_date", earliestDateStr)
      .lte("release_date", todayStr)
      .order("release_date", { ascending: true });

    if (error) {
      console.error("❌ Supabase error:", error);
      return res.status(500).json({ error: "Failed to fetch available dates" });
    }

    const dates = data
      ? data.map((row: { release_date: string }) => row.release_date)
      : [];

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=60");
    return res.status(200).json({ dates });
  } catch (error) {
    console.error("❌ Error fetching available dates:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function handleArchiveUnlock(
  req: NextApiRequest,
  res: NextApiResponse,
  cookieName: string
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { localDate, tzOffsetMinutes } = req.body;

    if (!localDate || typeof tzOffsetMinutes !== "number") {
      return res.status(400).json({
        error: "Missing required fields: localDate, tzOffsetMinutes"
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(localDate)) {
      return res.status(400).json({
        error: "Invalid date format. Expected YYYY-MM-DD",
      });
    }

    const now = new Date();
    const userToday = new Date(now.getTime() - tzOffsetMinutes * 60 * 1000);
    const userTodayString = userToday.toISOString().split("T")[0];

    if (localDate !== userTodayString) {
      return res.status(400).json({
        error: "Can only unlock archives by sharing today's results",
        code: "NOT_TODAY",
      });
    }

    const now_timestamp = Date.now();
    const expires_timestamp = now_timestamp + 24 * 60 * 60 * 1000;

    const tokenPayload = {
      grantedOn: localDate,
      tzOffset: tzOffsetMinutes,
      iat: now_timestamp,
      exp: expires_timestamp,
    };

    const token = Buffer.from(JSON.stringify(tokenPayload)).toString("base64");

    res.setHeader("Set-Cookie", [
      `${cookieName}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${
        24 * 60 * 60
      }`,
    ]);

    return res.status(200).json({
      success: true,
      expiresAt: expires_timestamp,
      message: "Archives unlocked for 24 hours",
    });
  } catch (error) {
    console.error("❌ Archive unlock error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
