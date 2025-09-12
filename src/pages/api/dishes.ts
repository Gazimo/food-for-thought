import { Dish, enrichDishesWithCoords } from "@/types/dishes";
import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";
import PostHogClient from "../../lib/posthog";
import { validateArchiveAccess } from "../../utils/archiveAuth";
import { getCountryCoordsMap } from "../../utils/countries";
import { getDailySalt, obfuscateData } from "../../utils/encryption";

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

      // Validate archive access token
      const validation = validateArchiveAccess(req, requestedDate);
      if (!validation.isValid) {
        console.log(`🚫 Archive validation failed: ${validation.error}`);
        return res.status(403).json({
          error: validation.error,
          code: validation.code,
        });
      }
    }

    console.log(`🔍 Fetching dish for date: ${targetDate}`);

    const { data: dishes, error } = await supabase
      .from("dishes")
      .select("*")
      .eq("release_date", targetDate)
      .limit(1);

    if (error) {
      console.error("❌ Supabase error:", error);
      return res.status(500).json({ error: "Failed to fetch dish data" });
    }

    if (!dishes || dishes.length === 0) {
      console.log(`⚠️ No dish found for date: ${targetDate}`);

      // For archive requests, provide a more specific error message
      if (requestedDate) {
        return res.status(404).json({
          error: `No archived game available for ${requestedDate}. This date may be before our game archive began.`,
          code: "ARCHIVE_DATE_NOT_AVAILABLE",
        });
      }

      return res.status(404).json({ error: "No dish available for today" });
    }

    const targetDish = dishes[0];
    console.log(
      `✅ Found dish for ${targetDate}: ID ${targetDish.id}, Name: ${
        targetDish.name || "[encrypted]"
      }`
    );

    // Ensure we're not accidentally serving today's dish for archive dates
    if (requestedDate && targetDish.release_date !== requestedDate) {
      console.log(
        `⚠️ Dish release_date (${targetDish.release_date}) doesn't match requested date (${requestedDate})`
      );
      return res.status(404).json({
        error: `No archived game available for ${requestedDate}. This date may be before our game archive began.`,
        code: "ARCHIVE_DATE_NOT_AVAILABLE",
      });
    }

    // Convert Supabase dish format to our Dish interface
    const dish: Dish = {
      name: targetDish.name,
      acceptableGuesses: targetDish.acceptable_guesses || [],
      country: targetDish.country,
      imageUrl: targetDish.image_url, // This now has the randomized filename!
      ingredients: targetDish.ingredients || [],
      blurb: targetDish.blurb || "",
      proteinPerServing: targetDish.protein_per_serving,
      recipe: {
        ingredients: targetDish.recipe?.ingredients || [],
        instructions: targetDish.recipe?.instructions || [],
      },
      tags: targetDish.tags || [],
      region: targetDish.region,
      releaseDate: targetDish.release_date,
      coordinates: targetDish.coordinates
        ? {
            lat: targetDish.coordinates.lat || targetDish.latitude,
            lng: targetDish.coordinates.lng || targetDish.longitude,
          }
        : undefined,
    };

    // Enrich the dish with coordinates if not already present
    const countryCoords = getCountryCoordsMap();
    const enrichedDishes = enrichDishesWithCoords([dish], countryCoords);
    const enrichedDish = enrichedDishes[0];

    // Get salt for the target date (today or archived date)
    const salt = getDailySalt(targetDate);

    // Process the target dish (today or archived)
    const sensitiveData = {
      name: enrichedDish.name,
      country: enrichedDish.country,
      acceptableGuesses: enrichedDish.acceptableGuesses,
      proteinPerServing: enrichedDish.proteinPerServing,
      // Also hide ingredients and recipe as they can give hints
      ingredients: enrichedDish.ingredients,
      recipe: enrichedDish.recipe,
      blurb: enrichedDish.blurb,
      // Hide imageUrl and releaseDate as they can give away the answer
      imageUrl: enrichedDish.imageUrl,
      releaseDate: enrichedDish.releaseDate,
      // Hide coordinates as they're a dead giveaway for the country
      coordinates: enrichedDish.coordinates,
    };

    // Create obfuscated version of sensitive data
    const obfuscatedAnswers = obfuscateData(sensitiveData, salt);

    // Return the target dish with sensitive fields removed and obfuscated data added
    const safeDish = {
      // Keep only non-sensitive visual data
      id: targetDish.id, // Add database ID for tile APIs
      tags: enrichedDish.tags,
      region: enrichedDish.region,

      // Add obfuscated sensitive data
      _encrypted: obfuscatedAnswers,
      _salt: salt,

      // Add random dummy field to prevent pattern analysis
      _checksum: Math.random().toString(36).substring(7),
    };

    const posthog = PostHogClient();
    try {
      await posthog.capture({
        distinctId: req.headers.cookie || "anonymous",
        event: "api_dishes_retrieved",
        properties: {
          method: req.method,
          endpoint: req.url,
          count: 1, // Always 1 dish now
        },
      });
    } catch (error) {
      console.error("PostHog capture error:", error);
    }

    // Add additional security headers to prevent inspection
    res.setHeader("X-Robots-Tag", "noindex, nofollow, nosnippet, noarchive");
    res.setHeader("Referrer-Policy", "no-referrer");

    // Return as an array with a single dish for consistency
    res.status(200).json([safeDish]);
  } catch (error) {
    console.error("❌ API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
