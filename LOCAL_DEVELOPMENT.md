# Local Development Guide

Step-by-step guide to run Food for Thought locally with a local database.

## Prerequisites

Install these first:
- **Docker Desktop** - Must be running
- **Node.js** - v24 LTS recommended (v25 requires extra config, see below)
- **Supabase CLI** - `npm install -g supabase`
- **pnpm** or **npm**

## First Time Setup

### 1. Clone and Install
```bash
git clone <repo-url>
cd food-for-thought
npm install
```

### 2. Configure Environment

Create `.env.local`:
```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<get-from-supabase-start>

# API Keys (for generation scripts)
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key

# Optional: PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=your-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Optional: Generation Config
TARGET_BUFFER_DAYS=14
DAILY_COST_CAP_USD=0.50
```

**Node.js v25 users:** Add this to `.env.local`:
```bash
NODE_OPTIONS="--no-experimental-webstorage"
```

### 3. Start Supabase
```bash
supabase start
```

**First time takes 5-10 minutes** to download Docker images.

Copy the `service_role_key` from the output and paste it into your `.env.local`.

### 4. Apply Migrations
```bash
supabase db reset
```

This creates all tables and storage buckets.

### 5. Verify Setup
```bash
npm run db:verify
```

Should show ✅ for all tables and storage buckets.

### 6. (Optional) Copy Production Data
```bash
npm run copy-prod-to-local
```

Syncs dishes from production to your local database.

## Daily Workflow

```bash
# 1. Ensure Docker Desktop is running

# 2. Start Supabase (if not already running)
supabase start

# 3. Verify you're on local environment
npm run use-local

# 4. Start dev server
npm run dev

# 5. Open browser
# http://localhost:3000 - App
# http://127.0.0.1:54323 - Supabase Studio
```

## Common Tasks

### Switch Environments
```bash
npm run use-local   # Switch to local DB
npm run use-prod    # Switch to production DB ⚠️
```

### Database Operations
```bash
npm run db:verify              # Check database health
npm run db:migrate             # Apply new migrations only
supabase db reset              # Wipe + reapply all migrations
npm run copy-prod-to-local     # Sync production data
npm run cleanup                # Clean local database
```

### Generate Content
```bash
npm run generate:dishes   # Generate F4T dishes (local DB)
npm run generate:pasta    # Generate pasta entries (local DB)
```

### View Database
```bash
# Supabase Studio
open http://127.0.0.1:54323

# Direct connection
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Stop/Restart Supabase
```bash
supabase stop    # Stop all containers
supabase start   # Start again
supabase status  # Check status
```

## Database Schema

### Food for Thought (F4T)
- **Tables:** `dishes`, `game_scores`
- **Storage:** `dish-images`, `dish-tiles`

### Pasta Perfetto (Guess'é di Pasta)
- **Tables:** `pasta`, `pasta_leaderboard`
- **Storage:** `pasta-images`, `pasta-tiles`

See `docs/DATABASE.md` for detailed schema documentation.

## Troubleshooting

### "Docker daemon not running"
Start Docker Desktop and wait for it to fully initialize.

### "Port already in use"
```bash
supabase stop
supabase start
```

### Changes not appearing
Verify you're on local environment:
```bash
npm run use-local
npm run db:verify
```

### Migrations not applying
```bash
supabase db reset  # Fresh start with all migrations
```

### Images not loading
1. Check bucket is public in Supabase Studio
2. Verify environment variables are set
3. Check `next.config.js` has correct `remotePatterns`

### Node.js v25 localStorage errors
Add to `.env.local`:
```bash
NODE_OPTIONS="--no-experimental-webstorage"
```

Or downgrade to Node.js v24 LTS:
```bash
nvm use 24
```

## Cost Savings

Running locally:
- ✅ Database writes: **FREE**
- ✅ Storage: **FREE**
- ⚠️ OpenAI/Gemini API calls: **Still cost money**

To avoid API costs during testing, work with existing data only (don't run generation scripts).

## Resources

- **Supabase Studio:** http://127.0.0.1:54323
- **API Endpoint:** http://127.0.0.1:54321
- **Database Schema:** `docs/DATABASE.md`
- **Migrations:** `supabase/migrations/`
- **Type Definitions:** `src/types/database.ts`
