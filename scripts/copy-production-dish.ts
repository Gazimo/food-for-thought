/**
 * Copy a single dish from production to local database for testing
 *
 * Usage:
 *   npm run tsx scripts/copy-production-dish.ts
 *
 * This script:
 * 1. Connects to production Supabase
 * 2. Fetches one recent dish
 * 3. Inserts it into local Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const PROD_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PROD_SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (PROD_SUPABASE_URL?.includes('127.0.0.1') || PROD_SUPABASE_URL?.includes('localhost')) {
  console.error('❌ ERROR: Not pointing to production! Run: npm run use-prod');
  process.exit(1);
}

// Local Supabase
const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';
const LOCAL_SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function copyProductionDish() {
  console.log('🔄 Starting production dish copy...\n');

  // Check if production credentials are set
  if (!PROD_SUPABASE_URL || !PROD_SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Production Supabase credentials not found!');
    console.log('Make sure you have run: npm run use-prod');
    process.exit(1);
  }

  console.log(`📍 Production URL: ${PROD_SUPABASE_URL}`);
  console.log(`📍 Local URL: ${LOCAL_SUPABASE_URL}\n`);

  // Create clients
  const prodClient = createClient(PROD_SUPABASE_URL, PROD_SUPABASE_SERVICE_ROLE_KEY);
  const localClient = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Fetch one recent dish from production
    console.log('📥 Fetching dish from production...');
    const { data: dishes, error: fetchError } = await prodClient
      .from('dishes')
      .select('*')
      .order('release_date', { ascending: false })
      .limit(1);

    if (fetchError) {
      throw new Error(`Failed to fetch from production: ${fetchError.message}`);
    }

    if (!dishes || dishes.length === 0) {
      throw new Error('No dishes found in production');
    }

    const dish = dishes[0];
    console.log(`✅ Fetched dish: "${dish.name}" (ID: ${dish.id})`);
    console.log(`   Country: ${dish.country}`);
    console.log(`   Release Date: ${dish.release_date}\n`);

    // 2. Check if dish already exists in local DB
    console.log('🔍 Checking if dish already exists locally...');
    const { data: existingDishes, error: checkError } = await localClient
      .from('dishes')
      .select('id, name')
      .eq('id', dish.id);

    if (checkError) {
      console.warn(`⚠️  Warning: Could not check for existing dish: ${checkError.message}`);
    }

    if (existingDishes && existingDishes.length > 0) {
      console.log(`ℹ️  Dish already exists in local DB (ID: ${dish.id})`);
      console.log('   Updating instead of inserting...\n');

      // Update existing dish
      const { error: updateError } = await localClient
        .from('dishes')
        .update(dish)
        .eq('id', dish.id);

      if (updateError) {
        throw new Error(`Failed to update dish: ${updateError.message}`);
      }

      console.log('✅ Successfully updated dish in local database!');
    } else {
      // 3. Insert into local database
      console.log('📤 Inserting dish into local database...');
      const { error: insertError } = await localClient
        .from('dishes')
        .insert([dish]);

      if (insertError) {
        throw new Error(`Failed to insert into local DB: ${insertError.message}`);
      }

      console.log('✅ Successfully copied dish to local database!');
    }

    // 4. Verify the insert/update
    console.log('\n🔍 Verifying...');
    const { data: verifyDish, error: verifyError } = await localClient
      .from('dishes')
      .select('id, name, country')
      .eq('id', dish.id)
      .single();

    if (verifyError) {
      throw new Error(`Failed to verify: ${verifyError.message}`);
    }

    console.log(`✅ Verified! Dish "${verifyDish.name}" is now in local database`);
    console.log('\n🎉 Done! You can now test the game locally.');
    console.log(`   Run: npm run dev`);
    console.log(`   Navigate to: http://localhost:3000/play`);
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the script
copyProductionDish();
