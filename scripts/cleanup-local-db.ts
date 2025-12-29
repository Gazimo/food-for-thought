import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES = ['game_scores', 'pasta_leaderboard', 'dishes', 'pasta'];
const STORAGE_BUCKETS = ['dish-images', 'dish-tiles', 'pasta-images', 'pasta-tiles'];

async function confirmCleanup(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      '\n⚠️  WARNING: This will DELETE ALL DATA from local database and storage.\n\nAre you sure you want to continue? (yes/no): ',
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes');
      }
    );
  });
}

async function deleteTableData() {
  console.log('\n📋 Deleting table data...\n');

  for (const table of TABLES) {
    try {
      const { error, count } = await supabase
        .from(table)
        .delete()
        .neq('id', 0);

      if (error) {
        console.error(`❌ Error deleting from ${table}:`, error.message);
      } else {
        console.log(`✅ Deleted all records from table: ${table}`);
      }
    } catch (err) {
      console.error(`❌ Failed to delete from ${table}:`, err);
    }
  }
}

async function deleteStorageFiles() {
  console.log('\n🗂️  Deleting storage files...\n');

  for (const bucket of STORAGE_BUCKETS) {
    try {
      const { data: files, error: listError } = await supabase.storage
        .from(bucket)
        .list();

      if (listError) {
        console.error(`❌ Error listing files in ${bucket}:`, listError.message);
        continue;
      }

      if (!files || files.length === 0) {
        console.log(`ℹ️  No files in bucket: ${bucket}`);
        continue;
      }

      const filePaths = files.map((file) => file.name);
      const { error: deleteError } = await supabase.storage
        .from(bucket)
        .remove(filePaths);

      if (deleteError) {
        console.error(`❌ Error deleting files from ${bucket}:`, deleteError.message);
      } else {
        console.log(`✅ Deleted ${filePaths.length} files from bucket: ${bucket}`);
      }
    } catch (err) {
      console.error(`❌ Failed to process bucket ${bucket}:`, err);
    }
  }
}

async function resetSequences() {
  console.log('\n🔄 Resetting table ID sequences...\n');
  console.log('ℹ️  To reset ID sequences, run: npm run cleanup:reset-sequences\n');
}

async function main() {
  console.log('🧹 LOCAL DATABASE CLEANUP SCRIPT');
  console.log('================================\n');
  console.log(`Target: ${supabaseUrl}`);
  console.log(`\nTables to clear: ${TABLES.join(', ')}`);
  console.log(`Storage buckets to clear: ${STORAGE_BUCKETS.join(', ')}`);

  const confirmed = await confirmCleanup();

  if (!confirmed) {
    console.log('\n❌ Cleanup cancelled.\n');
    process.exit(0);
  }

  console.log('\n🚀 Starting cleanup...\n');

  await deleteTableData();
  await deleteStorageFiles();
  await resetSequences();

  console.log('\n✨ Cleanup complete!\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
