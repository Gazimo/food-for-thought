import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import AIService from "../src/services/aiService";
import DishImageService from "../src/services/dishImageService";
import { getCountryCoordsMap } from "../src/utils/countries";
import { sampleCountriesWeighted } from "../src/data/continentGroups";
import { proposeDishCandidates } from "./agents/propose-dish";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  if (!supabaseUrl) console.error("  - NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseServiceKey) console.error("  - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Configuration
const TARGET_BUFFER_DAYS = parseInt(process.env.TARGET_BUFFER_DAYS || "14", 10);
const RECENT_DAYS_BLOCK = parseInt(process.env.RECENT_DAYS_BLOCK || "60", 10);
const MAX_DISHES_PER_RUN = 10;
const DAILY_COST_CAP_USD = parseFloat(process.env.DAILY_COST_CAP_USD || "0.50");

// Utility functions
function normalize(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function titleCase(s: string): string {
  return (s || "")
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

// Types
type Candidate = {
  name: string;
  country: string;
  source: "backlog" | "ai";
  existsInDb: boolean;
};

type DishRecord = {
  id: number;
  name: string;
  acceptable_guesses: string[] | null;
  country: string;
  release_date: string;
};

// Database queries
async function queryFutureDishes(supabase: any): Promise<DishRecord[]> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("dishes")
    .select("id,name,acceptable_guesses,country,release_date")
    .gte("release_date", today);
  if (error) throw error;
  return data || [];
}

async function queryPastDishesFromCountries(
  supabase: any,
  countries: string[]
): Promise<DishRecord[]> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("dishes")
    .select("id,name,acceptable_guesses,country,release_date")
    .lt("release_date", today)
    .in("country", countries);
  if (error) throw error;
  return data || [];
}

async function queryRecentDishes(
  supabase: any,
  days: number
): Promise<DishRecord[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("dishes")
    .select("id,name,acceptable_guesses,country,release_date")
    .gte("release_date", cutoffStr);
  if (error) throw error;
  return data || [];
}

async function queryAllDishes(supabase: any): Promise<DishRecord[]> {
  const { data, error } = await supabase
    .from("dishes")
    .select("id,name,acceptable_guesses,country,release_date")
    .order("release_date", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function countBufferDays(supabase: any): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("dishes")
    .select("release_date")
    .gte("release_date", today)
    .order("release_date", { ascending: true });
  if (error || !data) return 0;
  const last = data[data.length - 1]?.release_date;
  if (!last) return 0;
  const diff = Math.ceil(
    (new Date(String(last)).getTime() - new Date(today).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  return Math.max(diff, 0);
}

async function getNextReleaseDate(supabase: any): Promise<string> {
  const { data, error } = await supabase
    .from("dishes")
    .select("release_date")
    .order("release_date", { ascending: false })
    .limit(1);
  const base =
    error || !data || data.length === 0
      ? new Date()
      : new Date(String(data[0].release_date));
  base.setDate(base.getDate() + 1);
  return base.toISOString().split("T")[0];
}

// Build blocked dishes list (human-readable names)
function buildBlockedDishList(dishes: DishRecord[]): string[] {
  const names = new Set<string>();
  for (const dish of dishes) {
    names.add(dish.name);
    // Also add acceptable guesses
    if (dish.acceptable_guesses) {
      for (const guess of dish.acceptable_guesses) {
        names.add(guess);
      }
    }
  }
  return Array.from(names);
}

// Check if a candidate is blocked (using normalized comparison)
function isBlocked(candidateName: string, blockedList: string[]): boolean {
  const normCandidate = normalize(candidateName);
  return blockedList.some((blocked) => normalize(blocked) === normCandidate);
}

// Check if dish exists in full database
function existsInDatabase(candidateName: string, allDishes: DishRecord[]): boolean {
  const normCandidate = normalize(candidateName);
  for (const dish of allDishes) {
    if (normalize(dish.name) === normCandidate) return true;
    if (dish.acceptable_guesses) {
      for (const guess of dish.acceptable_guesses) {
        if (normalize(guess) === normCandidate) return true;
      }
    }
  }
  return false;
}

// Load backlog from file
function loadBacklog(): Array<{ name: string; country?: string }> {
  const backlogPath = path.resolve(__dirname, "../src/data/dish_backlog.json");
  if (!fs.existsSync(backlogPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(backlogPath, "utf-8"));
  } catch {
    return [];
  }
}

function removeFromBacklog(consumedName: string): void {
  const backlogPath = path.resolve(__dirname, "../src/data/dish_backlog.json");
  if (!fs.existsSync(backlogPath)) return;
  try {
    const backlog = JSON.parse(fs.readFileSync(backlogPath, "utf-8")) as Array<{
      name: string;
      country?: string;
    }>;
    const remaining = backlog.filter(
      (x) => normalize(x.name) !== normalize(consumedName)
    );
    fs.writeFileSync(backlogPath, JSON.stringify(remaining, null, 2));
  } catch {}
}

// Validate country has coordinates
function countryValid(country: string): boolean {
  if (!country) return false;
  const coords = getCountryCoordsMap();
  const key = country.toLowerCase().replace(/\s+/g, "");
  return Boolean(coords[key]);
}

// Deterministic evaluation of generated dish
function deterministicEvaluate(draft: {
  name: string;
  country: string;
  ingredients: string[];
  blurb: string;
  proteinPerServing: number;
  recipe: { ingredients: string[]; instructions: string[] };
  tags: string[];
}): { accept: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const countryOk = /^[A-Z][a-z]*(\s[A-Z][a-z]*)*$/.test(draft.country);
  if (!countryOk) reasons.push("country not Title Case");
  const blurbHasCountry = new RegExp(`\\b${draft.country}\\b`, "i").test(
    draft.blurb || ""
  );
  if (blurbHasCountry) reasons.push("blurb contains country");
  if (!draft.ingredients || draft.ingredients.length !== 6)
    reasons.push("ingredients must be exactly 6");
  if (!draft.recipe || (draft.recipe.ingredients || []).length < 6)
    reasons.push("recipe.ingredients must be >= 6");
  if (!draft.recipe || (draft.recipe.instructions || []).length < 6)
    reasons.push("instructions must be >= 6 steps");
  if (!draft.tags || draft.tags.length < 3 || draft.tags.length > 6)
    reasons.push("tags must be 3-6 items");
  return { accept: reasons.length === 0, reasons };
}

function stripCountryFromBlurb(blurb: string, country: string): string {
  let b = blurb || "";
  const words = (country || "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);
  for (const w of words) {
    b = b.replace(new RegExp(`\\b${w}\\b`, "gi"), " ");
  }
  if (country) b = b.replace(new RegExp(`\\b${country}\\b`, "gi"), " ");
  return b.replace(/\s{2,}/g, " ").trim();
}

// Main function
async function main() {
  const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

  // Step 1: Check buffer and calculate how many dishes we need
  const bufferDays = await countBufferDays(supabase);
  console.log(
    `📅 Current buffer: ${bufferDays} days (target: ${TARGET_BUFFER_DAYS})`
  );

  if (bufferDays >= TARGET_BUFFER_DAYS) {
    console.log("✅ Buffer sufficient. Skipping generation.");
    return;
  }

  const dishesNeeded = TARGET_BUFFER_DAYS - bufferDays;
  const dishesToRequest = Math.min(dishesNeeded + 5, MAX_DISHES_PER_RUN);
  console.log(`🎯 Need ${dishesNeeded} dishes, requesting ${dishesToRequest} from AI`);

  // Step 2: Sample countries (15 total with weighted distribution)
  const sampledCountries = sampleCountriesWeighted();
  console.log(`🌍 Sampled ${sampledCountries.length} countries:`, sampledCountries.join(", "));

  // Step 3: Build DISHES_BLOCKED_LIST
  console.log("\n📋 Building blocked dishes list...");

  // Query A: Future/buffer dishes
  const futureDishes = await queryFutureDishes(supabase);
  console.log(`  - Future dishes: ${futureDishes.length}`);

  // Query B: Past dishes from sampled countries
  const pastFromSampledCountries = await queryPastDishesFromCountries(
    supabase,
    sampledCountries
  );
  console.log(`  - Past dishes from sampled countries: ${pastFromSampledCountries.length}`);

  // Query C: Recent dishes (any country, last N days)
  const recentDishes = await queryRecentDishes(supabase, RECENT_DAYS_BLOCK);
  console.log(`  - Recent dishes (last ${RECENT_DAYS_BLOCK} days): ${recentDishes.length}`);

  // Combine and deduplicate
  const allBlockedDishes = [
    ...futureDishes,
    ...pastFromSampledCountries,
    ...recentDishes,
  ];
  const blockedDishNames = buildBlockedDishList(allBlockedDishes);
  console.log(`  - Total blocked dish names: ${blockedDishNames.length}`);

  // Also query full database for existence check (used in sorting)
  const allDishes = await queryAllDishes(supabase);
  console.log(`  - Total dishes in database: ${allDishes.length}`);

  // Step 4: Get AI proposals
  console.log("\n🤖 Getting AI dish proposals...");
  const aiProposals = await proposeDishCandidates({
    countries: sampledCountries,
    blockedDishes: blockedDishNames,
    maxSuggestions: dishesToRequest,
  });

  // Step 4b: Load backlog items
  const backlog = loadBacklog();
  console.log(`📦 Backlog items: ${backlog.length}`);

  // Build candidate list: backlog first, then AI proposals
  const candidates: Candidate[] = [];

  // Add backlog items (filtered, with country validation)
  for (const item of backlog) {
    if (!item.country || !countryValid(item.country)) continue;
    candidates.push({
      name: item.name,
      country: item.country,
      source: "backlog",
      existsInDb: existsInDatabase(item.name, allDishes),
    });
  }

  // Add AI proposals
  for (const proposal of aiProposals) {
    if (!countryValid(proposal.country)) continue;
    candidates.push({
      name: proposal.name,
      country: proposal.country,
      source: "ai",
      existsInDb: existsInDatabase(proposal.name, allDishes),
    });
  }

  // Deduplicate by normalized name
  const seen = new Set<string>();
  const dedupedCandidates: Candidate[] = [];
  for (const c of candidates) {
    const key = normalize(c.name);
    if (seen.has(key)) continue;
    seen.add(key);
    dedupedCandidates.push(c);
  }

  console.log(`\n📝 Total candidates before filtering: ${dedupedCandidates.length}`);

  // Step 5: Filter and sort candidates
  // 5a: Filter OUT any dish in DISHES_BLOCKED_LIST
  const filteredCandidates = dedupedCandidates.filter((c) => {
    const blocked = isBlocked(c.name, blockedDishNames);
    if (blocked) {
      console.log(`  ⛔ Blocked: ${c.name}`);
    }
    return !blocked;
  });

  if (filteredCandidates.length === 0) {
    console.log("\n⚠️ All suggested dishes are in the blocked list. No dishes to generate.");
    return;
  }

  // 5b: Sort - new dishes first, existing (repeatable) dishes last
  filteredCandidates.sort((a, b) => {
    // New dishes (existsInDb = false) come first
    if (a.existsInDb !== b.existsInDb) {
      return a.existsInDb ? 1 : -1;
    }
    // Backlog items come before AI items within same category
    if (a.source !== b.source) {
      return a.source === "backlog" ? -1 : 1;
    }
    return 0;
  });

  // 5c: Take only as many as needed
  const candidatesToGenerate = filteredCandidates.slice(0, dishesNeeded);
  console.log(`\n🎯 Will attempt to generate ${candidatesToGenerate.length} dishes:`);
  for (const c of candidatesToGenerate) {
    const status = c.existsInDb ? "(repeat)" : "(new)";
    console.log(`  - ${c.name} [${c.country}] ${status} (${c.source})`);
  }

  // Step 6: Generation loop
  const ai = new AIService();
  const imageService = new DishImageService();
  let successCount = 0;
  let spent = 0;
  let nextReleaseDate = await getNextReleaseDate(supabase);

  for (const candidate of candidatesToGenerate) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🔄 Generating: ${candidate.name} (${candidate.country})`);

    // Check budget
    if (spent >= DAILY_COST_CAP_USD) {
      console.log(`⚠️ Budget exhausted ($${spent.toFixed(2)}). Stopping.`);
      break;
    }

    try {
      // Generate dish text
      const textOnly = await ai.generateCompleteDish(candidate.name);
      if (!textOnly) {
        console.log("❌ Text generation failed, skipping.");
        if (candidate.source === "backlog") removeFromBacklog(candidate.name);
        continue;
      }

      // Sanitize
      const countryTitle = titleCase(textOnly.country || candidate.country);
      const sanitizedBlurb = stripCountryFromBlurb(
        textOnly.blurb || "",
        countryTitle
      );
      const sanitizedTopIngredients = (textOnly.ingredients || []).slice(0, 6);

      // Evaluate
      const evalResult = deterministicEvaluate({
        name: textOnly.name,
        country: countryTitle,
        ingredients: sanitizedTopIngredients,
        blurb: sanitizedBlurb,
        proteinPerServing: textOnly.proteinPerServing,
        recipe: textOnly.recipe,
        tags: textOnly.tags,
      });

      if (!evalResult.accept) {
        console.log("❌ Evaluator rejected:", evalResult.reasons.join("; "));
        if (candidate.source === "backlog") removeFromBacklog(candidate.name);
        continue;
      }

      // Generate image
      const imageResult = await imageService.generateDishImage({
        name: textOnly.name,
        ingredients: sanitizedTopIngredients,
        country: countryTitle,
        blurb: sanitizedBlurb,
        tags: textOnly.tags,
      });

      spent += imageResult.cost || 0.04;

      // Compute coordinates
      const coordsMap = getCountryCoordsMap();
      const normCountry = countryTitle.toLowerCase().replace(/\s+/g, "");
      let coords: { lat: number; lng: number } | null =
        (coordsMap as any)[normCountry] || null;
      if (!coords) {
        for (const [countryKey, value] of Object.entries(coordsMap)) {
          if (
            countryKey.includes(normCountry) ||
            normCountry.includes(countryKey)
          ) {
            coords = value as any;
            break;
          }
        }
      }
      const coordinatesString = coords ? `(${coords.lng},${coords.lat})` : null;

      // Insert to database
      const dishToInsert = {
        name: textOnly.name,
        acceptable_guesses: textOnly.acceptableGuesses,
        country: countryTitle,
        image_url: imageResult.imageUrl || null,
        ingredients: sanitizedTopIngredients,
        blurb: sanitizedBlurb,
        fun_fact: textOnly.funFact || null,
        protein_per_serving: textOnly.proteinPerServing || 0,
        recipe: textOnly.recipe,
        tags: textOnly.tags || [],
        release_date: nextReleaseDate,
        coordinates: coordinatesString,
        region: null,
      };

      console.log(`💾 Saving to database for ${nextReleaseDate}...`);
      const { data, error } = await supabase
        .from("dishes")
        .insert([dishToInsert])
        .select();

      if (error) {
        console.error("❌ Database error:", error.message);
        continue;
      }

      const savedDish = data?.[0];
      console.log(`✅ Dish saved with ID: ${savedDish?.id}`);

      // Generate tiles
      if (savedDish && savedDish.id && imageResult.imageUrl) {
        console.log("🔲 Generating tiles...");
        try {
          await generateTiles(supabase, savedDish.id, imageResult.imageUrl);
          console.log("✅ Tiles generated successfully");
        } catch (e) {
          console.error("❌ Failed to generate tiles:", e);
        }
      }

      // Remove from backlog after success
      if (candidate.source === "backlog") {
        removeFromBacklog(candidate.name);
      }

      successCount++;

      // Increment release date for next dish
      const nextDate = new Date(nextReleaseDate);
      nextDate.setDate(nextDate.getDate() + 1);
      nextReleaseDate = nextDate.toISOString().split("T")[0];

    } catch (e) {
      console.error(`❌ Error generating ${candidate.name}:`, e);
      if (candidate.source === "backlog") removeFromBacklog(candidate.name);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`🎉 Generation complete! ${successCount}/${candidatesToGenerate.length} dishes saved.`);
  console.log(`💰 Total spent: $${spent.toFixed(2)}`);
}

// Tile generation helper
async function generateTiles(
  supabase: any,
  dishId: number,
  imageUrl: string
): Promise<void> {
  const { default: Sharp } = await import("sharp");

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageUrl}`);
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

  const image = (Sharp as any)(imageBuffer);
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height)
    throw new Error("Invalid image metadata");

  const targetAspectRatio = 3 / 2;
  const currentAspectRatio = metadata.width / metadata.height;
  let resizeWidth: number;
  let resizeHeight: number;
  if (currentAspectRatio > targetAspectRatio) {
    resizeHeight = metadata.height;
    resizeWidth = Math.round(resizeHeight * targetAspectRatio);
  } else {
    resizeWidth = metadata.width;
    resizeHeight = Math.round(resizeWidth / targetAspectRatio);
  }

  const cols = 3;
  const rows = 2;
  for (let tileIndex = 0; tileIndex < 6; tileIndex++) {
    const row = Math.floor(tileIndex / cols);
    const col = tileIndex % cols;
    const tileWidth = Math.floor(resizeWidth / cols);
    const tileHeight = Math.floor(resizeHeight / rows);
    const left = col * tileWidth;
    const top = row * tileHeight;
    const actualWidth = col === cols - 1 ? resizeWidth - left : tileWidth;
    const actualHeight = row === rows - 1 ? resizeHeight - top : tileHeight;

    const baseImage = image.resize(resizeWidth, resizeHeight, {
      fit: "cover",
      position: "center",
    });
    const regularTileBuffer = await baseImage
      .clone()
      .extract({ left, top, width: actualWidth, height: actualHeight })
      .jpeg({ quality: 92, progressive: false })
      .toBuffer();

    const blurredTileBuffer = await baseImage
      .clone()
      .extract({ left, top, width: actualWidth, height: actualHeight })
      .blur(40)
      .modulate({ brightness: 0.8, saturation: 0.6 })
      .jpeg({ quality: 40 })
      .toBuffer();

    const filenameRegular = `tiles/${dishId}/regular-${tileIndex}.jpg`;
    const filenameBlurred = `tiles/${dishId}/blurred-${tileIndex}.jpg`;

    const { error: upErr1 } = await supabase.storage
      .from("dish-tiles")
      .upload(filenameRegular, regularTileBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });
    if (upErr1) throw new Error(upErr1.message);

    const { error: upErr2 } = await supabase.storage
      .from("dish-tiles")
      .upload(filenameBlurred, blurredTileBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });
    if (upErr2) throw new Error(upErr2.message);
  }
}

main().catch((e) => {
  console.error("💥 Error in daily generator:", e);
  process.exit(1);
});
