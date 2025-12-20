# Database Guide

Complete guide for managing database migrations, schema, and verification for Food for Thought and Pasta Perfetto.

## Quick Start

```bash
# Verify database health (all tables and storage)
npm run db:verify

# Apply migrations
supabase db reset
```

## Database Schema

### Food for Thought Game

**Tables:**
- `dishes` - Main dish entries (name, country, ingredients, image_url, release_date)
- `game_scores` - Player leaderboard with scoring breakdown

**Storage:**
- `dish-images` - Full dish images
- `dish-tiles` - Tile-based reveal images

### Pasta Perfetto Game

**Tables:**
- `pasta` - Pasta entries (name, region, sauce, pasta_about, origin_story, release_date)
- `pasta_leaderboard` - Player scores for pasta game

**Storage:**
- `pasta-images` - Pasta and sauce images

## Migrations

Migration files are in `supabase/migrations/` with format: `YYYYMMDDHHMMSS_description.sql`

### Local Development

```bash
# Start Supabase locally
supabase start

# Apply all migrations
supabase db reset

# Apply only new migrations
supabase migration up

# View Studio
open http://127.0.0.1:54323
```

### Production Deployment

```bash
# Link to production project
supabase link --project-ref your-project-ref

# Review changes
supabase db diff --schema public

# Apply migrations
supabase db push
```

## Verification

Run the unified verification script to test all tables, CRUD operations, and storage buckets:

```bash
npm run db:verify
```

This script checks:
- ✅ All 4 tables exist (dishes, game_scores, pasta, pasta_leaderboard)
- ✅ CRUD operations work correctly
- ✅ Storage buckets are accessible
- ✅ Constraints and indexes are working

### Manual Verification Queries

```sql
-- Check all tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Count records
SELECT 'dishes' as table_name, COUNT(*) as count FROM dishes
UNION ALL
SELECT 'pasta', COUNT(*) FROM pasta
UNION ALL
SELECT 'game_scores', COUNT(*) FROM game_scores
UNION ALL
SELECT 'pasta_leaderboard', COUNT(*) FROM pasta_leaderboard;

-- Check storage buckets
SELECT id, name, public FROM storage.buckets;
```

## Common Issues

### "relation already exists"
Migration already applied. Run `supabase db reset` for clean state.

### "function does not exist"
Missing dependency migration. Ensure migrations run in order with `supabase db reset`.

### Permission errors in verification
Use service role key: `export SUPABASE_SERVICE_ROLE_KEY="your-key"`

### Images not loading
1. Check bucket is public in Supabase dashboard
2. Verify `remotePatterns` in `next.config.js` includes Supabase domain
3. Confirm environment variables are set

## Data Generation

### Food for Thought
```bash
# Generate new dishes (fills buffer to 14 days)
npm run generate:dishes
```

### Pasta Perfetto
```bash
# Generate new pasta entries
npm run generate:pasta
```

Both scripts:
- Check buffer days remaining
- Generate only what's needed
- Respect daily cost cap ($0.50 default)
- Generate images and tiles automatically

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321  # or production URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# For generation scripts
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key  # For pasta generation

# Optional
TARGET_BUFFER_DAYS=14
DAILY_COST_CAP_USD=0.50
```

## Schema Updates

When adding new fields or tables:

1. Create migration: `supabase migration new description`
2. Write SQL in new file
3. Test locally: `supabase db reset`
4. Update TypeScript types in `src/types/database.ts`
5. Run verification: `npm run db:verify`
6. Deploy to production: `supabase db push`

## Rollback

### Local
```bash
supabase db reset  # Reset to clean state
```

### Production
Create rollback migration:
```bash
supabase migration new rollback_feature_name
```

Add DROP statements, then push.

## Resources

- Local Studio: http://127.0.0.1:54323
- Supabase Docs: https://supabase.com/docs
- Migration files: `supabase/migrations/`
- Type definitions: `src/types/database.ts`
