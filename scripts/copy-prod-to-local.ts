import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load production credentials from backup file
config({ path: ".env.local.production", override: true });

const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Local Supabase credentials
const localUrl = "http://127.0.0.1:54321";
const localKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

if (!prodUrl || !prodKey) {
  console.error("❌ Missing production environment variables in .env.local.production");
  console.error("Make sure you ran 'npm run use-local' first to create the backup.");
  process.exit(1);
}

async function copyData() {
  console.log("🔄 Copying data from production to local database...\n");

  const prodClient = createClient(prodUrl!, prodKey!);
  const localClient = createClient(localUrl, localKey);

  // Fetch all dishes from production
  console.log("📥 Fetching dishes from production...");
  const { data: prodDishes, error: fetchError } = await prodClient
    .from("dishes")
    .select("*")
    .order("id", { ascending: true });

  if (fetchError) {
    console.error("❌ Error fetching from production:", fetchError.message);
    process.exit(1);
  }

  if (!prodDishes || prodDishes.length === 0) {
    console.log("⚠️ No dishes found in production database.");
    return;
  }

  console.log(`✅ Found ${prodDishes.length} dishes in production\n`);

  // Clear local database first
  console.log("🗑️  Clearing local database...");
  const { error: deleteError } = await localClient
    .from("dishes")
    .delete()
    .neq("id", 0); // Delete all rows

  if (deleteError) {
    console.warn("⚠️ Warning during delete:", deleteError.message);
  }

  // Insert dishes into local database in batches
  console.log("📤 Inserting dishes into local database...");
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < prodDishes.length; i += batchSize) {
    const batch = prodDishes.slice(i, i + batchSize);

    // Remove the 'id' field to let the local DB auto-generate it
    // OR keep it if you want to preserve the same IDs
    const dishesToInsert = batch.map(dish => {
      const { ...dishData } = dish;
      return dishData;
    });

    const { error: insertError } = await localClient
      .from("dishes")
      .insert(dishesToInsert);

    if (insertError) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, insertError.message);
      continue;
    }

    inserted += batch.length;
    console.log(`  Inserted ${inserted}/${prodDishes.length} dishes...`);
  }

  console.log(`\n✅ Successfully copied ${inserted} dishes to local database!`);

  // Verify
  const { count } = await localClient
    .from("dishes")
    .select("*", { count: "exact", head: true });

  console.log(`\n📊 Local database now has ${count} dishes`);
  console.log("\n💡 View them in Supabase Studio: http://127.0.0.1:54323");
}

copyData().catch((e) => {
  console.error("💥 Error:", e);
  process.exit(1);
});
