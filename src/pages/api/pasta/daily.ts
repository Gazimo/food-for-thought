import { Pasta, PastaRow, pastaRowToPasta } from "@/types/pasta";
import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";
import PostHogClient from "../../../lib/posthog";
import { validateArchiveAccess } from "../../../utils/archiveAuth";
import { getDailySalt, obfuscateData } from "../../../utils/encryption";
import { getArchiveConfigById } from "../../../utils/archiveConfig";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { date } = req.query;
  const requestedDate = typeof date === "string" ? date : null;

  // Calculate expiry time for the cache. The data is for the whole day,
  // so we can cache it until the next day.
  const now = new Date();
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );
  const secondsUntilTomorrow = Math.floor(
    (tomorrow.getTime() - now.getTime()) / 1000
  );

  // Set aggressive caching headers for the CDN.
  // s-maxage tells the CDN how long to cache.
  // stale-while-revalidate tells it to serve stale content while fetching a new version.
  res.setHeader(
    "Cache-Control",
    `public, s-maxage=${secondsUntilTomorrow}, stale-while-revalidate=60`
  );
  // Add a security header back.
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials");
    return res.status(500).json({ error: "Database configuration error" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Determine which date to fetch - either requested date or today
    const targetDate = requestedDate || new Date().toISOString().split("T")[0];

    // If requesting archived content, validate date format and check access
    if (requestedDate) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(requestedDate)) {
        return res
          .status(400)
          .json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }

      // Check if date is not in the future
      const today = new Date().toISOString().split("T")[0];
      if (requestedDate > today) {
        return res.status(400).json({ error: "Cannot request future dates" });
      }

      // Validate archive access token (using pasta-specific cookie)
      const archiveConfig = getArchiveConfigById("italian-pasta");
      const validation = validateArchiveAccess(req, requestedDate, archiveConfig.cookieName);
      if (!validation.isValid) {
        console.log(`🚫 Archive validation failed: ${validation.error}`);
        return res.status(403).json({
          error: validation.error,
          code: validation.code,
        });
      }
    }

    console.log(`🔍 Fetching pasta for date: ${targetDate}`);

    const { data: pastaData, error } = await supabase
      .from("pasta")
      .select("*")
      .eq("release_date", targetDate)
      .limit(1);

    if (error) {
      console.error("❌ Supabase error:", error);
      return res.status(500).json({ error: "Failed to fetch pasta data" });
    }

    if (!pastaData || pastaData.length === 0) {
      console.log(`⚠️ No pasta found for date: ${targetDate}`);

      // For archive requests, provide a more specific error message
      if (requestedDate) {
        return res.status(404).json({
          error: `No archived game available for ${requestedDate}. This date may be before our game archive began.`,
          code: "ARCHIVE_DATE_NOT_AVAILABLE",
        });
      }

      return res.status(404).json({ error: "No pasta available for today" });
    }

    const targetPastaRow = pastaData[0] as PastaRow;
    console.log(
      `✅ Found pasta for ${targetDate}: ID ${targetPastaRow.id}, Name: ${
        targetPastaRow.name || "[encrypted]"
      }`
    );

    // Ensure we're not accidentally serving today's pasta for archive dates
    if (requestedDate && targetPastaRow.release_date !== requestedDate) {
      console.log(
        `⚠️ Pasta release_date (${targetPastaRow.release_date}) doesn't match requested date (${requestedDate})`
      );
      return res.status(404).json({
        error: `No archived game available for ${requestedDate}. This date may be before our game archive began.`,
        code: "ARCHIVE_DATE_NOT_AVAILABLE",
      });
    }

    // Convert database row to application type
    const pasta: Pasta = pastaRowToPasta(targetPastaRow);

    // Get salt for the target date (today or archived date)
    const salt = getDailySalt(targetDate);

    // Process the target pasta (today or archived)
    const sensitiveData = {
      name: pasta.name,
      acceptableGuesses: pasta.acceptableGuesses,
      pastaAbout: pasta.pastaAbout,
      pastaImageUrl: pasta.pastaImageUrl,
      sauceName: pasta.sauceName,
      sauceAcceptableGuesses: pasta.sauceAcceptableGuesses,
      sauceIngredients: pasta.sauceIngredients,
      sauceInstructions: pasta.sauceInstructions,
      sauceImageUrl: pasta.sauceImageUrl,
      region: pasta.region,
      regionCoordinates: pasta.regionCoordinates,
      proteinPerServing: pasta.proteinPerServing,
      originStory: pasta.originStory,
      funFact: pasta.funFact,
      releaseDate: pasta.releaseDate,
    };

    // Create obfuscated version of sensitive data
    const obfuscatedAnswers = obfuscateData(sensitiveData, salt);

    // Return the target pasta with sensitive fields removed and obfuscated data added
    const safePasta = {
      // Keep only non-sensitive visual data
      id: targetPastaRow.id, // Add database ID for tile APIs

      // Add obfuscated sensitive data
      _encrypted: obfuscatedAnswers,
      _salt: salt,

      // Add random dummy field to prevent pattern analysis
      _checksum: Math.random().toString(36).substring(7),
    };

    const posthog = PostHogClient();
    if (posthog) {
      try {
        await posthog.capture({
          distinctId: req.headers.cookie || "anonymous",
          event: "api_pasta_daily_retrieved",
          properties: {
            method: req.method,
            endpoint: req.url,
            date: targetDate,
            isArchive: !!requestedDate,
          },
        });
      } catch (error) {
        console.error("PostHog capture error:", error);
      }
    }

    // Add additional security headers to prevent inspection
    res.setHeader("X-Robots-Tag", "noindex, nofollow, nosnippet, noarchive");
    res.setHeader("Referrer-Policy", "no-referrer");

    // Return as an object (not array like dishes endpoint)
    res.status(200).json(safePasta);
  } catch (error) {
    console.error("❌ API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
