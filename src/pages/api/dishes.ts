import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";
import PostHogClient from "../../lib/posthog";
import { Dish, enrichDishesWithCoords } from "../../types/dishes";
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials");
    return res.status(500).json({ error: "Database configuration error" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const today = new Date().toISOString().split("T")[0];

    const { data: dishes, error } = await supabase
      .from("dishes")
      .select("*")
      .eq("release_date", today)
      .limit(1);

    if (error) {
      console.error("❌ Supabase error:", error);
      return res.status(500).json({ error: "Failed to fetch dish data" });
    }

    if (!dishes || dishes.length === 0) {
      return res.status(404).json({ error: "No dish available for today" });
    }

    const dishData = dishes[0];

    const dish: Dish = {
      name: dishData.name,
      acceptableGuesses: dishData.acceptable_guesses || [],
      country: dishData.country,
      imageUrl: dishData.image_url || "",
      ingredients: dishData.ingredients || [],
      blurb: dishData.blurb || "",
      proteinPerServing: dishData.protein_per_serving,
      recipe: {
        ingredients: dishData.recipe?.ingredients || [],
        instructions: dishData.recipe?.instructions || [],
      },
      tags: dishData.tags || [],
      region: dishData.region || undefined,
      releaseDate: dishData.release_date,
      coordinates: dishData.coordinates
        ? {
            lat: dishData.coordinates.lat || dishData.latitude,
            lng: dishData.coordinates.lng || dishData.longitude,
          }
        : undefined,
    };

    const countryCoords = getCountryCoordsMap();
    const enrichedDish = enrichDishesWithCoords([dish], countryCoords)[0];

    const salt = getDailySalt();
    const obfuscatedAnswers = obfuscateData(
      {
        name: enrichedDish.name,
        country: enrichedDish.country,
        acceptableGuesses: enrichedDish.acceptableGuesses,
        proteinPerServing: enrichedDish.proteinPerServing,
        ingredients: enrichedDish.ingredients,
        recipe: enrichedDish.recipe,
        blurb: enrichedDish.blurb,
        imageUrl: enrichedDish.imageUrl,
        releaseDate: enrichedDish.releaseDate,
        coordinates: enrichedDish.coordinates,
      },
      salt
    );

    const safeDish = {
      tags: enrichedDish.tags,
      region: enrichedDish.region,
      _encrypted: obfuscatedAnswers,
      _salt: salt,
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
        },
      });
    } catch (error) {
      console.error("PostHog capture error:", error);
    }

    res.setHeader("X-Robots-Tag", "noindex, nofollow, nosnippet, noarchive");
    res.setHeader("Referrer-Policy", "no-referrer");

    res.status(200).json([safeDish]);
  } catch (error) {
    console.error("❌ API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
