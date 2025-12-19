# Local Development Setup

This guide helps you run the project with a local database instead of production.

## Prerequisites

- Docker Desktop installed and running
- Node.js and pnpm installed
- Supabase CLI installed (`npm install -g supabase`)

## Quick Start

### 1. Start Local Supabase

```bash
supabase start
```

This will start local Supabase containers and automatically apply migrations from `supabase/migrations/`. The first time will take a few minutes to download images.

### 2. Switch to Local Environment

```bash
npm run use-local
```

This switches your `.env.local` to use the local database. Your production settings are backed up to `.env.local.production`.

### 3. (Optional) Copy Production Data

```bash
npm run copy-prod-to-local
```

This syncs all dishes from production to your local database.

### 4. Verify Setup

```bash
npm run verify-local-db
```

This checks that the database is accessible and properly configured.

### 5. Run the Daily Generate Script

```bash
npm run daily-generate
```

This will generate dishes and save them to your **local** database.

## Switching Between Environments

### Use Local Database
```bash
npm run use-local
npm run daily-generate  # Runs against local DB
```

### Use Production Database
```bash
npm run use-prod
npm run daily-generate  # Runs against production DB ⚠️
```

## Accessing Local Services

When Supabase is running locally:

- **Supabase Studio** (Database UI): http://127.0.0.1:54323
- **API**: http://127.0.0.1:54321
- **Database Direct**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

## Environment Files

- `.env.local` - Currently active environment (local or production)
- `.env.local.development` - Local database configuration template
- `.env.local.production` - Production database backup (auto-created)

## Managing Local Database

### View Database Contents
Open Supabase Studio: http://127.0.0.1:54323

### Reset Database
```bash
supabase db reset
```

This will wipe all data and re-apply migrations from `supabase/migrations/`.

### Stop Local Supabase
```bash
supabase stop
```

### Start Again
```bash
supabase start
```

## Troubleshooting

### "Docker daemon not running"
Start Docker Desktop and wait for it to fully start.

### "Port already in use"
Stop Supabase and try again:
```bash
supabase stop
supabase start
```

### Changes not appearing
Make sure you're using the local environment:
```bash
npm run use-local
npm run verify-local-db
```

### Want to sync production data to local
```bash
npm run copy-prod-to-local
```

This script fetches all dishes from production and inserts them into your local database.

## Database Schema

The local database schema is defined in `supabase/migrations/20231219_init_schema.sql`.

Key tables:
- `dishes` - Main dishes table with all dish data

Key storage buckets:
- `dish-images` - Full dish images
- `dish-tiles` - Tiled/blurred dish images for the game

## Cost Savings

When testing locally:
- ✅ Database writes are FREE (local)
- ✅ Storage is FREE (local)
- ⚠️ OpenAI API calls still cost money (uses production API key)

To avoid OpenAI costs during testing, you can modify the script to skip AI generation and work with backlog dishes only.
