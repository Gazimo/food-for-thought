import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { getCountryCoordsMap } from "../src/utils/countries";
import RecipeDataFetcher from "../src/utils/recipeDataFetcher";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  if (!supabaseUrl) console.error("  - NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseServiceKey) console.error("  - SUPABASE_SERVICE_ROLE_KEY");
  console.error("\nPlease check your .env.local file.");
  process.exit(1);
}

class SmartDishGenerator {
  private fetcher: RecipeDataFetcher;
  private supabase: any;

  constructor() {
    this.fetcher = new RecipeDataFetcher();
    this.supabase = createClient(supabaseUrl!, supabaseServiceKey!);
  }

  async generateAndSaveDish(dishName: string): Promise<void> {
    console.log(`🚀 Smart AI generation for: "${dishName}"`);
    console.log("=".repeat(50));

    try {
      // Step 1: Generate complete dish data using AI
      const dishData = await this.fetcher.fetchDishData(dishName);
      if (!dishData) {
        throw new Error("Failed to generate complete dish data using AI");
      }

      console.log(`✅ Complete dish data generated using AI`);

      // Step 2: Calculate next release date
      const releaseDate = await this.getNextReleaseDate();
      (dishData as any).releaseDate = releaseDate;
      console.log(`📅 Release date: ${releaseDate}`);

      // Step 3: Add coordinates based on country
      const coordinates = this.getCountryCoordinates(dishData.country || "");

      // Step 4: Display final data for review
      console.log("\n📊 FINAL DISH DATA:");
      console.log("===================");
      console.log(`Name: ${dishData.name}`);
      console.log(`Country: ${dishData.country}`);
      console.log(
        `Ingredients (${
          dishData.ingredients?.length
        }): ${dishData.ingredients?.join(", ")}`
      );
      console.log(
        `Acceptable Guesses: ${dishData.acceptableGuesses?.join(", ")}`
      );
      console.log(`Protein: ${dishData.proteinPerServing || "N/A"}g`);
      console.log(`Tags: ${dishData.tags?.join(", ")}`);
      console.log(`Release Date: ${(dishData as any).releaseDate}`);
      console.log(`Blurb: ${dishData.blurb}`);

      if (dishData.recipe) {
        console.log(
          `Recipe: ${dishData.recipe.ingredients?.length || 0} ingredients, ${
            dishData.recipe.instructions?.length || 0
          } steps`
        );
      }

      // Step 5: Save to database
      await this.saveDishToDatabase(dishData as any, coordinates);

      console.log(
        "\n🎉 SUCCESS! High-quality dish generated and saved to database!"
      );
      console.log(
        "🎯 Ready for game play immediately - no manual review needed!"
      );
    } catch (error) {
      console.error("💥 Error:", error);
      process.exit(1);
    }
  }

  private async getNextReleaseDate(): Promise<string> {
    try {
      // Get the latest release date from the database
      const { data, error } = await this.supabase
        .from("dishes")
        .select("release_date")
        .order("release_date", { ascending: false })
        .limit(1);

      if (error) {
        console.warn("⚠️ Could not fetch latest release date, using today");
        return new Date().toISOString().split("T")[0];
      }

      if (!data || data.length === 0) {
        console.log("📅 No existing dishes, starting from today");
        return new Date().toISOString().split("T")[0];
      }

      // Add one day to the latest release date
      const latestDate = new Date(data[0].release_date);
      latestDate.setDate(latestDate.getDate() + 1);

      const nextDate = latestDate.toISOString().split("T")[0];
      console.log(`📅 Next available date after latest: ${nextDate}`);

      return nextDate;
    } catch (error) {
      console.warn("⚠️ Error calculating next release date:", error);
      return new Date().toISOString().split("T")[0];
    }
  }

  private getCountryCoordinates(
    country: string
  ): { lat: number; lng: number } | null {
    const countryCoords = getCountryCoordsMap();
    const normalizedCountry = country.toLowerCase().replace(/\s+/g, "");

    // Try exact match first
    if (countryCoords[normalizedCountry]) {
      return countryCoords[normalizedCountry];
    }

    // Try partial matches
    for (const [countryKey, coords] of Object.entries(countryCoords)) {
      if (
        countryKey.includes(normalizedCountry) ||
        normalizedCountry.includes(countryKey)
      ) {
        return coords;
      }
    }

    console.warn(`⚠️ Coordinates not found for: ${country}`);
    return null;
  }

  private async saveDishToDatabase(
    dishData: any,
    coordinates: { lat: number; lng: number } | null
  ): Promise<void> {
    try {
      const dishToInsert = {
        name: dishData.name,
        acceptable_guesses: dishData.acceptableGuesses,
        country: dishData.country,
        image_url: dishData.imageUrl || null,
        ingredients: dishData.ingredients,
        blurb: dishData.blurb,
        protein_per_serving: dishData.proteinPerServing || 0,
        recipe: dishData.recipe,
        tags: dishData.tags || [],
        release_date: dishData.releaseDate,
        coordinates: coordinates
          ? `(${coordinates.lng},${coordinates.lat})`
          : null,
        region: null,
      };

      console.log("\n💾 Saving to database...");

      const { data, error } = await this.supabase
        .from("dishes")
        .insert([dishToInsert])
        .select();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      console.log(`✅ Dish saved with ID: ${data[0]?.id}`);

      if (coordinates) {
        console.log(
          `🗺️ Coordinates added: ${coordinates.lat}, ${coordinates.lng}`
        );
      }
    } catch (error) {
      throw new Error(`Failed to save to database: ${error}`);
    }
  }
}

async function main() {
  const dishName = process.argv[2];

  if (!dishName) {
    console.error("❌ Please provide a dish name");
    console.log('Usage: npm run smart-generate "Dish Name"');
    console.log('Example: npm run smart-generate "Chicken Tikka Masala"');
    process.exit(1);
  }

  const generator = new SmartDishGenerator();
  await generator.generateAndSaveDish(dishName);
}

main().catch(console.error);