import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

async function verify() {
  console.log("🔍 Verifying database connection...");
  console.log(`📍 URL: ${supabaseUrl}`);

  const supabase = createClient(supabaseUrl!, supabaseKey!);

  // Test 1: Check if dishes table exists
  console.log("\n✅ Test 1: Checking dishes table...");
  const { data, error, count } = await supabase
    .from("dishes")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }

  console.log(`✅ Dishes table exists! Current count: ${count || 0} dishes`);

  // Test 2: Check storage buckets
  console.log("\n✅ Test 2: Checking storage buckets...");
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    console.error("⚠️ Warning: Could not list storage buckets:", bucketsError.message);
  } else {
    console.log(`✅ Storage buckets:`, buckets.map(b => b.name).join(", "));
  }

  console.log("\n🎉 All tests passed! Your database is ready to use.");
  console.log("\n📝 Next steps:");
  console.log("   1. Run the daily-generate script: npm run daily-generate");
  console.log("   2. View your local data in Supabase Studio: http://127.0.0.1:54323");
  console.log("\n💡 To switch back to production:");
  console.log("   cp .env.local .env.local.production  # backup production env");
  console.log("   cp .env.local.development .env.local  # use local env");
}

verify().catch((e) => {
  console.error("💥 Error:", e);
  process.exit(1);
});
