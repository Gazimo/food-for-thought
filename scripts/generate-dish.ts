import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import readline from "readline";
import { Database } from "../src/types/database";
import RecipeDataFetcher from "../src/utils/recipeDataFetcher";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let supabase: ReturnType<typeof createClient<Database>> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "Supabase configuration missing. Please check your .env.local file."
      );
    }
    supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
}

// Setup readline for interactive prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function generateDish() {
  const dishName = process.argv[2];

  if (!dishName) {
    console.error("❌ Please provide a dish name");
    console.log('Usage: npm run generate-dish "Dish Name"');
    process.exit(1);
  }

  console.log(`🚀 Generating dish data for: "${dishName}"`);
  console.log("==========================================\n");

  try {
    const fetcher = new RecipeDataFetcher();
    const dishData = await fetcher.fetchDishData(dishName);

    if (!dishData) {
      console.error(`❌ Failed to generate data for: ${dishName}`);
      process.exit(1);
    }

    console.log("📋 Generated Data Review:");
    console.log("=========================");
    console.log(`Name: ${dishData.name}`);
    console.log(`Ingredients: ${dishData.ingredients?.join(", ")}`);
    console.log(
      `Acceptable Guesses: ${dishData.acceptableGuesses?.join(", ")}`
    );
    console.log(`Tags: ${dishData.tags?.join(", ")}`);
    console.log(
      `Protein: ${
        dishData.proteinPerServing
          ? dishData.proteinPerServing + "g"
          : "Not available"
      }`
    );
    console.log(`Image URL: ${dishData.imageUrl || "Not available"}`);
    console.log(`Blurb: ${dishData.blurb}`);
    console.log(`Data Source: ${dishData.dataSource}`);
    console.log("\n");

    // Interactive review process
    console.log("🔍 MANUAL REVIEW REQUIRED:");
    console.log("==========================");

    // Get country
    const country = await prompt("🌍 Enter the country of origin: ");
    dishData.country = country.trim();

    // Review blurb
    console.log(`\n📝 Current blurb: "${dishData.blurb}"`);
    const newBlurb = await prompt(
      "✏️ Enter improved blurb (or press Enter to keep current): "
    );
    if (newBlurb.trim()) {
      dishData.blurb = newBlurb.trim();
    }

    // Review ingredients
    console.log(
      `\n🥘 Current ingredients: ${dishData.ingredients?.join(", ")}`
    );
    const keepIngredients = await prompt(
      "✅ Are these 6 ingredients good? (y/n): "
    );
    if (keepIngredients.toLowerCase() !== "y") {
      const newIngredients = await prompt(
        "🔄 Enter 6 comma-separated ingredients: "
      );
      dishData.ingredients = newIngredients
        .split(",")
        .map((ing) => ing.trim())
        .slice(0, 6);
    }

    // Review acceptable guesses
    console.log(
      `\n🤔 Current acceptable guesses: ${dishData.acceptableGuesses?.join(
        ", "
      )}`
    );
    const keepGuesses = await prompt("✅ Are these guesses good? (y/n): ");
    if (keepGuesses.toLowerCase() !== "y") {
      const newGuesses = await prompt(
        "🔄 Enter comma-separated acceptable guesses: "
      );
      dishData.acceptableGuesses = newGuesses
        .split(",")
        .map((guess) => guess.trim());
    }

    // Set release date
    const releaseDate = await prompt(
      "📅 Enter release date (YYYY-MM-DD) or press Enter for today: "
    );
    dishData.releaseDate =
      releaseDate.trim() || new Date().toISOString().split("T")[0];

    // Mark as reviewed
    dishData.reviewStatus = "reviewed";

    console.log("\n📊 FINAL DISH DATA:");
    console.log("===================");
    console.log(JSON.stringify(dishData, null, 2));

    // Ask if user wants to save to database
    const saveToDb = await prompt("\n💾 Save to database? (y/n): ");

    if (saveToDb.toLowerCase() === "y") {
      await saveDishToDatabase(dishData);
      console.log("✅ Dish saved successfully!");
    } else {
      console.log("📝 Dish data generated but not saved to database.");
      console.log("You can manually copy the JSON above if needed.");
    }
  } catch (error) {
    console.error("💥 Error generating dish:", error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

async function saveDishToDatabase(dishData: any) {
  try {
    const client = getSupabaseClient();

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
      coordinates: null, // Will be enriched later based on country
      region: null,
      // Add metadata fields
      data_source: dishData.dataSource,
      generated_at: dishData.generatedAt,
      review_status: dishData.reviewStatus,
    };

    const { data, error } = await client
      .from("dishes")
      .insert([dishToInsert])
      .select();

    if (error) {
      console.error("❌ Database error:", error);
      throw error;
    }

    console.log("✅ Dish inserted with ID:", data[0]?.id);

    // TODO: Add coordinate enrichment based on country
    console.log("🗺️ Note: Coordinates will need to be added based on country");
  } catch (error) {
    console.error("💥 Failed to save to database:", error);
    throw error;
  }
}

// Update database schema to include new fields
async function updateDatabaseSchema() {
  console.log("🔧 Checking database schema...");

  try {
    const client = getSupabaseClient();

    // Add new columns if they don't exist
    const alterQueries = [
      `ALTER TABLE dishes ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual';`,
      `ALTER TABLE dishes ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP DEFAULT NOW();`,
      `ALTER TABLE dishes ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'draft';`,
    ];

    for (const query of alterQueries) {
      const { error } = await client.rpc("exec_sql", { sql: query });
      if (error && !error.message.includes("already exists")) {
        console.warn("⚠️ Schema update warning:", error.message);
      }
    }

    console.log("✅ Database schema updated");
  } catch (error) {
    console.warn("⚠️ Could not update database schema:", error);
    console.log("You may need to manually add these columns:");
    console.log("- data_source TEXT");
    console.log("- generated_at TIMESTAMP");
    console.log("- review_status TEXT");
  }
}

// Main execution
async function main() {
  // Only check database schema if we're planning to save to database
  // For now, let's skip this and just focus on data generation
  // await updateDatabaseSchema();
  await generateDish();
}

main().catch(console.error);
