import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import { Dish, enrichDishesWithCoords } from "../../../public/data/dishes";
import PostHogClient from "../../lib/posthog";
import { getCountryCoordsMap } from "../../utils/countries";
import { getDailySalt, obfuscateData } from "../../utils/encryption";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Content-Type-Options", "nosniff");

  try {
    let enrichedDish: Dish;

    // Try Supabase first, fallback to JSON file
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      // Use Supabase (preferred method with randomized image URLs)
      console.log("🔒 Using Supabase database (secure)");
      const supabase = createClient(supabaseUrl, supabaseKey);

      const today = new Date().toISOString().split("T")[0];

      const { data: dishes, error } = await supabase
        .from("dishes")
        .select("*")
        .eq("release_date", today)
        .limit(1);

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!dishes || dishes.length === 0) {
        return res.status(404).json({ error: "No dish available for today" });
      }

      const todaysDish = dishes[0];

      // Convert Supabase dish format to our Dish interface
      const dish: Dish = {
        name: todaysDish.name,
        acceptableGuesses: todaysDish.acceptable_guesses || [],
        country: todaysDish.country,
        imageUrl: todaysDish.image_url, // This has the randomized filename!
        ingredients: todaysDish.ingredients || [],
        blurb: todaysDish.blurb || "",
        proteinPerServing: todaysDish.protein_per_serving,
        recipe: {
          ingredients: todaysDish.recipe_ingredients || [],
          instructions: todaysDish.recipe_instructions || [],
        },
        tags: todaysDish.tags || [],
        region: todaysDish.region,
        releaseDate: todaysDish.release_date,
        coordinates: todaysDish.coordinates
          ? {
              lat: todaysDish.coordinates.lat || todaysDish.latitude,
              lng: todaysDish.coordinates.lng || todaysDish.longitude,
            }
          : undefined,
      };

      // Enrich the dish with coordinates if not already present
      const countryCoords = getCountryCoordsMap();
      const enrichedDishes = enrichDishesWithCoords([dish], countryCoords);
      enrichedDish = enrichedDishes[0];
    } else {
      // Fallback to JSON file (temporary - has revealing image names)
      console.log(
        "⚠️  Using JSON fallback (less secure - revealing image names)"
      );

      const filePath = path.join(process.cwd(), "src/data/sample_dishes.json");
      const fileContents = await fs.readFile(filePath, "utf8");
      const dishes = JSON.parse(fileContents);

      // Get today's date and filter for today's dish
      const today = new Date().toISOString().split("T")[0];
      const todaysDish = dishes.find(
        (dish: Dish) => dish.releaseDate === today
      );

      if (!todaysDish) {
        return res.status(404).json({ error: "No dish available for today" });
      }

      // Enrich the dish with coordinates
      const countryCoords = getCountryCoordsMap();
      const enrichedDishes = enrichDishesWithCoords(
        [todaysDish],
        countryCoords
      );
      enrichedDish = enrichedDishes[0];
    }

    // Get today's salt
    const salt = getDailySalt();

    // Process only today's dish
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

    // Return only today's dish with sensitive fields removed and obfuscated data added
    const safeDish = {
      // Keep only non-sensitive visual data
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
          count: 1,
          source: supabaseUrl && supabaseKey ? "supabase" : "json_fallback",
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
