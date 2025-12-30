/**
 * Unified Database Verification Script
 *
 * Verifies all tables and schemas for both Food for Thought and Guess'é di Pasta games
 *
 * Usage: npx tsx scripts/db/verify-db.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing environment variables");
  console.error("   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

type TestResult = {
  name: string;
  passed: boolean;
  message: string;
};

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} ${name}: ${message}`);
}

async function verifyConnection() {
  console.log("\n🔍 Testing Database Connection...");
  console.log(`📍 URL: ${supabaseUrl}\n`);
}

async function verifyDishesTable() {
  console.log("📋 Verifying Food for Thought (dishes table)...");

  const { data, error, count } = await supabase
    .from("dishes")
    .select("*", { count: "exact", head: true });

  if (error) {
    logTest("Dishes table exists", false, error.message);
    return;
  }

  logTest("Dishes table exists", true, `${count || 0} dishes found`);

  // Test insert
  const testDish = {
    name: `Test Dish ${Date.now()}`,
    acceptable_guesses: ["test dish"],
    country: "Test Country",
    ingredients: ["ingredient1", "ingredient2", "ingredient3", "ingredient4", "ingredient5", "ingredient6"],
    blurb: "Test blurb",
    protein_per_serving: 10,
    recipe: { ingredients: ["test"], instructions: ["test"] },
    tags: ["test"],
    release_date: "2099-12-31",
  };

  const { data: insertData, error: insertError } = await supabase
    .from("dishes")
    .insert([testDish])
    .select()
    .single();

  if (insertError) {
    logTest("Dishes CRUD operations", false, `Insert failed: ${insertError.message}`);
    return;
  }

  logTest("Dishes CRUD operations", true, `Test dish ID: ${insertData.id}`);

  // Cleanup
  await supabase.from("dishes").delete().eq("id", insertData.id);
}

async function verifyGameScoresTable() {
  console.log("\n📋 Verifying Game Scores (leaderboard)...");

  const { data, error, count } = await supabase
    .from("game_scores")
    .select("*", { count: "exact", head: true });

  if (error) {
    logTest("Game scores table exists", false, error.message);
    return;
  }

  logTest("Game scores table exists", true, `${count || 0} scores found`);
}

async function verifyPastaTable() {
  console.log("\n🍝 Verifying Guess'é di Pasta (pasta table)...");

  const { data, error, count } = await supabase
    .from("pasta")
    .select("*", { count: "exact", head: true });

  if (error) {
    logTest("Pasta table exists", false, error.message);
    return;
  }

  logTest("Pasta table exists", true, `${count || 0} pasta entries found`);

  // Test insert with complete data
  const testPasta = {
    name: `Test Pici ${Date.now()}`,
    acceptable_guesses: ["test pici"],
    pasta_about: ["Long pasta", "Durum wheat", "Eggless", "Thick strands", "From appicciare", "Hand-rolled"],
    sauce_name: "Test Sauce",
    sauce_acceptable_guesses: ["test sauce"],
    sauce_ingredients: ["ingredient1", "ingredient2", "ingredient3", "ingredient4", "ingredient5", "ingredient6"],
    sauce_recipe: {
      ingredients: ["400g tomatoes", "2 cloves garlic"],
      instructions: ["Heat oil", "Add garlic", "Simmer"]
    },
    region: "Toscana",
    region_coordinates: { lat: 43.77, lng: 11.25 },
    protein_per_serving: 12,
    origin_story: "Test origin story for validation purposes. This is a test pasta entry created for database verification. It should contain enough words to pass validation checks.",
    fun_fact: "This is a test pasta entry.",
    tags: ["test"],
    release_date: "2099-12-31",
  };

  const { data: insertData, error: insertError } = await supabase
    .from("pasta")
    .insert([testPasta])
    .select()
    .single();

  if (insertError) {
    logTest("Pasta CRUD operations", false, `Insert failed: ${insertError.message}`);
    return;
  }

  logTest("Pasta CRUD operations", true, `Test pasta ID: ${insertData.id}`);

  // Cleanup
  await supabase.from("pasta").delete().eq("id", insertData.id);
}

async function verifyPastaLeaderboardTable() {
  console.log("\n📋 Verifying Pasta Leaderboard...");

  const { data, error, count } = await supabase
    .from("pasta_leaderboard")
    .select("*", { count: "exact", head: true });

  if (error) {
    logTest("Pasta leaderboard table exists", false, error.message);
    return;
  }

  logTest("Pasta leaderboard table exists", true, `${count || 0} scores found`);
}

async function verifyStorageBuckets() {
  console.log("\n🗄️  Verifying Storage Buckets...");

  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    logTest("Storage buckets accessible", false, error.message);
    return;
  }

  const bucketNames = buckets.map(b => b.name);
  const requiredBuckets = ["dish-images", "dish-tiles", "pasta-images"];

  for (const bucket of requiredBuckets) {
    const exists = bucketNames.includes(bucket);
    logTest(`Storage bucket: ${bucket}`, exists, exists ? "Found" : "Missing");
  }
}

async function printSummary() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 VERIFICATION SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);

  if (failed === 0) {
    console.log("\n🎉 All verifications passed! Database is healthy.");
    console.log("\n💡 Next steps:");
    console.log("   - View data in Supabase Studio: http://127.0.0.1:54323");
    console.log("   - Run daily generation: npm run generate:dishes");
    console.log("   - Run pasta generation: npm run generate:pasta");
  } else {
    console.log("\n⚠️  Some verifications failed. Check errors above.");
    process.exit(1);
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("🔬 UNIFIED DATABASE VERIFICATION");
  console.log("=".repeat(60));

  await verifyConnection();
  await verifyDishesTable();
  await verifyGameScoresTable();
  await verifyPastaTable();
  await verifyPastaLeaderboardTable();
  await verifyStorageBuckets();
  await printSummary();
}

main().catch((error) => {
  console.error("\n💥 Fatal Error:", error);
  process.exit(1);
});
