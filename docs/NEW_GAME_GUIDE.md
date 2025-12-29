# New Game Development Guide

A comprehensive step-by-step guide for creating new games in the Food for Thought platform.

**Example Game**: Spanish Cuisine ("Adivina la Comida")

---

## Table of Contents

1. [Introduction & Overview](#introduction--overview)
2. [Pre-Implementation: Critical Decisions](#pre-implementation-critical-decisions)
3. [Core Implementation Steps](#core-implementation-steps)
4. [Optional Components & Features](#optional-components--features)
5. [Database Migration Walkthrough](#database-migration-walkthrough)
6. [Testing & Validation](#testing--validation)
7. [Common Patterns & Gotchas](#common-patterns--gotchas)
8. [Real Example: Spanish Cuisine Game](#real-example-spanish-cuisine-game)
9. [Reference Checklist](#reference-checklist)
10. [Troubleshooting](#troubleshooting)

---

## Introduction & Overview

This guide walks you through creating a new game in the Food for Thought multi-game platform. The architecture is designed to be **configuration-driven** and **highly reusable**, allowing you to build complete games with minimal custom code.

### What This Guide Covers

- Complete game implementation from scratch
- Database schema design
- API endpoint configuration
- Leaderboard integration
- Optional features (tiles, hints, archives)
- Testing and deployment

### How to Use This Guide

1. **Read Pre-Implementation section** to make upfront decisions
2. **Follow Core Implementation Steps** in order (some can be done in parallel)
3. **Add Optional Features** based on your game's needs
4. **Reference existing games** for patterns (F4T for simple, Pasta for complex)

### Target Audience

- Software developers building new game modes
- AI agents assisting with game development
- Non-technical stakeholders understanding the architecture

### Example Throughout: Spanish Cuisine

We'll use **"Adivina la Comida"** (Spanish Cuisine game) as a concrete example:
- **Game ID**: `spanish-cuisine`
- **URL Path**: `/spanish`
- **Icon**: 🥘
- **3 Phases**: Dish name → Spanish region → Calories
- **Features**: Tiles, hints, leaderboard (no archive for simplicity)

---

## Pre-Implementation: Critical Decisions

Make these decisions **before writing any code**. They determine your database schema, API structure, and UI components.

### 2.1 Define Your Game's Identity

**Required Decisions:**

| Field | Purpose | Example (Spanish Cuisine) |
|-------|---------|---------------------------|
| **Display Name** | Shown in UI | "Adivina la Comida" |
| **Game ID** | Unique identifier (kebab-case) | `spanish-cuisine` |
| **URL Path** | Route where game lives | `/spanish` |
| **Icon** | Emoji for branding | 🥘 |
| **Description** | 1-2 sentence pitch | "A daily Spanish cuisine game. Identify the dish, its region, and nutritional content." |
| **Table Name** | Database table (usually singular) | `spanish_cuisine` |
| **API Prefix** | API endpoint prefix | `/api/spanish` |

**Tip**: Choose a URL path that doesn't conflict with existing routes (`/play`, `/pasta`, etc.)

---

### 2.2 Decide Your Phases

**How Many Phases?**
- Food for Thought: 3 phases (dish, country, protein)
- Pasta: 4 phases (pasta, sauce, region, protein)
- Spanish Cuisine example: 3 phases (dish, region, calories)

**For Each Phase, Determine:**

1. **Phase ID** (unique within your game)
   - Examples: `dish`, `region`, `calories`, `pasta`, `sauce`

2. **Input Type** (determines UI and validator)
   - `text` - Free text with autocomplete
   - `country-map` - Click on world map
   - `region-map` - Click on regional map (e.g., Italian or Spanish regions)
   - `numeric` - Number input

3. **Scoring Parameters**
   - `baseScore`: Points for success (typically 100)
   - `penaltyPerGuess`: Points deducted per wrong guess (10-20 typical)

4. **Guess Limits**
   - `maxGuesses`: Number (e.g., 6) or `null` for unlimited

5. **Visual Elements**
   - `revealsTiles`: Does phase show progressively revealed images? (true/false)
   - `tileCount`: How many tiles? (6 is common: 3x2 grid)
   - `tileGrid`: Grid dimensions `[columns, rows]` (e.g., `[3, 2]`)

6. **Hint System**
   - `revealsHints`: Show text hints on wrong guesses? (true/false)
   - Hints stored as array in database (6 hints typical)

7. **Answer Validation** (for text inputs)
   - `enforceClosedList`: Restrict to predefined list? (true/false)
   - `acceptableGuessesField`: Database field with valid guesses
   - Example: Pasta phase enforces closed list to prevent typos

**Spanish Cuisine Example Phases:**

| Phase | ID | Input Type | Max Guesses | Tiles? | Hints? | Closed List? |
|-------|----|-----------|----|--------|--------|--------------|
| 1. Dish | `dish` | text | 6 | ✓ (3x2 grid) | ✓ (6 ingredient hints) | ✗ |
| 2. Region | `region` | region-map | unlimited | ✗ | ✗ | N/A |
| 3. Calories | `calories` | numeric | 4 | ✗ | ✗ | N/A |

---

### 2.3 Score Aggregation Strategy

**How to combine phase scores into total score?**

**Option 1: Simple Weighted Average** (Recommended for most games)
```
Total = (Phase1 × Weight1) + (Phase2 × Weight2) + (Phase3 × Weight3)
```

Example - F4T uses:
- Dish: 35%
- Country: 35%
- Protein: 30%

Example - Spanish Cuisine (equal weighting):
- Dish: 33.33%
- Region: 33.33%
- Calories: 33.33%

**Option 2: Custom Calculator**
Create a dedicated function in `src/utils/scoreCalculators/` if you need:
- Complex bonus multipliers
- Phase dependencies
- Non-linear scoring

Reference: `src/utils/scoreCalculators/pastaScoreCalculator.ts`

---

### 2.4 Optional Features Checklist

Decide which optional features your game needs:

- [ ] **Tile-Based Reveals** - Progressive image unveiling on wrong guesses
- [ ] **Hint System** - Text clues revealed progressively
- [ ] **Map-Based Guessing** - Geographic selection UI
- [ ] **Closed-List Validation** - Enforce predefined acceptable answers
- [ ] **Archive System** - Allow replaying past games
- [ ] **Custom Score Calculator** - Complex scoring logic
- [ ] **Leaderboard** - Competitive ranking (recommended for all games)
- [ ] **Post-Game Content** - Recipe, story, or fun facts

**Recommendation**: Start minimal, add features incrementally.

---

## Core Implementation Steps

Follow these steps **in order**. Steps within each phase can be done in parallel.

---

### Step 1: Register Game Type & Phases (Config)

**Location**: `src/config/games/`

**Files to Modify/Create:**
- MODIFY: `src/config/games/types.ts`
- CREATE: `src/config/games/spanish-cuisine.ts`
- MODIFY: `src/config/games/index.ts`

#### 1.1 Update Type Definitions

**File**: `src/config/games/types.ts`

Add your game ID to the union type:
```typescript
export type GameTypeId = "food-for-thought" | "italian-pasta" | "spanish-cuisine";
```

If your phases differ from existing games, add phase IDs:
```typescript
export type SpanishCuisinePhaseId = "dish" | "region" | "calories" | "complete";
export type PhaseId = BasePhaseId | ItalianPastaPhaseId | SpanishCuisinePhaseId;
```

#### 1.2 Create Game Configuration

**File**: `src/config/games/spanish-cuisine.ts`

Create a `GameConfig` object with:
- Game metadata (id, name, description, icon, urlPath)
- Architecture version (use `"unified"`)
- Array of `PhaseConfig` objects (one per phase, in order)
- `scoreAggregator` function
- `scoreSubmitter` function (optional, for leaderboard)
- Hint configuration
- Post-game content configuration
- Database/API settings (tableName, apiPrefix, storageKeyPrefix)
- Availability flags (enabled, releaseDate)

**Reference**: See `src/config/games/food-for-thought.ts` (simple) or `src/config/games/italian-pasta.ts` (complex)

**Key Fields per Phase**:
```typescript
{
  id: "dish",
  title: "🥘 Guess the Dish",
  icon: "🥘",
  description: "Identify the Spanish dish from the image",
  inputType: "text",
  maxGuesses: 6,
  revealsTiles: true,
  revealsHints: true,
  tileCount: 6,
  tileGrid: [3, 2],
  baseScore: 100,
  penaltyPerGuess: 15,
  navigationLabel: "Guess the region"
}
```

#### 1.3 Register in Game Registry

**File**: `src/config/games/index.ts`

Import and add to `GAME_REGISTRY`:
```typescript
import { spanishCuisineConfig } from "./spanish-cuisine";

export const GAME_REGISTRY: Record<GameTypeId, GameConfig> = {
  "food-for-thought": foodForThoughtConfig,
  "italian-pasta": italianPastaConfig,
  "spanish-cuisine": spanishCuisineConfig,
};
```

**Checkpoint**: TypeScript should compile without errors.

---

### Step 2: Create Database Schema

**Location**: `supabase/migrations/`

**Files to Create:**
- CREATE: `supabase/migrations/{timestamp}_create_spanish_cuisine_tables.sql`

#### 2.1 Core Game Data Table

Create table `{game}` (e.g., `spanish_cuisine`) with:

**Required Fields:**
- `id` BIGSERIAL PRIMARY KEY
- `name` TEXT NOT NULL
- `acceptable_guesses` TEXT[] DEFAULT '{}'
- `release_date` DATE NOT NULL UNIQUE
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()

**Phase-Specific Fields** (based on your phases):
- Text phases: `{phase}_image_url`, hints array
- Map phases: `{phase}` (region/country name), coordinates
- Numeric phases: `{phase}_per_serving` (e.g., `calories_per_serving`)

**Post-Game Content**:
- `origin_story` TEXT
- `fun_fact` TEXT
- `recipe` JSONB

**Spanish Cuisine Example**:
```
spanish_cuisine table:
- id, name, acceptable_guesses
- dish_image_url, dish_about[6] (hints array)
- region, region_coordinates (JSONB with lat/lng)
- calories_per_serving
- origin_story, fun_fact
- release_date, created_at, updated_at
```

#### 2.2 Leaderboard Table

Create table `{game}_leaderboard` with:

**Required Fields:**
- `id` BIGSERIAL PRIMARY KEY
- `{game}_date` DATE NOT NULL
- `{game}_id` BIGINT REFERENCES {game}(id) ON DELETE SET NULL
- `session_id` TEXT NOT NULL
- `total_score` NUMERIC(5,2) DEFAULT 0
- `completed_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()

**Per-Phase Fields** (one pair per phase):
- `{phase}_score` INTEGER
- `{phase}_guesses` INTEGER

**Constraints:**
- `UNIQUE ({game}_date, session_id)` - One score per player per day
- `CHECK (total_score >= 0 AND total_score <= 100)`
- `CHECK ({phase}_score >= 0 AND {phase}_score <= 100)`
- `CHECK ({phase}_guesses >= 0 AND {phase}_guesses <= {maxGuesses})`

**Spanish Cuisine Example**:
```
spanish_cuisine_leaderboard table:
- id, dish_date, dish_id, session_id
- dish_score, dish_guesses
- region_score, region_guesses
- calories_score, calories_guesses
- total_score, completed_at, created_at
```

#### 2.3 Storage Buckets

Create two public storage buckets:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('spanish-images', 'spanish-images', true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('spanish-tiles', 'spanish-tiles', true);
```

#### 2.4 RLS Policies

Enable Row-Level Security and add policies:

**Game Data Table** (public read, service role write):
```sql
ALTER TABLE spanish_cuisine ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access"
  ON spanish_cuisine FOR SELECT
  USING (true);

CREATE POLICY "Service role manages data"
  ON spanish_cuisine FOR ALL
  USING (auth.role() = 'service_role');
```

**Leaderboard Table** (public read/insert, service role update):
```sql
ALTER TABLE spanish_cuisine_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read leaderboard"
  ON spanish_cuisine_leaderboard FOR SELECT
  USING (true);

CREATE POLICY "Users insert scores"
  ON spanish_cuisine_leaderboard FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role updates leaderboard"
  ON spanish_cuisine_leaderboard FOR UPDATE
  USING (auth.role() = 'service_role');
```

**Storage Policies**:
```sql
CREATE POLICY "Public read images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'spanish-images');

CREATE POLICY "Public read tiles"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'spanish-tiles');
```

#### 2.5 Indexes

Add indexes for performance:
```sql
CREATE INDEX idx_spanish_cuisine_release_date ON spanish_cuisine(release_date);
CREATE INDEX idx_spanish_leaderboard_date ON spanish_cuisine_leaderboard(dish_date);
CREATE INDEX idx_spanish_leaderboard_score ON spanish_cuisine_leaderboard(total_score DESC);
```

**Reference**: See `supabase/migrations/20251219154400_create_pasta_tables.sql` for complete migration example.

**Apply Migration**:
```bash
supabase db reset
```

---

### Step 3: Create Game Validators

**Location**: `src/engine/validators/`

**Files to Create:**
- CREATE: `src/engine/validators/spanishCuisineValidators.ts`

#### 3.1 Purpose

Validators check if a user's guess matches the correct answer and return structured results.

#### 3.2 Validator per Input Type

**Text Input Validator:**
```typescript
export function validateDishGuess(
  guess: string,
  gameItem: any
): { isCorrect: boolean; /* other fields */ } {
  // Normalize guess (lowercase, trim)
  // Check against name and acceptableGuesses array
  // Return { isCorrect, matchedName }
}
```

**Map Input Validator:**
```typescript
export function validateRegionGuess(
  selectedRegion: string,
  gameItem: any
): { isCorrect: boolean; distance: number; direction: string } {
  // Check if selectedRegion matches gameItem.region
  // Calculate distance/direction if wrong
  // Return { isCorrect, region, distance, direction }
}
```

**Numeric Input Validator:**
```typescript
export function validateCaloriesGuess(
  guess: number,
  gameItem: any
): { isCorrect: boolean; difference: number } {
  // Define tolerance (e.g., ±10%)
  // Check if within range
  // Return { isCorrect, guess, difference }
}
```

#### 3.3 Reference Examples

- **Text + Country + Numeric**: `src/engine/validators/fftValidators.ts`
- **Text + Region + Numeric**: `src/engine/validators/pastaValidators.ts`

**Tip**: Most validators can be copied and adapted from existing games.

---

### Step 4: Create API Endpoints

**Location**: `src/pages/api/{game}/`

**Files to Create:**
- CREATE: `src/pages/api/spanish/daily.ts`
- CREATE: `src/pages/api/spanish/leaderboard.ts`
- CREATE: `src/pages/api/spanish/tiles.ts` (if using tile reveals)

#### 4.1 Daily Game Endpoint

**File**: `src/pages/api/spanish/daily.ts`

**Purpose**: Returns today's (or archived) game item.

**Pattern**:
1. Parse date from query params (default to today)
2. Validate archive access if date is in past
3. Query database for item with matching `release_date`
4. Encrypt sensitive data (answers, metadata)
5. Return with cache headers

**Reference**: `src/pages/api/pasta/daily.ts`

**Response Structure**:
```typescript
{
  id: number,
  dish_image_url: string,
  region_coordinates: {...},
  _encrypted: string,  // Obfuscated answers
  _salt: string,
  _checksum: string
}
```

#### 4.2 Leaderboard Endpoint

**File**: `src/pages/api/spanish/leaderboard.ts`

**Purpose**:
- POST: Submit scores
- GET: Retrieve player stats

**Pattern**:
Use shared handlers from `src/utils/api/leaderboardHandlers.ts`:
```typescript
import { handleScoreSubmission, handleLeaderboardStats } from "@/utils/api/leaderboardHandlers";
import { spanishCuisineLeaderboardConfig } from "@/utils/api/leaderboardConfigs";

export default async function handler(req, res) {
  if (req.method === "POST") {
    return handleScoreSubmission(req, res, spanishCuisineLeaderboardConfig);
  }
  if (req.method === "GET") {
    return handleLeaderboardStats(req, res, spanishCuisineLeaderboardConfig);
  }
}
```

**Reference**: `src/pages/api/pasta/leaderboard.ts`

#### 4.3 Tile Reveal Endpoint (Optional)

**File**: `src/pages/api/spanish/tiles.ts`

**Purpose**: Return progressively revealed tile images based on guess count.

**When Needed**: Any phase with `revealsTiles: true`

**Pattern**:
1. Parse `phaseId` and `guessNumber` from query
2. Fetch tile image from storage bucket
3. Return image URL or pre-generated tiles

**Reference**: `src/pages/api/pasta/tiles.ts`

---

### Step 5: Configure Leaderboard Integration

**Location**: `src/utils/api/leaderboardConfigs.ts`

**Files to Modify:**
- MODIFY: `src/utils/api/leaderboardConfigs.ts`

#### 5.1 Add Leaderboard Config

Create a `LeaderboardConfig` object that maps your game's phases to database columns:

```typescript
export const spanishCuisineLeaderboardConfig: LeaderboardConfig = {
  tableName: "spanish_cuisine_leaderboard",
  dateField: "dish_date",
  idField: "dish_id",
  scoreFields: {
    dish: "dish_score",
    region: "region_score",
    calories: "calories_score"
  },
  guessFields: {
    dish: "dish_guesses",
    region: "region_guesses",
    calories: "calories_guesses"
  },
  analyticsEvent: "spanish_cuisine_score_submitted",
  validateScores: (scores) => Object.values(scores).every(s => s >= 0 && s <= 100)
};
```

**Purpose**: This config tells shared handlers how to map phase results to database columns.

**Reference**: Compare `fftLeaderboardConfig` vs `pastaLeaderboardConfig` in same file.

---

### Step 6: Create Score Submitter (Optional)

**Location**: `src/utils/`

**When Needed**: Most games can use shared handlers. Create custom submitter if you need:
- Special streak tracking
- Custom leaderboard stats
- Game-specific ranking logic

#### 6.1 Create Score Submitter Function

**File**: `src/utils/submitSpanishCuisineScore.ts`

**Pattern**:
```typescript
export async function submitSpanishCuisineScore(
  scores: { dish: number; region: number; calories: number },
  guessCount: { dish: number; region: number; calories: number },
  gameItem: any
): Promise<LeaderboardStats> {
  // Prepare submission payload
  // Call leaderboard API endpoint
  // Return stats
}
```

**Then reference in game config**:
```typescript
scoreSubmitter: {
  async submit(phaseResults, item, updateStreak) {
    // Extract scores and guess counts from phaseResults
    // Call submitSpanishCuisineScore
    // Return leaderboard stats
  }
}
```

**Reference**: `src/utils/submitPastaScore.ts` and usage in `src/config/games/italian-pasta.ts`

---

### Step 7: Create Game Types

**Location**: `src/types/`

**Files to Create:**
- CREATE: `src/types/spanish-cuisine.ts`

#### 7.1 Define TypeScript Interfaces

Create interfaces matching your database schema:

```typescript
export interface SpanishCuisineItem {
  id: number;
  name: string;
  acceptableGuesses: string[];
  dishImageUrl: string;
  dishAbout: string[];  // 6 hints
  region: string;
  regionCoordinates: { lat: number; lng: number };
  caloriesPerServing: number;
  originStory?: string;
  funFact?: string;
  releaseDate: string;
}
```

#### 7.2 Database Row Conversion

Create function to convert snake_case DB rows to camelCase app types:

```typescript
export function spanishCuisineRowToItem(row: any): SpanishCuisineItem {
  return {
    id: row.id,
    name: row.name,
    acceptableGuesses: row.acceptable_guesses || [],
    dishImageUrl: row.dish_image_url,
    dishAbout: row.dish_about || [],
    region: row.region,
    regionCoordinates: row.region_coordinates,
    caloriesPerServing: row.calories_per_serving,
    originStory: row.origin_story,
    funFact: row.fun_fact,
    releaseDate: row.release_date
  };
}
```

**Reference**: `src/types/pasta.ts`

---

### Step 8: Create Game UI Components (If Needed)

**When Needed**: Most games use shared components. Only create custom components if:
- Unique phase mechanics (not covered by text/map/numeric)
- Custom visualization requirements
- Game-specific interactions

**Shared Components** (already exist):
- `TextInput` - For text guessing phases
- `LocationInput` - For location-based text input (country/region)
- `MapGuessPhase` - For map-based guessing phases
- `ItalyRegionMap` - Regional map (can be adapted for Spanish regions)
- `NumberInput` - For numeric guessing
- `GamePhaseRenderer` - Orchestrates phase rendering

**Where to Look**:
- `src/components/inputs/` - Input components
- `src/components/game/phases/` - Phase-specific renderers
- `src/components/game/GamePhaseRenderer.tsx` - Phase orchestration

**Tip**: Check if existing components can be reused with configuration before building custom ones.

---

### Step 9: Update Feature Flags & Availability

**Files to Modify:**
- MODIFY: `src/config/games/spanish-cuisine.ts`

#### 9.1 Enable Game

Set availability in game config:

```typescript
export const spanishCuisineConfig: GameConfig = {
  // ... other config
  enabled: true,  // Set to false to hide game
  releaseDate: null,  // null = available now, or "2025-01-15" for future release
};
```

#### 9.2 Environment-Based Flags (Optional)

If you need environment-specific control:
```typescript
enabled: process.env.NEXT_PUBLIC_ENABLE_SPANISH_CUISINE === 'true'
```

---

## Optional Components & Features

These features are not required but enhance gameplay.

---

### 4.1 Tile-Based Image Reveals

**When to Use**: Phases with `revealsTiles: true`

#### Setup Required

1. **Storage Bucket**: Create `{game}-tiles` bucket (done in Step 2)

2. **Tile API Endpoint**: Create `src/pages/api/{game}/tiles.ts`

3. **Tile Generation**:
   - Pre-generate tiles (6 images showing progressive reveals)
   - Store in bucket: `{game}-tiles/{item_id}/tile_{1-6}.jpg`
   - Or generate on-demand with image processing

4. **Phase Config**:
```typescript
{
  revealsTiles: true,
  tileCount: 6,
  tileGrid: [3, 2]  // 3 columns × 2 rows
}
```

**How It Works**:
- Wrong guess 1 → Shows tile 1 (most blurred/partial)
- Wrong guess 2 → Shows tiles 1-2
- Wrong guess 6 → Shows all 6 tiles (full image)

**Reference**: Pasta game Phase 1 and Sauce phase

---

### 4.2 Hint/Clue System

**When to Use**: Phases with `revealsHints: true`

#### Setup Required

1. **Database Field**: Store hints as TEXT array (e.g., `dish_about[6]`)

2. **Phase Config**:
```typescript
{
  revealsHints: true
}
```

3. **Game-Level Hint Config**:
```typescript
hints: {
  type: "ingredient",  // or "metadata", "fact", etc.
  perWrongGuess: 1,    // Reveal 1 hint per wrong guess
  maxHints: 6          // Maximum hints available
}
```

**How It Works**:
- Hints stored in order (least helpful → most helpful)
- Each wrong guess reveals next hint
- Displayed in UI as progressive list

**Example** (Pasta game):
- Hint 1: "Contains durum wheat"
- Hint 2: "Tube-shaped"
- Hint 3: "From Campania region"
- ...

---

### 4.3 Map-Based Location Guessing

**When to Use**: Phases with `inputType: "country-map"` or `"region-map"`

#### Setup Required

1. **Database Fields**:
   - `{phase}` (TEXT) - Country/region name
   - `{phase}_coordinates` (JSONB) - `{ lat: number, lng: number }`

2. **Validator**: Returns distance and direction
```typescript
{
  isCorrect: false,
  distance: 523,  // km
  direction: "northeast"
}
```

3. **Phase Config**:
```typescript
{
  inputType: "region-map",  // or "country-map"
  maxGuesses: null,  // Usually unlimited for map phases
  getCorrectAnswer: (item) => ({
    answer: item.region,
    result: { region: item.region, isCorrect: true, distance: 0 }
  })
}
```

**Existing Maps**:
- **World Map**: `country-map` (F4T uses this)
- **Italy Regions**: `region-map` (Pasta uses this)
- **New Maps**: Create SVG map component for your regions (e.g., Spanish regions)

**Reference**:
- `src/components/game/phases/MapGuessPhase.tsx` - Phase renderer with map
- `src/components/inputs/LocationInput.tsx` - Location text input component
- `src/components/pasta/ItalyRegionMap.tsx` - Italian region map (adapt for Spanish regions)

---

### 4.4 Closed-List Validation

**When to Use**: Text input where only specific answers are valid (prevents typos/creative answers)

#### Setup Required

1. **Database Field**: `acceptable_guesses` TEXT[] array

2. **Phase Config**:
```typescript
{
  inputType: "text",
  enforceClosedList: true,
  acceptableGuessesField: "acceptableGuesses"  // or custom field name
}
```

3. **Validator**: Only check against acceptable list, not fuzzy matching

**Example**: Pasta game Phase 1 enforces closed list of ~150 pasta names to prevent "spaghetti-ish" guesses.

**Tradeoff**: Stricter validation but requires comprehensive acceptable guesses list.

---

### 4.5 Archive System

**When to Use**: Allow players to replay past games

#### Setup Required

1. **Archive Unlock Endpoint**: `src/pages/api/{game}/archive-unlock.ts`

2. **Available Dates Endpoint**: `src/pages/api/{game}/available-dates.ts`

3. **Archive Config**: Create in `src/utils/archiveConfig.ts`
```typescript
{
  cookieName: "spanish_cuisine_archives_unlock",
  storageKey: "spanish-archives-unlock",
  availableDatesEndpoint: "/api/spanish/available-dates",
  unlockEndpoint: "/api/spanish/archive-unlock",
  dailyEndpoint: "/api/spanish/daily",
  tableName: "spanish_cuisine",
  gameRoute: "/spanish"
}
```

4. **Daily Endpoint**: Validate archive token before returning past games

**How It Works**:
- User clicks "Play Archives"
- System generates time-limited token (24 hours)
- Token stored in HttpOnly cookie
- Daily endpoint validates token for past dates

**Reference**:
- `src/utils/api/archiveHandlers.ts`
- `src/utils/archiveAuth.ts`
- `src/pages/api/pasta/archive-unlock.ts`

**Tip**: Start without archives, add later if needed.

---

### 4.6 Custom Score Aggregation

**When to Use**: Complex scoring that can't be expressed as simple weighted average

#### Setup Required

1. **Create Calculator**: `src/utils/scoreCalculators/{game}ScoreCalculator.ts`

2. **Export Function**:
```typescript
export function calculateSpanishCuisineScore(scores: {
  dish: number;
  region: number;
  calories: number;
}): number {
  // Custom logic (bonuses, multipliers, etc.)
  return totalScore;
}
```

3. **Reference in Config**:
```typescript
scoreAggregator: (scores) => calculateSpanishCuisineScore({
  dish: scores.dish || 0,
  region: scores.region || 0,
  calories: scores.calories || 0
})
```

**Reference**: `src/utils/scoreCalculators/pastaScoreCalculator.ts`

**Most Games Don't Need This**: Simple weighted average works for 90% of cases.

---

## Database Migration Walkthrough

Detailed explanation of database schema patterns.

### 5.1 Schema Design Pattern

#### Primary Table Structure

Every game data table follows this pattern:

**Metadata (Always Required)**:
```sql
id BIGSERIAL PRIMARY KEY,
name TEXT NOT NULL,
acceptable_guesses TEXT[] DEFAULT '{}',
release_date DATE NOT NULL UNIQUE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

**Phase-Specific Fields** (varies by game):
- **Text phases**: `{phase}_image_url TEXT`, `{phase}_about TEXT[]` (hints)
- **Map phases**: `{phase} TEXT`, `{phase}_coordinates JSONB`
- **Numeric phases**: `{phase}_per_serving INTEGER`

**Content Fields** (optional):
```sql
origin_story TEXT,
fun_fact TEXT,
recipe JSONB
```

#### Constraints

**Data Integrity**:
```sql
CONSTRAINT {table}_name_not_empty CHECK (name <> ''),
CONSTRAINT {table}_unique_release_date UNIQUE (release_date),
CONSTRAINT {phase}_non_negative CHECK ({phase}_per_serving >= 0)
```

**Validation Functions** (optional):
```sql
CREATE TRIGGER validate_{table}_data
  BEFORE INSERT OR UPDATE ON {table}
  FOR EACH ROW
  EXECUTE FUNCTION validate_{table}_data();
```

#### Indexes

**Required for Performance**:
```sql
CREATE INDEX idx_{table}_release_date ON {table}(release_date);
CREATE INDEX idx_{table}_name ON {table}(name);
```

**For Array Fields**:
```sql
CREATE INDEX idx_{table}_{field} ON {table} USING GIN({field});
```

---

### 5.2 Leaderboard Table Pattern

#### Standard Structure

```sql
CREATE TABLE {game}_leaderboard (
  id BIGSERIAL PRIMARY KEY,
  {game}_date DATE NOT NULL,
  {game}_id BIGINT REFERENCES {game}(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,

  -- Per-phase scores (0-100)
  {phase1}_score INTEGER CHECK ({phase1}_score >= 0 AND {phase1}_score <= 100),
  {phase2}_score INTEGER CHECK ({phase2}_score >= 0 AND {phase2}_score <= 100),

  -- Per-phase guess counts
  {phase1}_guesses INTEGER CHECK ({phase1}_guesses >= 0),
  {phase2}_guesses INTEGER CHECK ({phase2}_guesses >= 0),

  -- Total
  total_score NUMERIC(5,2) DEFAULT 0 CHECK (total_score >= 0 AND total_score <= 100),

  -- Timestamps
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One score per player per day
  CONSTRAINT {game}_leaderboard_unique_session UNIQUE ({game}_date, session_id)
);
```

#### Indexes

```sql
CREATE INDEX idx_{game}_leaderboard_date ON {game}_leaderboard({game}_date);
CREATE INDEX idx_{game}_leaderboard_session ON {game}_leaderboard(session_id);
CREATE INDEX idx_{game}_leaderboard_score ON {game}_leaderboard(total_score DESC);
CREATE INDEX idx_{game}_leaderboard_daily_rank
  ON {game}_leaderboard({game}_date, total_score DESC);
```

---

### 5.3 RLS Policies

#### Game Data Table

**Public Read**:
```sql
CREATE POLICY "Public read {game}"
  ON {game} FOR SELECT
  USING (true);
```

**Service Role Manages**:
```sql
CREATE POLICY "Service role manages {game}"
  ON {game} FOR ALL
  USING (auth.role() = 'service_role');
```

#### Leaderboard Table

**Public Read**:
```sql
CREATE POLICY "Public read leaderboard"
  ON {game}_leaderboard FOR SELECT
  USING (true);
```

**Public Insert** (users submit scores):
```sql
CREATE POLICY "Users insert scores"
  ON {game}_leaderboard FOR INSERT
  WITH CHECK (true);
```

**Service Role Update/Delete**:
```sql
CREATE POLICY "Service role updates leaderboard"
  ON {game}_leaderboard FOR UPDATE
  USING (auth.role() = 'service_role');
```

#### Storage Policies

**Public Read Only**:
```sql
CREATE POLICY "Public read {game}-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = '{game}-images');
```

---

## Testing & Validation

### 6.1 Pre-Launch Checklist

Before launching your game, verify:

**Database**:
- [ ] Migrations run successfully (`supabase db reset`)
- [ ] Both tables created (`{game}` and `{game}_leaderboard`)
- [ ] Storage buckets created and public
- [ ] RLS policies enabled and working
- [ ] Constraints prevent invalid data

**Configuration**:
- [ ] Game config compiles without TypeScript errors
- [ ] Game ID added to `GameTypeId` union type
- [ ] Game registered in `GAME_REGISTRY`
- [ ] All phases configured correctly
- [ ] Score aggregator returns 0-100 range

**APIs**:
- [ ] Daily endpoint returns game item
- [ ] Leaderboard POST accepts scores
- [ ] Leaderboard GET returns stats
- [ ] Tiles endpoint works (if applicable)

**Validators**:
- [ ] Each phase has validator function
- [ ] Validators return correct result structure
- [ ] Edge cases handled (empty strings, null, special characters)

**Leaderboard**:
- [ ] Config maps phases to database columns correctly
- [ ] Field names match database schema exactly
- [ ] Score submission works end-to-end

**Types**:
- [ ] TypeScript interfaces match database schema
- [ ] Row-to-item conversion works
- [ ] No TypeScript errors in codebase

---

### 6.2 Manual Testing

**Test Each Phase**:

1. **Text Input Phase**:
   - [ ] Correct answer accepted
   - [ ] Acceptable guesses work
   - [ ] Typos handled appropriately
   - [ ] Hints reveal on wrong guesses (if enabled)
   - [ ] Tiles reveal on wrong guesses (if enabled)

2. **Map Input Phase**:
   - [ ] Correct region/country accepted
   - [ ] Distance/direction calculated for wrong guesses
   - [ ] Unlimited guesses work (if configured)

3. **Numeric Input Phase**:
   - [ ] Exact answer accepted
   - [ ] Tolerance range works (if applicable)
   - [ ] Feedback shows difference

**Test Score Flow**:
- [ ] Complete all phases
- [ ] Total score calculated correctly
- [ ] Score submission succeeds
- [ ] Leaderboard stats returned
- [ ] Percentile/rank calculated

**Test Edge Cases**:
- [ ] Play game twice (should prevent duplicate scores)
- [ ] Empty guesses rejected
- [ ] Invalid dates rejected
- [ ] Archive access without token blocked

---

### 6.3 Available Scripts

**Database Verification**:
```bash
npm run db:verify
```
Checks all tables, CRUD operations, and storage buckets.

**Type Checking**:
```bash
npm run typecheck
```
Ensures TypeScript compiles without errors.

**Linting**:
```bash
npm run lint
```
Code quality and style checks.

**Local Development**:
```bash
npm run dev
```
Start Next.js dev server (database should already be running).

**Database Operations**:
```bash
# Switch to local database
npm run use-local

# Apply migrations
supabase db reset

# View Supabase Studio
open http://127.0.0.1:54323
```

---

## Common Patterns & Gotchas

### 7.1 Decision Points (In Order of Importance)

Make these decisions **before** implementing:

1. **How many phases?**
   - Drives database schema complexity
   - Affects API routes and validators
   - Determines leaderboard table structure

2. **What input types per phase?**
   - Determines UI components needed
   - Affects validator complexity
   - May require custom map components

3. **Do phases reveal visual elements?**
   - Requires tile storage bucket
   - Needs tile API endpoint
   - Requires pre-generated tile images

4. **Is it competitive (leaderboard)?**
   - Requires leaderboard table
   - Needs score aggregation logic
   - Affects post-game UX

5. **Closed-list answers?**
   - Changes validator logic
   - Requires comprehensive acceptable guesses
   - Affects user experience (stricter)

6. **Custom scoring logic?**
   - Needs dedicated score calculator function
   - More complex than weighted average
   - Should be justified by game mechanics

---

### 7.2 Common Mistakes to Avoid

**Type Definition Errors**:
- ❌ Using new GameTypeId before adding to union type
- ✅ Add to `GameTypeId` union in `types.ts` first

**Database Mapping Errors**:
- ❌ Mismatched column names in leaderboard config
- ✅ Double-check `scoreFields` and `guessFields` match database exactly

**Storage Bucket Errors**:
- ❌ Forgetting to create storage buckets when using images
- ✅ Create buckets in migration before referencing in code

**RLS Policy Errors**:
- ❌ Forgetting RLS policies → 403 errors
- ✅ Enable RLS and add policies in same migration

**Validator Errors**:
- ❌ Not handling null/undefined in validators
- ✅ Add null checks and default values

**Migration Timestamp Errors**:
- ❌ Incorrect format or duplicate timestamps
- ✅ Use format `YYYYMMDDHHMMSS_description.sql`

**Over-Engineering**:
- ❌ Creating game-specific code when shared utilities exist
- ✅ Check existing games for reusable patterns first

---

### 7.3 When to Reuse vs Create

**Reuse**:
- ✅ Validator patterns (text, numeric, map)
- ✅ API endpoint structure
- ✅ Leaderboard handlers
- ✅ Score submission flow
- ✅ RLS policy patterns
- ✅ UI input components

**Create New**:
- ✅ Game configuration file
- ✅ Database schema (game-specific fields)
- ✅ Phase-specific validators (if logic differs significantly)
- ✅ Custom score calculator (if needed)
- ✅ TypeScript interfaces (match your schema)

**Ask Yourself**:
> "Is this logic specific to my game, or could any game use it?"
- If **game-specific** → Create custom implementation
- If **generic** → Use or extend shared utilities

---

## Real Example: Spanish Cuisine Game

Complete walkthrough of creating "Adivina la Comida" game.

### Game Overview

**Identity**:
- **Name**: "Adivina la Comida"
- **Game ID**: `spanish-cuisine`
- **URL**: `/spanish`
- **Icon**: 🥘
- **Description**: "A daily Spanish cuisine game. Identify the dish, its region, and nutritional content."

**Phases**:
1. **Dish** (text, 6 guesses, tiles + hints)
2. **Region** (region-map, unlimited guesses)
3. **Calories** (numeric, 4 guesses)

**Scoring**: Equal weighting (33.33% per phase)

**Features**: Tiles, hints, leaderboard (no archive)

---

### Files to Create/Modify

**Phase 1 - Foundation**:

1. **MODIFY**: `src/config/games/types.ts`
   - Add `"spanish-cuisine"` to `GameTypeId`
   - Add `SpanishCuisinePhaseId` type

2. **CREATE**: `src/config/games/spanish-cuisine.ts`
   - Full `GameConfig` object with 3 phases

3. **MODIFY**: `src/config/games/index.ts`
   - Import and add to `GAME_REGISTRY`

4. **CREATE**: `supabase/migrations/20250101120000_create_spanish_cuisine_tables.sql`
   - `spanish_cuisine` table
   - `spanish_cuisine_leaderboard` table
   - Storage buckets
   - RLS policies

5. **CREATE**: `src/types/spanish-cuisine.ts`
   - `SpanishCuisineItem` interface
   - `spanishCuisineRowToItem()` function

**Phase 2 - Core Logic**:

6. **CREATE**: `src/engine/validators/spanishCuisineValidators.ts`
   - `validateDishGuess()`
   - `validateRegionGuess()`
   - `validateCaloriesGuess()`

7. **MODIFY**: `src/utils/api/leaderboardConfigs.ts`
   - Add `spanishCuisineLeaderboardConfig`

8. **CREATE**: `src/pages/api/spanish/daily.ts`
   - Daily game endpoint

9. **CREATE**: `src/pages/api/spanish/leaderboard.ts`
   - Score submission endpoint

10. **CREATE**: `src/pages/api/spanish/tiles.ts`
    - Tile reveal endpoint (for dish phase)

**Phase 3 - UI** (if custom map needed):

11. **CREATE**: `src/components/spanish/SpainRegionMap.tsx` (optional)
    - SVG map of Spanish regions
    - Follow pattern from `ItalyRegionMap.tsx`

---

### Database Schema Example

**spanish_cuisine table**:
```sql
CREATE TABLE spanish_cuisine (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  acceptable_guesses TEXT[] DEFAULT '{}',

  -- Phase 1: Dish
  dish_image_url TEXT NOT NULL,
  dish_about TEXT[6],  -- Ingredient hints

  -- Phase 2: Region
  region TEXT NOT NULL,
  region_coordinates JSONB NOT NULL,  -- { lat: 40.4168, lng: -3.7038 }

  -- Phase 3: Calories
  calories_per_serving INTEGER NOT NULL,

  -- Content
  origin_story TEXT,
  fun_fact TEXT,

  -- Metadata
  release_date DATE NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT spanish_cuisine_name_not_empty CHECK (name <> ''),
  CONSTRAINT spanish_cuisine_calories_positive CHECK (calories_per_serving > 0)
);
```

**spanish_cuisine_leaderboard table**:
```sql
CREATE TABLE spanish_cuisine_leaderboard (
  id BIGSERIAL PRIMARY KEY,
  dish_date DATE NOT NULL,
  dish_id BIGINT REFERENCES spanish_cuisine(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,

  -- Phase scores
  dish_score INTEGER CHECK (dish_score >= 0 AND dish_score <= 100),
  region_score INTEGER CHECK (region_score >= 0 AND region_score <= 100),
  calories_score INTEGER CHECK (calories_score >= 0 AND calories_score <= 100),

  -- Phase guesses
  dish_guesses INTEGER CHECK (dish_guesses >= 0 AND dish_guesses <= 6),
  region_guesses INTEGER CHECK (region_guesses >= 0),
  calories_guesses INTEGER CHECK (calories_guesses >= 0 AND calories_guesses <= 4),

  -- Total
  total_score NUMERIC(5,2) DEFAULT 0 CHECK (total_score >= 0 AND total_score <= 100),

  -- Timestamps
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One score per player per day
  CONSTRAINT spanish_cuisine_unique_session UNIQUE (dish_date, session_id)
);
```

---

### Configuration Outline

**src/config/games/spanish-cuisine.ts**:

```typescript
export const spanishCuisineConfig: GameConfig = {
  id: "spanish-cuisine",
  name: "Adivina la Comida",
  description: "A daily Spanish cuisine game...",
  urlPath: "/spanish",
  icon: "🥘",
  architecture: "unified",

  scoreAggregator: (scores) => {
    // Equal weighting: 33.33% each
    const avg = (scores.dish + scores.region + scores.calories) / 3;
    return Math.round(avg * 100) / 100;
  },

  scoreSubmitter: spanishCuisineScoreSubmitter,  // Custom or use shared

  phases: [
    {
      id: "dish",
      title: "🥘 Guess the Dish",
      inputType: "text",
      maxGuesses: 6,
      revealsTiles: true,
      revealsHints: true,
      tileCount: 6,
      tileGrid: [3, 2],
      baseScore: 100,
      penaltyPerGuess: 15,
      // ... other fields
    },
    {
      id: "region",
      title: "🇪🇸 Guess the Region",
      inputType: "region-map",
      maxGuesses: null,  // Unlimited
      revealsTiles: false,
      revealsHints: false,
      baseScore: 100,
      penaltyPerGuess: 15,
      getCorrectAnswer: (item) => ({ answer: item.region, ... })
      // ... other fields
    },
    {
      id: "calories",
      title: "🔥 Guess the Calories",
      inputType: "numeric",
      maxGuesses: 4,
      baseScore: 100,
      penaltyPerGuess: 20,
      // ... other fields
    }
  ],

  hints: {
    type: "ingredient",
    perWrongGuess: 1,
    maxHints: 6
  },

  postGameContent: {
    type: "recipe",
    title: "Recipe"
  },

  tableName: "spanish_cuisine",
  apiPrefix: "/api/spanish",
  storageKeyPrefix: "fft-spanish-state",
  enabled: true,
  releaseDate: null
};
```

---

## Reference Checklist

Key files to reference when building your game:

### Core Type Definitions
- **`src/config/games/types.ts`** - All interfaces (`GameConfig`, `PhaseConfig`, etc.)

### Example Game Configs
- **`src/config/games/food-for-thought.ts`** - Simple 3-phase game (good starting point)
- **`src/config/games/italian-pasta.ts`** - Complex 4-phase game with all features

### Game Registry
- **`src/config/games/index.ts`** - Where games are registered and exported

### Database Examples
- **`supabase/migrations/20251219154400_create_pasta_tables.sql`** - Complete migration (339 lines)
- **`supabase/migrations/20251219154300_create_game_scores_table.sql`** - Simpler leaderboard table

### Type Conversion
- **`src/types/pasta.ts`** - Database row to TypeScript type pattern

### Validators
- **`src/engine/validators/fftValidators.ts`** - Text + Country + Numeric validation
- **`src/engine/validators/pastaValidators.ts`** - Text (closed-list) + Region + Numeric

### API Patterns
- **`src/pages/api/pasta/daily.ts`** - Daily game endpoint
- **`src/pages/api/pasta/leaderboard.ts`** - Score submission endpoint
- **`src/pages/api/pasta/tiles.ts`** - Tile reveal endpoint

### Leaderboard Configuration
- **`src/utils/api/leaderboardConfigs.ts`** - Phase-to-database column mapping
- **`src/utils/api/leaderboardHandlers.ts`** - Shared POST/GET handlers

### Score Submission
- **`src/utils/submitPastaScore.ts`** - Custom score submitter example
- **`src/utils/api/fftScoreSubmitter.ts`** - Simpler score submitter

### Score Calculation
- **`src/utils/scoreCalculators/pastaScoreCalculator.ts`** - Custom score aggregation

### Archive System
- **`src/utils/archiveAuth.ts`** - Archive token validation
- **`src/utils/api/archiveHandlers.ts`** - Available dates and unlock handlers

### Database Operations
- **`docs/DATABASE.md`** - Complete database guide (migrations, verification, etc.)

### UI Components
- **`src/components/inputs/TextInput.tsx`** - Text guessing input
- **`src/components/inputs/LocationInput.tsx`** - Location-based text input (used with maps)
- **`src/components/game/phases/MapGuessPhase.tsx`** - Map-based guessing phase renderer
- **`src/components/pasta/ItalyRegionMap.tsx`** - Regional map example (Italian regions)
- **`src/components/inputs/NumberInput.tsx`** - Numeric guessing input
- **`src/components/game/GamePhaseRenderer.tsx`** - Phase orchestration

---

## Troubleshooting

Common issues and solutions:

### TypeScript Compilation Errors

**Error**: `Type '"spanish-cuisine"' is not assignable to type 'GameTypeId'`

**Solution**: Add your game ID to the union type in `src/config/games/types.ts`:
```typescript
export type GameTypeId = "food-for-thought" | "italian-pasta" | "spanish-cuisine";
```

---

### Leaderboard Submission Failures

**Error**: `Column "dish_score" does not exist`

**Solution**: Check leaderboard config field names match database exactly:
```typescript
// In leaderboardConfigs.ts
scoreFields: {
  dish: "dish_score",  // Must match column name in database
}
```

---

### Database Permission Errors

**Error**: `403 Forbidden` when querying data

**Solution**: Ensure RLS policies are created:
```sql
-- Enable RLS
ALTER TABLE spanish_cuisine ENABLE ROW LEVEL SECURITY;

-- Add public read policy
CREATE POLICY "Public read" ON spanish_cuisine FOR SELECT USING (true);
```

---

### Migration Errors

**Error**: `relation "spanish_cuisine" already exists`

**Solution**: Reset database for clean state:
```bash
supabase db reset
```

Or drop table manually:
```sql
DROP TABLE IF EXISTS spanish_cuisine CASCADE;
```

---

### Images Not Loading

**Possible Causes**:

1. **Bucket not public**:
   - Check Supabase dashboard → Storage → Bucket settings
   - Ensure "Public bucket" is enabled

2. **Missing storage policy**:
```sql
CREATE POLICY "Public read images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'spanish-images');
```

3. **Next.js image domains**:
   - Add Supabase domain to `next.config.js`:
```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '*.supabase.co',
    }
  ]
}
```

---

### Validator Not Working

**Error**: Correct guesses marked as wrong

**Solution**: Check validator normalization:
```typescript
const normalizedGuess = guess.toLowerCase().trim();
const normalizedName = gameItem.name.toLowerCase().trim();
```

Also check `acceptableGuesses` array includes all variations:
```typescript
acceptableGuesses: ["paella", "paella valenciana", "valencian paella"]
```

---

### Game Not Appearing in UI

**Possible Causes**:

1. **Not enabled**: Check `enabled: true` in config

2. **Not registered**: Ensure added to `GAME_REGISTRY` in `index.ts`

3. **Future release date**: Check `releaseDate` is `null` or past date

4. **TypeScript error**: Run `npm run typecheck` to find compilation issues

---

### API 404 Errors

**Error**: `404 Not Found` on `/api/spanish/daily`

**Solution**: Verify file exists at `src/pages/api/spanish/daily.ts` and exports default handler:
```typescript
export default async function handler(req, res) {
  // ... handler code
}
```

---

### Score Calculation Wrong

**Issue**: Total score doesn't match expected value

**Solution**: Check score aggregator math:
```typescript
scoreAggregator: (scores) => {
  const total = (scores.dish || 0) * 0.33 +
                (scores.region || 0) * 0.33 +
                (scores.calories || 0) * 0.34;
  return Math.round(total * 100) / 100;  // Round to 2 decimals
}
```

Ensure weights sum to 1.0 (100%).

---

### Development Server Issues

**Error**: `ECONNREFUSED` when calling API

**Solution**: Ensure both services running:
```bash
# Terminal 1: Supabase (database)
supabase start

# Terminal 2: Next.js (app)
npm run dev
```

Check Supabase is accessible:
```bash
curl http://127.0.0.1:54321/rest/v1/
```

---

## Summary

You now have a complete blueprint for creating new games in the Food for Thought platform. The architecture is designed for **rapid game development** through configuration rather than custom code.

### Quick Start Checklist

1. ✅ Make all pre-implementation decisions (Section 2)
2. ✅ Create game config file (Step 1)
3. ✅ Create database migration (Step 2)
4. ✅ Create validators (Step 3)
5. ✅ Create API endpoints (Step 4)
6. ✅ Configure leaderboard (Step 5)
7. ✅ Test end-to-end (Section 6)
8. ✅ Enable game (Step 9)

### Key Principles

- **Config-driven**: Most behavior defined in `GameConfig`, not code
- **Reuse shared utilities**: Validators, handlers, components
- **Reference existing games**: F4T (simple), Pasta (complex)
- **Start minimal**: Add features incrementally
- **Test thoroughly**: Database → APIs → UI → Scoring

### Need Help?

- **Database issues**: See `docs/DATABASE.md`
- **Code examples**: Reference F4T and Pasta games
- **Architecture questions**: Review `src/config/games/types.ts`
- **Troubleshooting**: See Section 10

Good luck building your game! 🎮
