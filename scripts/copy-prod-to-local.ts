import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

config({ path: ".env.local" });

const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (prodUrl?.includes("127.0.0.1") || prodUrl?.includes("localhost")) {
  console.error("❌ ERROR: .env.local is pointing to LOCAL database, not production!");
  console.error("");
  console.error("To fix this:");
  console.error("  1. Run: npm run use-prod");
  console.error("  2. Then run this script again");
  console.error("");
  console.error("If you don't have production credentials, update .env.local.production with:");
  console.error("  - NEXT_PUBLIC_SUPABASE_URL (your Supabase project URL)");
  console.error("  - SUPABASE_SERVICE_ROLE_KEY (your service role key)");
  process.exit(1);
}

const localUrl = "http://127.0.0.1:54321";
const localKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

if (!prodUrl || !prodKey) {
  console.error("❌ Missing production environment variables in .env.local");
  console.error("Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set.");
  process.exit(1);
}

// Helper to clamp values within range
function clamp(value: any, min: number, max: number): number {
  const num = Number(value);
  if (isNaN(num)) return min;
  return Math.max(min, Math.min(max, Math.round(num)));
}

function transformGameScores(record: any): any {
  // Clamp values to satisfy constraints
  const transformed = { ...record };

  // Round and clamp phase scores (0-100 each)
  const dishScore = clamp(transformed.dish_score ?? 0, 0, 100);
  const countryScore = clamp(transformed.country_score ?? 0, 0, 100);
  const proteinScore = clamp(transformed.protein_score ?? 0, 0, 100);

  // Clamp guess counts to their allowed ranges
  const dishGuesses = clamp(transformed.dish_guesses ?? 0, 0, 6);
  const countryGuesses = clamp(transformed.country_guesses ?? 0, 0, 6);
  const proteinGuesses = clamp(transformed.protein_guesses ?? 0, 0, 4);

  // Assign transformed values
  transformed.dish_score = dishScore;
  transformed.country_score = countryScore;
  transformed.protein_score = proteinScore;
  transformed.dish_guesses = dishGuesses;
  transformed.country_guesses = countryGuesses;
  transformed.protein_guesses = proteinGuesses;

  // Keep total_score as-is from production (weighted average)

  return transformed;
}

function transformPastaLeaderboard(record: any): any {
  // Clamp values to satisfy constraints
  const transformed = { ...record };

  // Round and clamp phase scores (0-100 each)
  const pastaScore = clamp(transformed.pasta_score ?? 0, 0, 100);
  const sauceScore = clamp(transformed.sauce_score ?? 0, 0, 100);
  const regionScore = clamp(transformed.region_score ?? 0, 0, 100);
  const proteinScore = clamp(transformed.protein_score ?? 0, 0, 100);

  // Clamp guess counts to their allowed ranges
  const pastaGuesses = clamp(transformed.pasta_guesses ?? 0, 0, 6);
  const sauceGuesses = clamp(transformed.sauce_guesses ?? 0, 0, 6);
  const regionGuesses = Math.max(0, Math.round(Number(transformed.region_guesses ?? 0))); // No upper limit
  const proteinGuesses = clamp(transformed.protein_guesses ?? 0, 0, 4);

  // Assign transformed values
  transformed.pasta_score = pastaScore;
  transformed.sauce_score = sauceScore;
  transformed.region_score = regionScore;
  transformed.protein_score = proteinScore;
  transformed.pasta_guesses = pastaGuesses;
  transformed.sauce_guesses = sauceGuesses;
  transformed.region_guesses = regionGuesses;
  transformed.protein_guesses = proteinGuesses;

  // Keep total_score as-is from production (weighted average 0-100)

  return transformed;
}

async function copyTable(
  tableName: string,
  prodClient: any,
  localClient: any
) {
  console.log(`\n📥 Fetching ${tableName} from production...`);
  const { data: prodData, error: fetchError } = await prodClient
    .from(tableName)
    .select("*")
    .order("id", { ascending: true });

  if (fetchError) {
    console.error(`❌ Error fetching ${tableName}:`, fetchError.message);
    return 0;
  }

  if (!prodData || prodData.length === 0) {
    console.log(`⚠️  No records found in production ${tableName}.`);
    return 0;
  }

  console.log(`✅ Found ${prodData.length} records in production ${tableName}`);

  // Clear local table first
  console.log(`🗑️  Clearing local ${tableName}...`);
  const { error: deleteError } = await localClient
    .from(tableName)
    .delete()
    .neq("id", 0); // Delete all rows

  if (deleteError) {
    console.warn(`⚠️  Warning during delete of ${tableName}:`, deleteError.message);
  }

  // Insert data into local database in batches
  console.log(`📤 Inserting ${tableName} into local database...`);
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < prodData.length; i += batchSize) {
    const batch = prodData.slice(i, i + batchSize);

    // Transform data if needed (round scores for leaderboard tables)
    let transformedBatch = batch;
    if (tableName === 'game_scores') {
      transformedBatch = batch.map(transformGameScores);
    } else if (tableName === 'pasta_leaderboard') {
      transformedBatch = batch.map(transformPastaLeaderboard);
    }

    const { error: insertError } = await localClient
      .from(tableName)
      .insert(transformedBatch);

    if (insertError) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1} to ${tableName}:`, insertError.message);
      continue;
    }

    inserted += batch.length;
    console.log(`  Inserted ${inserted}/${prodData.length} ${tableName}...`);
  }

  console.log(`✅ Successfully copied ${inserted} records to ${tableName}!`);

  // Reset the ID sequence to avoid conflicts
  await resetSequence(tableName, localClient);

  return inserted;
}

async function resetSequence(tableName: string, localClient: any) {
  const seqName = `${tableName}_id_seq`;

  try {
    // Execute SQL directly via psql to reset the sequence
    const sql = `SELECT setval('${seqName}', (SELECT COALESCE(MAX(id), 1) FROM ${tableName}))`;
    execSync(`psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "${sql}"`, {
      stdio: 'pipe'
    });
    console.log(`🔄 Reset sequence ${seqName} for ${tableName}`);
  } catch (e: any) {
    console.warn(`⚠️  Could not reset sequence for ${tableName}:`, e.message);
  }
}

async function copyData() {
  console.log("🔄 Copying data from production to local database...\n");

  const prodClient = createClient(prodUrl!, prodKey!);
  const localClient = createClient(localUrl, localKey);

  // Tables to copy (both F4T and Pasta games)
  const tables = ["dishes", "game_scores", "pasta", "pasta_leaderboard"];
  const results: Record<string, number> = {};

  for (const table of tables) {
    const count = await copyTable(table, prodClient, localClient);
    results[table] = count;
  }

  // Verify all tables
  console.log("\n📊 Verification - Local database now has:");
  for (const table of tables) {
    const { count } = await localClient
      .from(table)
      .select("*", { count: "exact", head: true });
    console.log(`  • ${table}: ${count} records`);
  }

  console.log("\n💡 View them in Supabase Studio: http://127.0.0.1:54323");
}

copyData().catch((e) => {
  console.error("💥 Error:", e);
  process.exit(1);
});
