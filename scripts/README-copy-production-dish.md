# Copy Production Dish to Local Database

This script copies a single dish from production to your local database for testing the refactored F4T game.

## Prerequisites

1. **Local Supabase running**:
   ```bash
   supabase start
   ```

2. **Production credentials**: You need your production Supabase URL and anon key.

## Setup

Add these lines to your `.env.local` file:

```bash
# Production Supabase (read-only, for copying test data)
NEXT_PUBLIC_SUPABASE_URL_PROD=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD=your-production-anon-key
```

You can find these values in your Supabase dashboard:
- Go to https://supabase.com/dashboard
- Select your project
- Go to Settings → API
- Copy the "Project URL" and "anon/public" key

## Usage

### Option 1: Using the Script (Recommended)

```bash
# Run the copy script
npm run tsx scripts/copy-production-dish.ts
```

This will:
1. Fetch the most recent dish from production
2. Insert it into your local database
3. Verify the copy succeeded

### Option 2: Manual SQL Copy

If you prefer manual control or the script doesn't work:

1. **Get dish data from production**:
   - Go to your Supabase dashboard → Table Editor → dishes
   - Pick any dish row
   - Copy the data

2. **Insert into local database**:
   ```bash
   # Connect to local Supabase
   supabase db reset  # This will clear and recreate local DB

   # Then insert via SQL in Supabase Studio (http://localhost:54323)
   ```

### Option 3: Use Supabase CLI

```bash
# Dump production data (requires production access)
supabase db dump --data-only --table dishes > production-dishes.sql

# Load into local database
supabase db reset
psql "$DATABASE_URL" < production-dishes.sql
```

## Verification

After running the script, verify the dish was copied:

```bash
# Check local database
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "SELECT id, name, country FROM dishes LIMIT 5;"
```

Or visit the Supabase Studio:
- Open http://localhost:54323
- Go to Table Editor → dishes
- You should see the copied dish

## Test the Game

```bash
npm run dev
# Navigate to http://localhost:3000/play
# The game should load with the copied dish
```

## Troubleshooting

**Error: "Production Supabase credentials not found"**
- Make sure you added the production credentials to `.env.local`
- Restart your terminal/dev server after adding them

**Error: "Failed to fetch from production"**
- Check that your production URL and key are correct
- Verify your production database is accessible
- Try accessing the production Supabase dashboard to confirm access

**Error: "Failed to insert into local DB"**
- Make sure local Supabase is running: `supabase status`
- Try resetting the local database: `supabase db reset`
- Check that the dishes table exists: `supabase db reset`

**Dish exists but game won't load**
- Check that tiles/images exist for the dish
- Verify the dish has all required fields (name, country, image_url, etc.)
- Check browser console for errors

## Need Help?

If the script doesn't work, you can manually create a test dish in your local database using Supabase Studio:

1. Go to http://localhost:54323
2. Table Editor → dishes → Insert row
3. Fill in required fields:
   - `name`: "Test Dish"
   - `country`: "Italy"
   - `image_url`: Any valid image URL
   - `acceptable_guesses`: ["test dish", "test"]
   - `ingredients`: ["ingredient 1", "ingredient 2"]
   - `protein_per_serving`: 20
   - `blurb`: "A test dish for development"
   - `release_date`: Today's date

This should be enough to test the basic game functionality.
