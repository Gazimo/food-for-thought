/**
 * Copy ALL storage files from production to local Supabase
 *
 * This script:
 * 1. Lists all files in production storage buckets
 * 2. Downloads each file from production
 * 3. Uploads to local storage
 *
 * Usage: npm run copy-storage
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load production credentials
config({ path: '.env.local', override: true });

const PROD_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PROD_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const LOCAL_URL = 'http://127.0.0.1:54321';
const LOCAL_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

if (PROD_URL?.includes('127.0.0.1') || PROD_URL?.includes('localhost')) {
  console.error('❌ ERROR: Not pointing to production! Run: npm run use-prod');
  process.exit(1);
}

if (!PROD_URL || !PROD_KEY) {
  console.error('❌ Missing production credentials in .env.local');
  process.exit(1);
}

async function copyBucket(bucketName: string, prodClient: any, localClient: any) {
  console.log(`\n📦 Processing bucket: ${bucketName}`);

  try {
    // List all files in production bucket
    console.log(`  📋 Listing files in production ${bucketName}...`);
    const { data: files, error: listError } = await prodClient.storage
      .from(bucketName)
      .list('', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (listError) {
      console.error(`  ❌ Error listing files: ${listError.message}`);
      return { success: 0, errors: 1 };
    }

    if (!files || files.length === 0) {
      console.log(`  ℹ️  No files found in ${bucketName}`);
      return { success: 0, errors: 0 };
    }

    console.log(`  ✅ Found ${files.length} files`);

    let successCount = 0;
    let errorCount = 0;

    // Process each file and subdirectory
    for (const file of files) {
      try {
        // If it's a folder, recursively process it
        if (file.id === null) {
          const subFiles = await listAllFiles(prodClient, bucketName, file.name);
          for (const subFile of subFiles) {
            const result = await copyFile(bucketName, subFile, prodClient, localClient);
            if (result) successCount++;
            else errorCount++;
          }
        } else {
          // It's a file, copy it
          const result = await copyFile(bucketName, file.name, prodClient, localClient);
          if (result) successCount++;
          else errorCount++;
        }
      } catch (error) {
        console.error(`  ❌ Error processing ${file.name}: ${error instanceof Error ? error.message : error}`);
        errorCount++;
      }
    }

    return { success: successCount, errors: errorCount };
  } catch (error) {
    console.error(`  ❌ Error processing bucket ${bucketName}: ${error instanceof Error ? error.message : error}`);
    return { success: 0, errors: 1 };
  }
}

async function listAllFiles(client: any, bucketName: string, path: string): Promise<string[]> {
  const { data: files, error } = await client.storage
    .from(bucketName)
    .list(path, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    });

  if (error || !files) {
    return [];
  }

  const filePaths: string[] = [];

  for (const file of files) {
    const fullPath = path ? `${path}/${file.name}` : file.name;

    if (file.id === null) {
      // It's a folder, recurse
      const subFiles = await listAllFiles(client, bucketName, fullPath);
      filePaths.push(...subFiles);
    } else {
      // It's a file
      filePaths.push(fullPath);
    }
  }

  return filePaths;
}

async function copyFile(
  bucketName: string,
  filePath: string,
  prodClient: any,
  localClient: any
): Promise<boolean> {
  try {
    console.log(`    📥 ${filePath}...`);

    // Download from production
    const { data: fileData, error: downloadError } = await prodClient.storage
      .from(bucketName)
      .download(filePath);

    if (downloadError) {
      console.error(`    ❌ Download failed: ${downloadError.message}`);
      return false;
    }

    // Convert Blob to Buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Detect content type
    const contentType = fileData.type || 'application/octet-stream';

    // Upload to local
    const { error: uploadError } = await localClient.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error(`    ❌ Upload failed: ${uploadError.message}`);
      return false;
    }

    console.log(`    ✅ Copied`);
    return true;
  } catch (error) {
    console.error(`    ❌ Error: ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

async function copyAllStorage() {
  console.log('🗄️  Copying ALL storage files from production to local...\n');

  const prodClient = createClient(PROD_URL!, PROD_KEY!);
  const localClient = createClient(LOCAL_URL, LOCAL_KEY);

  try {
    // List all buckets in production
    console.log('📋 Listing storage buckets...');
    const { data: buckets, error: bucketsError } = await prodClient.storage.listBuckets();

    if (bucketsError) {
      throw new Error(`Failed to list buckets: ${bucketsError.message}`);
    }

    if (!buckets || buckets.length === 0) {
      console.log('⚠️  No storage buckets found in production');
      return;
    }

    console.log(`✅ Found ${buckets.length} bucket(s): ${buckets.map(b => b.name).join(', ')}\n`);

    let totalSuccess = 0;
    let totalErrors = 0;

    // Copy each bucket
    for (const bucket of buckets) {
      const { success, errors } = await copyBucket(bucket.name, prodClient, localClient);
      totalSuccess += success;
      totalErrors += errors;
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`  ✅ Successfully copied: ${totalSuccess} files`);
    console.log(`  ❌ Errors: ${totalErrors}`);
    console.log('\n🎉 Done! All storage files copied to local.');
    console.log('💡 View in Supabase Studio: http://127.0.0.1:54323');
  } catch (error) {
    console.error('\n❌ Fatal error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

copyAllStorage();
