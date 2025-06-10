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

// Country detection mapping
const DISH_COUNTRY_MAP: Record<string, string> = {
  // Italian dishes
  carbonara: "italy",
  "spaghetti carbonara": "italy",
  "pasta carbonara": "italy",
  ratatouille: "france",
  "coq au vin": "france",
  "beef bourguignon": "france",
  moussaka: "greece",
  paella: "spain",
  "paella valenciana": "spain",
  goulash: "hungary",
  "fish and chips": "united kingdom",
  "shepherd's pie": "united kingdom",
  "chicken tikka masala": "india",
  "thai green curry": "thailand",
  "tom yum goong": "thailand",
  "pho bo": "vietnam",
  pho: "vietnam",
  bibimbap: "south korea",
  sushi: "japan",
  "peking duck": "china",
  "beef stroganoff": "russia",
  ceviche: "peru",
  "lamb tagine": "morocco",
  "chicken parmigiana": "italy",
};

// Blurb templates by cuisine
const BLURB_TEMPLATES: Record<
  string,
  (dishName: string, ingredients: string[]) => string
> = {
  italy: (dishName: string, ingredients: string[]) =>
    `A classic Italian dish featuring ${ingredients
      .slice(0, 3)
      .join(
        ", "
      )}. This beloved comfort food brings authentic flavors from the heart of Italy to your table.`,

  france: (dishName: string, ingredients: string[]) =>
    `An elegant French dish showcasing ${ingredients
      .slice(0, 3)
      .join(
        ", "
      )}. This traditional recipe embodies the sophisticated flavors of French cuisine.`,

  "united kingdom": (dishName: string, ingredients: string[]) =>
    `A hearty British classic made with ${ingredients
      .slice(0, 3)
      .join(
        ", "
      )}. This comforting dish is a staple of traditional British cuisine.`,

  india: (dishName: string, ingredients: string[]) =>
    `A flavorful Indian dish featuring ${ingredients
      .slice(0, 3)
      .join(
        ", "
      )}. Rich spices and aromatic ingredients create this beloved curry.`,

  thailand: (dishName: string, ingredients: string[]) =>
    `A vibrant Thai dish combining ${ingredients
      .slice(0, 3)
      .join(
        ", "
      )}. This aromatic recipe balances sweet, sour, salty, and spicy flavors perfectly.`,

  default: (dishName: string, ingredients: string[]) =>
    `A delicious traditional dish featuring ${ingredients
      .slice(0, 3)
      .join(
        ", "
      )}. This authentic recipe brings bold flavors and satisfying ingredients together.`,
};

class SmartDishGenerator {
  private fetcher: RecipeDataFetcher;
  private supabase: any;

  constructor() {
    this.fetcher = new RecipeDataFetcher();
    this.supabase = createClient(supabaseUrl!, supabaseServiceKey!);
  }

  async generateAndSaveDish(dishName: string): Promise<void> {
    console.log(`🚀 Smart generation for: "${dishName}"`);
    console.log("=".repeat(50));

    try {
      // Step 1: Generate base dish data
      const dishData = await this.fetcher.fetchDishData(dishName);
      if (!dishData) {
        throw new Error("Failed to generate dish data from APIs");
      }

      console.log(`✅ Base data generated from ${dishData.dataSource}`);

      // Step 2: Auto-detect country
      const country = this.detectCountry(dishName);
      (dishData as any).country = country;
      console.log(`🌍 Country detected: ${country}`);

      // Step 3: Generate smart blurb
      if (dishData.ingredients && dishData.ingredients.length > 0) {
        (dishData as any).blurb = this.generateBlurb(
          dishName,
          country,
          dishData.ingredients
        );
        console.log(`📝 Blurb generated`);
      }

      // Step 4: Calculate next release date
      const releaseDate = await this.getNextReleaseDate();
      (dishData as any).releaseDate = releaseDate;
      console.log(`📅 Release date: ${releaseDate}`);

      // Step 5: Add coordinates based on country
      const coordinates = this.getCountryCoordinates(country);

      // Step 6: Display final data for review
      console.log("\n📊 GENERATED DISH DATA:");
      console.log("=======================");
      console.log(`Name: ${dishData.name}`);
      console.log(`Country: ${(dishData as any).country}`);
      console.log(
        `Ingredients (${
          dishData.ingredients?.length
        }): ${dishData.ingredients?.join(", ")}`
      );
      console.log(
        `Acceptable Guesses: ${dishData.acceptableGuesses?.join(", ")}`
      );
      console.log(`Protein: ${dishData.proteinPerServing || "N/A"}g`);
      console.log(
        `Image: ${dishData.imageUrl ? "Available" : "Not available"}`
      );
      console.log(`Release Date: ${(dishData as any).releaseDate}`);
      console.log(`Blurb: ${(dishData as any).blurb}`);

      // Step 7: Save to database
      await this.saveDishToDatabase(dishData as any, coordinates);

      console.log("\n🎉 SUCCESS! Dish added to database and ready for game!");
    } catch (error) {
      console.error("💥 Error:", error);
      process.exit(1);
    }
  }

  private detectCountry(dishName: string): string {
    const normalized = dishName.toLowerCase().trim();

    // Check exact matches first
    if (DISH_COUNTRY_MAP[normalized]) {
      return DISH_COUNTRY_MAP[normalized];
    }

    // Check partial matches
    for (const [dish, country] of Object.entries(DISH_COUNTRY_MAP)) {
      if (normalized.includes(dish) || dish.includes(normalized)) {
        return country;
      }
    }

    // Default fallback - could be enhanced with AI
    console.log("⚠️ Country not auto-detected, using Italy as default");
    return "italy";
  }

  private generateBlurb(
    dishName: string,
    country: string,
    ingredients: string[]
  ): string {
    const template = BLURB_TEMPLATES[country] || BLURB_TEMPLATES.default;
    return template(dishName, ingredients);
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
        image_url: dishData.imageUrl,
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
    console.log('Example: npm run smart-generate "Spaghetti Carbonara"');
    process.exit(1);
  }

  const generator = new SmartDishGenerator();
  await generator.generateAndSaveDish(dishName);
}

main().catch(console.error);
