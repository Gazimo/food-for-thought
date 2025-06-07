import { NextApiRequest, NextApiResponse } from "next";
import { Dish, enrichDishesWithCoords } from "../../../public/data/dishes";
import PostHogClient from "../../lib/posthog";
import supabase from "../../lib/supabase";
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
    const today = new Date().toISOString().split("T")[0];

    const { data: dishData, error } = await supabase
      .from("dishes")
      .select("*")
      .eq("release_date", today)
      .single();

    if (error) {
      console.error("Database error:", error);
      return res.status(404).json({ error: "No dish available for today" });
    }

    if (!dishData) {
      return res.status(404).json({ error: "No dish available for today" });
    }

    const todaysDish: Dish = {
      name: dishData.name,
      acceptableGuesses: dishData.acceptable_guesses,
      country: dishData.country,
      imageUrl: dishData.image_url || "",
      ingredients: dishData.ingredients,
      blurb: dishData.blurb,
      proteinPerServing: dishData.protein_per_serving,
      recipe: dishData.recipe,
      tags: dishData.tags,
      releaseDate: dishData.release_date,
      coordinates: dishData.coordinates
        ? {
            lat: parseFloat(
              dishData.coordinates.toString().split(",")[1].replace(")", "")
            ),
            lng: parseFloat(
              dishData.coordinates.toString().split(",")[0].replace("(", "")
            ),
          }
        : undefined,
      region: dishData.region || undefined,
    };

    const countryCoords = getCountryCoordsMap();
    const enrichedDishes = enrichDishesWithCoords([todaysDish], countryCoords);
    const enrichedDish = enrichedDishes[0];

    const salt = getDailySalt();

    const sensitiveData = {
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
    };

    const obfuscatedAnswers = obfuscateData(sensitiveData, salt);

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
    console.error("API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
