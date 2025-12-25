import { config } from "dotenv";
config({ path: ".env.local" }); // local development

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import italianRegions from "../public/data/italian-regions.json";
import { calculateDistance } from "../src/utils/gameHelpers";
import type { PastaInsert } from "../src/types/pasta";
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import PastaImageService from "../src/services/pastaImageService";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  if (!supabaseUrl) console.error("  - NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseServiceKey) console.error("  - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!geminiApiKey) {
  console.error("❌ GEMINI_API_KEY not set. Cannot generate pasta.");
  process.exit(1);
}

// Initialize Gemini SDK
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

// Configuration
// const TARGET_BUFFER_DAYS = parseInt(process.env.TARGET_BUFFER_DAYS || "14", 10);
const TARGET_BUFFER_DAYS = 1;
const MAX_PASTA_PER_RUN = 10;
const DAILY_COST_CAP_USD = parseFloat(process.env.DAILY_COST_CAP_USD || "0.50");

// Debug directory for validation failures
const DEBUG_DIR = path.resolve(__dirname, "../debug/pasta-failures");
if (!fs.existsSync(DEBUG_DIR)) {
  fs.mkdirSync(DEBUG_DIR, { recursive: true });
}

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

// Helper functions for Italian regions
type RegionData = {
  lat: number;
  lng: number;
  capital: string;
  cities: string[];
};

type ItalianRegionsMap = Record<string, RegionData>;

const ITALIAN_REGIONS = italianRegions as ItalianRegionsMap;

function getRegionCoords(region: string): { lat: number; lng: number } | undefined {
  const data = ITALIAN_REGIONS[region];
  return data ? { lat: data.lat, lng: data.lng } : undefined;
}

// Types
type PastaCandidate = {
  name: string;
  region: string;
  alternativeNames: string[];
};

type PastaRecord = {
  id: number;
  name: string;
  acceptable_guesses: string[] | null;
  region: string;
  release_date: string;
};

type EnrichedPastaContext = {
  pastaName: string;
  region: string;
  alternativeNames: string[];
  fullContext: string;
};

type CompletePastaData = {
  name: string;
  acceptableGuesses: string[];
  pastaAbout: string[];
  pastaDescription: string;
  sauceName: string;
  sauceAcceptableGuesses: string[];
  sauceIngredients: string[];
  sauceInstructions: string[];
  sauceDescription: string;
  region: string;
  proteinPerServing: number;
  originStory: string;
  funFact: string;
  tags: string[];
};

// Zod schema for runtime validation (as a failsafe)
const completePastaDataSchema = z.object({
  name: z.string(),
  acceptableGuesses: z.array(z.string()),
  pastaAbout: z.array(z.string()).length(6),
  pastaDescription: z.string().min(20),
  sauceName: z.string(),
  sauceAcceptableGuesses: z.array(z.string()),
  sauceIngredients: z.array(z.string()).length(6),
  sauceInstructions: z.array(z.string()).min(4).max(6),
  sauceDescription: z.string().min(20),
  region: z.string(),
  proteinPerServing: z.number().min(10).max(15),
  originStory: z.string(),
  funFact: z.string(),
  tags: z.array(z.string()),
});

// Native Gemini schema for structured output
const geminiPastaSchema = {
  type: Type.OBJECT,
  properties: {
    name: {
      type: Type.STRING,
      description: "The name of the pasta",
    },
    acceptableGuesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Alternative names and acceptable guesses",
    },
    pastaAbout: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Exactly 6 items describing the pasta (category, flour, egg, shape, etymology, method)",
    },
    pastaDescription: {
      type: Type.STRING,
      description: "Visual description of the raw, uncooked pasta (2-3 sentences describing shape, dimensions, texture, color, distinctive features for image generation)",
    },
    sauceName: {
      type: Type.STRING,
      description: "Name of the traditional sauce pairing",
    },
    sauceAcceptableGuesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Alternative names for the sauce",
    },
    sauceIngredients: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Exactly 6 short ingredient names for hints",
    },
    sauceInstructions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "4-6 cooking steps with timing and techniques",
    },
    sauceDescription: {
      type: Type.STRING,
      description: "Visual description of the plated sauce (2-3 sentences describing color, texture, visible ingredients, consistency, garnish for image generation)",
    },
    region: {
      type: Type.STRING,
      description: "Italian region name",
    },
    proteinPerServing: {
      type: Type.NUMBER,
      description: "Protein per serving in grams (10-15g)",
    },
    originStory: {
      type: Type.STRING,
      description: "80-120 words about the pasta's origins",
    },
    funFact: {
      type: Type.STRING,
      description: "One interesting fact about the pasta",
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Tags for categorization",
    },
  },
  required: [
    "name",
    "acceptableGuesses",
    "pastaAbout",
    "pastaDescription",
    "sauceName",
    "sauceAcceptableGuesses",
    "sauceIngredients",
    "sauceInstructions",
    "sauceDescription",
    "region",
    "proteinPerServing",
    "originStory",
    "funFact",
    "tags",
  ],
};

// ====================================================================================
// STEP 1: BUFFER-BASED SELECTION FROM CSV
// ====================================================================================

/**
 * Load pasta candidates from CSV
 */
function loadPastaCandidatesFromCSV(): PastaCandidate[] {
  const csvPath = path.resolve(__dirname, "../src/data/pasta_deduplicated.csv");

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const candidates: PastaCandidate[] = [];

  for (const record of records) {
    const name = record.Pasta?.trim();
    const region = record.Region?.trim();
    const altNames = record["Alternative Names"]?.trim();

    if (!name || !region) continue;

    // Parse alternative names
    const alternativeNames: string[] = [];
    if (altNames) {
      const parts = altNames.split(",").map((s) => s.trim());
      for (const part of parts) {
        if (part) alternativeNames.push(part);
      }
    }

    // Handle multiple regions (e.g., "Puglia; Molise; Campania")
    const regions = region.split(";").map((r) => r.trim());

    // Create a candidate for each region
    for (const reg of regions) {
      candidates.push({
        name,
        region: reg,
        alternativeNames,
      });
    }
  }

  return candidates;
}

/**
 * Get all pasta from database (for blocklist)
 */
async function getAllPastaFromDatabase(supabase: any): Promise<PastaRecord[]> {
  const { data, error } = await supabase
    .from("pasta")
    .select("id,name,acceptable_guesses,region,release_date")
    .order("release_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Check if candidate is blocked (already in database)
 */
function isCandidateBlocked(
  candidate: PastaCandidate,
  existingPasta: PastaRecord[]
): boolean {
  const normCandidateName = normalize(candidate.name);

  for (const pasta of existingPasta) {
    if (normalize(pasta.name) === normCandidateName) return true;

    if (pasta.acceptable_guesses) {
      for (const guess of pasta.acceptable_guesses) {
        if (normalize(guess) === normCandidateName) return true;
      }
    }

    if (
      normalize(pasta.name) === normCandidateName &&
      normalize(pasta.region) === normalize(candidate.region)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Randomly select N pasta candidates from available list
 */
function selectRandomPasta(
  candidates: PastaCandidate[],
  count: number
): PastaCandidate[] {
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ====================================================================================
// STEP 2: ENRICHMENT WITH GEMINI 2.0 FLASH THINKING + GROUNDING
// ====================================================================================

/**
 * Enrich pasta with context using Gemini 2.0 Flash Thinking with grounding
 */
async function enrichPastaContext(
  candidate: PastaCandidate
): Promise<EnrichedPastaContext | null> {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🔬 STEP 2: ENRICHMENT - Context Generation`);
  console.log(`${"=".repeat(80)}`);
  console.log(`📍 Pasta: ${candidate.name}`);
  console.log(`📍 Region: ${candidate.region}`);
  console.log(`📍 Alternative names: ${candidate.alternativeNames.join(", ") || "None"}`);

  const hasAlternativeNames = candidate.alternativeNames.length > 0;
  const alternativeNamesText = hasAlternativeNames
    ? candidate.alternativeNames.join(", ")
    : "";

  const prompt = `You are a distinguished Italian culinary historian and pasta scholar with expertise in regional Italian gastronomy, traditional recipes, and the cultural anthropology of pasta-making traditions. Your knowledge spans centuries of Italian culinary heritage, from medieval manuscripts to modern ethnographic studies.

## Your Research Mission

You are conducting authoritative research on ${candidate.name} from ${candidate.region}, Italy. Your goal is to uncover authentic, historically-grounded information about this traditional pasta shape.

## Required Search Strategy

Execute systematic searches using these specific resources and terms:
1. Search the P.A.T. (Prodotti Agroalimentari Tradizionali) database for "${candidate.name} ${candidate.region}"
2. Query tasteatlas.com for "${candidate.name} traditional recipe"
3. Search Italian culinary websites using terms:
   - "${candidate.name} ricetta tradizionale"
   - "${candidate.name} storia origine"
   - "${candidate.name} ${candidate.region} tradizione"
4. Look for historical recipes and documentation:
   - "antica ricetta ${candidate.name}"
   - "${candidate.name} ricetta originale della nonna"

## Required Output Structure (800-1000 words total)

Write a comprehensive essay covering the following topics. Your essay will later be parsed to extract structured data, so ensure you thoroughly cover each area.

### SECTION 1: HISTORICAL CONTEXT AND ORIGINS (300-350 words)

Provide comprehensive historical documentation including:
- **Precise Geographic Origin**: Identify the specific town, village, or locality where ${candidate.name} originated (avoid just saying "${candidate.region}")
- **Historical Timeline**: When was ${candidate.name} first documented? Include specific dates, centuries, or historical periods
- **Etymology**: Explain the linguistic roots and meaning of the name "${candidate.name}" - what does it literally translate to and why?
- **Cultural Significance**: Why was this pasta shape created? What problem did it solve or what tradition did it serve?
- **Traditional Makers**: Name specific families, historic trattorias, or artisan pasta makers associated with ${candidate.name}
- **Fascinating Historical Elements**: Include 1-2 captivating historical facts, urban legends, or folk stories about ${candidate.name}
- **Alternative Names**: Research and mention 3-8 alternative regional names, dialect variations, or historical appellations${hasAlternativeNames ? ` beyond these known variants: ${alternativeNamesText}` : ''}

### SECTION 2: TRADITIONAL SAUCE PAIRING AND AUTHENTIC RECIPE (350-400 words)

**CRITICAL REQUIREMENT**: Identify and describe the ONE most traditional, historical, and authentic sauce pairing for ${candidate.name}.

Use these specific search terms to ensure authenticity:
- "traditional ${candidate.name} sauce"
- "classic ${candidate.name} recipe"
- "${candidate.name} sugo tradizionale"
- "${candidate.name} condimento classico ${candidate.region}"

Your response MUST include:

**Sauce Identification:**
- The traditional sauce name in original language
- Historical reasoning: WHY this specific sauce pairs with ${candidate.name}
- List the 6 most important ingredients that define this sauce (for hint purposes)

**Complete Traditional Recipe:**
- **Ingredients List (4-8 items with exact quantities):**
  * List each ingredient with specific measurements (e.g., "400g San Marzano tomatoes", "100ml extra virgin olive oil")
  * Each ingredient must be a complete string with quantity and name

- **Detailed Preparation Steps (4-6 steps):**
  * Write 4-6 clear, sequential cooking instructions
  * Include specific techniques, timing, and temperatures where relevant
  * Example: "Heat the olive oil in a large pan over medium heat for 2 minutes."

**Visual Description of the Plated Dish:**
Describe in 2-3 sentences what the plated ${candidate.name} with sauce looks like:
- Primary sauce color and texture
- How the sauce coats the pasta
- Visible ingredients or garnishes
- Focus ONLY on what's visible to a camera (ignore taste-only ingredients like salt)

### SECTION 3: PASTA CHARACTERISTICS AND MAKING TECHNIQUE (150-200 words)

Detail the authentic artisanal production method and pasta characteristics:

**The Essential Six Characteristics:**
In your description, clearly cover these six aspects:
1. Category (Long/Short/Ribbon/Filled/Soup pasta)
2. Flour type (Tipo 00/Semola/Whole wheat/Mixed)
3. Egg content (specify if egg-based, eggless, or rich egg dough)
4. Physical shape/texture characteristic
5. Etymology (covered in Section 1, but can reference)
6. Production method (Hand-rolled/Extruded/Stamped/Cut)

**Dough Composition**: Exact flour type, egg-to-flour ratio, water temperature, salt quantity

**Traditional Tools**: Specify implements used (pettine, chitarra, ferro, etc.)

**Hand-Making Process**: Step-by-step shaping instructions

**Shape Characteristics**: Exact dimensions, curves, ridges, or other defining features

**Visual Description of Raw Pasta:**
Describe in 2-3 sentences what the raw, uncooked pasta looks like:
- Overall shape and geometry (tubes, ribbons, spirals, etc.)
- Approximate dimensions (length, width, thickness in mm/cm)
- Surface texture (smooth, ridged, rough)
- Distinctive features
- Focus ONLY on visible, physical attributes for image generation purposes

**Protein Content**: Based on the egg content, estimate protein per 100g serving:
- Egg-heavy dough (3+ eggs/kg): 13-15g
- Standard egg dough (1-2 eggs/kg): 12-13g
- Eggless (water/flour only): 10-12g

### SECTION 4: CULTURAL SIGNIFICANCE AND INTERESTING FACTS (50-100 words)

- Provide an 80-120 word narrative about the pasta's origins that captures its cultural importance
  * **CRITICAL**: Do NOT mention "${candidate.region}" in this narrative - use "this area", "locally", or specific town names instead
- Include one particularly surprising or delightful fun fact about ${candidate.name}
- Suggest 4-8 descriptive tags that categorize this pasta (e.g., "handmade", "festive", "rustic", "ancient")

## Research Guidelines

- Prioritize PRIMARY SOURCES: historical cookbooks, traditional recipe collections, ethnographic studies
- When citing modern sources, ensure they reference traditional/historical practices
- Use phrases like "Historical records indicate...", "Traditional accounts suggest...", "According to local tradition..." when sources are uncertain
- Include specific names of towns, villages, families, or establishments whenever possible
- Focus on PRE-1950s traditions before industrial pasta production
- If information is scarce, acknowledge this honestly rather than inventing details

## Tone Requirements

Write with scholarly authority while maintaining engaging readability. Your voice should convey deep respect for Italian culinary traditions and the cultural significance of regional pasta-making. Use Italian terms naturally, providing translations where helpful.

Remember: You are documenting living heritage. Every detail you uncover helps preserve authentic Italian pasta traditions for future generations.`;

  console.log(`\n📤 Sending enrichment request to Gemini 3 Pro Preview with grounding...`);
  console.log(`   Model: gemini-3-pro-preview`);
  console.log(`   Temperature: 0.3 (balanced)`);
  console.log(`   Grounding: Enabled (Google Search)`);
  console.log(`   Max tokens: 10000`);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 10000,
        tools: [{ googleSearch: {} }],
      },
    });

    console.log(`📥 Enrichment response received`);

    const content = response.text;

    if (!content) {
      console.error(`❌ Empty enrichment response`);
      return null;
    }

    console.log(`✅ Context enriched successfully`);
    console.log(`   Content length: ${content.length} characters`);
    console.log(`   Preview: ${content.substring(0, 200)}...`);

    return {
      pastaName: candidate.name,
      region: candidate.region,
      alternativeNames: candidate.alternativeNames,
      fullContext: content,
    };
  } catch (error) {
    console.error(`💥 Enrichment failed:`, error);

    // Save enrichment failure for debugging
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${candidate.name.replace(/\s+/g, "_")}_enrichment_${timestamp}.json`;
    const filepath = path.join(DEBUG_DIR, filename);

    fs.writeFileSync(filepath, JSON.stringify({
      timestamp: new Date().toISOString(),
      error_type: "enrichment_failure",
      step2_input: {
        pastaName: candidate.name,
        region: candidate.region,
        alternativeNames: candidate.alternativeNames,
      },
      api_error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack,
      } : String(error),
      model: "gemini-3-pro-preview",
      config: {
        temperature: 0.3,
        maxOutputTokens: 10000,
        tools: [{ googleSearch: {} }],
      },
    }, null, 2));

    console.log(`💾 Enrichment failure saved to: ${filepath}`);
    return null;
  }
}

// ====================================================================================
// STEP 3: VALIDATION & JSON REFINEMENT WITH STRUCTURED OUTPUT
// ====================================================================================

/**
 * Parse enriched context into structured JSON using Gemini 2.5 Flash
 */
async function parseToStructuredJSON(
  context: EnrichedPastaContext
): Promise<CompletePastaData | null> {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🏗️ STEP 3: VALIDATION & JSON REFINEMENT`);
  console.log(`${"=".repeat(80)}`);

  const validRegions = Object.keys(ITALIAN_REGIONS).join(", ");

  const prompt = `You are a data architect extracting structured pasta information from culinary research essays into strict JSON format for a visual database.

### INPUT ESSAY:
"""
${context.fullContext}
"""

### TASK:
Extract and structure the information from the essay above into the provided JSON schema below. Ensure all descriptions are optimized for image generation models.

### CRITICAL CONSTRAINTS:

1. **REGION SCRUBBING**: The name "${context.region}" is strictly forbidden in certain fields.
   - In originStory and funFact: Replace with "this area", "locally", or remove entirely
   - Allowed in: region field only

2. **VISUAL SALIENCE**: In pastaDescription and sauceDescription, ignore invisible ingredients (salt, sugar, dissolved spices). Focus ONLY on what is visible to a camera.

3. **EXACT ARRAY LENGTHS**:
   - pastaAbout: EXACTLY 6 items
   - sauceIngredients: EXACTLY 6 items (short names for hints, not full recipe)

### EXTRACTION GUIDELINES:

**name**: "${context.pastaName}" (fixed)

**acceptableGuesses**: Extract all alternative names, dialect variations, and regional spellings mentioned in the essay. Convert to lowercase array. Include 3-8 items.

**pastaAbout**: Extract EXACTLY 6 characteristics in this order:
   [1] Category (Long/Short/Ribbon/Filled/Soup pasta)
   [2] Flour Type (Tipo 00/Semola/Whole wheat/Mixed)
   [3] Egg Content (e.g., "Rich egg dough", "Eggless", "Egg-based")
   [4] Shape/Texture (e.g., "Thick irregular strands", "Hollow tubes")
   [5] Etymology ("From '[Italian word]' meaning '[English translation]'" - max 10 words)
   [6] Production Method (Hand-rolled/Extruded/Stamped/Cut)

**pastaDescription**: Extract the visual description of RAW, UNCOOKED pasta (2-3 sentences). Must describe:
   - Geometric shape (tubes, ribbons, spirals, etc.)
   - Approximate dimensions (length, width, thickness)
   - Surface texture (smooth, ridged, rough)
   - Distinctive features
   - ONLY visible, physical attributes suitable for image generation

**sauceName**: Extract the traditional sauce name.

**sauceAcceptableGuesses**: Extract alternative sauce names or regional variations. Convert to lowercase array.

**sauceIngredients**: Extract the 6 MOST IMPORTANT ingredients that define the sauce (for hint purposes). These should be SHORT names (1-3 words), not quantities. EXACTLY 6 items.

**sauceInstructions**: Extract the complete recipe preparation steps (4-6 cooking instructions with timing and techniques)

**sauceDescription**: Extract the visual description of the PLATED dish with sauce (2-3 sentences). Must describe:
   - Primary sauce color and texture
   - How sauce coats or pools around pasta
   - Visible ingredients or garnishes
   - Overall visual impression
   - ONLY visible elements for image generation

**region**: "${context.region}" (fixed)

**proteinPerServing**: Extract the protein estimate (10-15g). If not explicitly stated, infer from egg content:
   - Egg-heavy dough: 13-15g
   - Standard egg dough: 12-13g
   - Eggless: 10-12g

**originStory**: Extract the 80-120 word narrative about the pasta's origins.
   - CRITICAL: Remove any mention of "${context.region}" - replace with "this area" or specific town names
   - Must be 80-120 words

**funFact**: Extract one interesting or surprising fact (1-2 sentences)

**tags**: Extract or infer 4-8 descriptive tags (lowercase) like "handmade", "festive", "rustic", "seafood", "vegetarian", "ancient", "rare"

### OUTPUT SCHEMA:
{
  "name": "${context.pastaName}",
  "acceptableGuesses": ["lowercase names"],
  "pastaAbout": ["string", "string", "string", "string", "string", "string"],
  "pastaDescription": "string",
  "sauceName": "string",
  "sauceAcceptableGuesses": ["string"],
  "sauceIngredients": ["string", "string", "string", "string", "string", "string"],
  "sauceInstructions": ["string"],
  "sauceDescription": "string",
  "region": "${context.region}",
  "proteinPerServing": number,
  "originStory": "string",
  "funFact": "string",
  "tags": ["string"]
}

Return ONLY valid JSON.`;

  console.log(`\n📤 Sending structured output request...`);
  console.log(`   Model: gemini-2.5-flash`);
  console.log(`   Temperature: 0.1 (precise)`);
  console.log(`   Response format: JSON with native Gemini schema`);

  let rawContent: string | undefined;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.1,
        maxOutputTokens: 10000,
        responseMimeType: "application/json",
        responseSchema: geminiPastaSchema,
      },
    });

    console.log(`📥 Structured JSON response received`);

    rawContent = response.text;

    if (!rawContent) {
      console.error(`❌ Empty JSON response`);
      return null;
    }

    console.log(`🔍 Parsing and validating JSON with Zod...`);
    const parsed = completePastaDataSchema.parse(JSON.parse(rawContent));

    console.log(`✅ JSON parsed and validated successfully`);
    return parsed;
  } catch (error) {
    console.error(`💥 JSON parsing/validation failed:`, error);

    // Save JSON parsing failure for debugging
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${context.pastaName.replace(/\s+/g, "_")}_parsing_${timestamp}.json`;
    const filepath = path.join(DEBUG_DIR, filename);

    fs.writeFileSync(filepath, JSON.stringify({
      timestamp: new Date().toISOString(),
      error_type: "json_parsing_failure",
      step2_input: {
        pastaName: context.pastaName,
        region: context.region,
        alternativeNames: context.alternativeNames,
      },
      step2_output: {
        fullContext: context.fullContext,
      },
      step3_raw_response: rawContent || null,
      step3_parse_error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack,
      } : String(error),
    }, null, 2));

    console.log(`💾 JSON parsing failure saved to: ${filepath}`);
    return null;
  }
}

// ====================================================================================
// STEP 4: QUICK VALIDATION (GOLDEN SIX) + ERROR DUMP
// ====================================================================================

function saveValidationFailure(
  candidate: PastaCandidate,
  enrichedContext: EnrichedPastaContext | null,
  pastaData: CompletePastaData | null,
  errors: string[]
): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${candidate.name.replace(/\s+/g, "_")}_${timestamp}.json`;
  const filepath = path.join(DEBUG_DIR, filename);

  const debugData = {
    timestamp: new Date().toISOString(),
    step2_input: {
      pastaName: candidate.name,
      region: candidate.region,
      alternativeNames: candidate.alternativeNames,
    },
    step2_output: enrichedContext ? {
      fullContext: enrichedContext.fullContext,
    } : null,
    step3_output: pastaData,
    validation_errors: errors,
  };

  fs.writeFileSync(filepath, JSON.stringify(debugData, null, 2));
  console.log(`💾 Validation failure saved to: ${filepath}`);
}

function validatePastaData(
  data: CompletePastaData,
  candidate: PastaCandidate,
  enrichedContext: EnrichedPastaContext | null
): { valid: boolean; errors: string[] } {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🔍 STEP 4: VALIDATION - Golden Six Checks`);
  console.log(`${"=".repeat(80)}`);

  const errors: string[] = [];

  // Check pastaAbout length
  if (!data.pastaAbout || data.pastaAbout.length !== 6) {
    errors.push(`pastaAbout must have exactly 6 items (has ${data.pastaAbout?.length || 0})`);
  }

  // Check sauceIngredients length
  if (!data.sauceIngredients || data.sauceIngredients.length !== 6) {
    errors.push(`sauceIngredients must have exactly 6 items (has ${data.sauceIngredients?.length || 0})`);
  }

  // Check region validity
  if (!Object.keys(ITALIAN_REGIONS).includes(data.region)) {
    errors.push(`Invalid region: "${data.region}"`);
  }

  // Check originStory length
  const storyWords = data.originStory?.split(/\s+/).length || 0;
  if (storyWords < 80 || storyWords > 120) {
    errors.push(`originStory must be 80-120 words (has ${storyWords})`);
  }

  // Check for region name in originStory
  const regionLower = data.region.toLowerCase();
  const storyLower = data.originStory?.toLowerCase() || "";
  if (storyLower.includes(regionLower)) {
    errors.push(`originStory contains region name "${data.region}"`);
  }

  // Check protein range
  if (data.proteinPerServing < 10 || data.proteinPerServing > 15) {
    errors.push(`proteinPerServing must be 10-15g (has ${data.proteinPerServing})`);
  }

  console.log(`📋 Validation results:`);
  console.log(`   pastaAbout: ${data.pastaAbout?.length || 0}/6 ${data.pastaAbout?.length === 6 ? "✓" : "✗"}`);
  console.log(`   sauceIngredients: ${data.sauceIngredients?.length || 0}/6 ${data.sauceIngredients?.length === 6 ? "✓" : "✗"}`);
  console.log(`   region: ${data.region} ${Object.keys(ITALIAN_REGIONS).includes(data.region) ? "✓" : "✗"}`);
  console.log(`   originStory: ${storyWords} words ${storyWords >= 80 && storyWords <= 120 ? "✓" : "✗"}`);
  console.log(`   proteinPerServing: ${data.proteinPerServing}g ${data.proteinPerServing >= 10 && data.proteinPerServing <= 15 ? "✓" : "✗"}`);

  if (errors.length > 0) {
    console.error(`\n❌ Validation failed:`);
    errors.forEach((err) => console.error(`   - ${err}`));

    // Save failure to debug file
    saveValidationFailure(candidate, enrichedContext, data, errors);

    return { valid: false, errors };
  }

  console.log(`\n✅ All validation checks passed`);
  return { valid: true, errors: [] };
}

// ====================================================================================
// STEP 5 & 6: UNIFIED IMAGE GENERATION (Gemini with Conversation Context)
// ====================================================================================

/**
 * Generate both pasta images in a single Gemini conversation
 * Uses conversation context for visual consistency between images
 */
async function generatePastaImages(
  pastaData: CompletePastaData,
  imageService: PastaImageService
): Promise<{ plainImageUrl: string | null; sauceImageUrl: string | null }> {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`📸 STEPS 5 & 6: Unified Image Generation (Gemini Conversation)`);
  console.log(`${"=".repeat(80)}`);

  try {
    const result = await imageService.generatePastaImages(
      {
        pastaName: pastaData.name,
        region: pastaData.region,
        pastaDescription: pastaData.pastaDescription,
      },
      {
        pastaName: pastaData.name,
        sauceName: pastaData.sauceName,
        region: pastaData.region,
        sauceDescription: pastaData.sauceDescription,
      }
    );

    console.log(`✅ Both images generated successfully`);
    console.log(`   Plain: ${result.plainImage.imageUrl}`);
    console.log(`   Sauce: ${result.sauceImage.imageUrl}`);

    return {
      plainImageUrl: result.plainImage.imageUrl,
      sauceImageUrl: result.sauceImage.imageUrl,
    };
  } catch (error) {
    console.error(`💥 Unified pasta image generation failed:`, error);
    return {
      plainImageUrl: null,
      sauceImageUrl: null,
    };
  }
}

// ====================================================================================
// STEP 7: SAVE TO DATABASE
// ====================================================================================

async function savePastaToDatabase(
  pastaData: CompletePastaData,
  plainImageUrl: string | null,
  sauceImageUrl: string | null,
  releaseDate: string,
  supabase: any
): Promise<boolean> {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`💾 STEP 7: Save to Database`);
  console.log(`${"=".repeat(80)}`);

  const coords = getRegionCoords(pastaData.region);
  if (!coords) {
    console.error(`❌ Could not find coordinates for region: ${pastaData.region}`);
    return false;
  }

  // Ensure the pasta name is always in acceptable_guesses (lowercase)
  const ensureNameInGuesses = (name: string, guesses: string[]): string[] => {
    const normalizedName = name.toLowerCase().trim();
    const hasName = guesses.some(guess => guess.toLowerCase().trim() === normalizedName);
    return hasName ? guesses : [normalizedName, ...guesses];
  };

  const pastaToInsert: PastaInsert = {
    name: pastaData.name,
    acceptable_guesses: ensureNameInGuesses(pastaData.name, pastaData.acceptableGuesses),
    pasta_about: pastaData.pastaAbout,
    pasta_description: pastaData.pastaDescription,
    pasta_image_url: plainImageUrl,
    sauce_name: pastaData.sauceName,
    sauce_acceptable_guesses: ensureNameInGuesses(pastaData.sauceName, pastaData.sauceAcceptableGuesses),
    sauce_ingredients: pastaData.sauceIngredients,
    sauce_instructions: pastaData.sauceInstructions,
    sauce_description: pastaData.sauceDescription,
    sauce_image_url: sauceImageUrl,
    region: pastaData.region,
    region_coordinates: coords,
    protein_per_serving: Math.round(pastaData.proteinPerServing),
    origin_story: pastaData.originStory,
    fun_fact: pastaData.funFact || null,
    tags: pastaData.tags,
    release_date: releaseDate,
  };

  console.log(`📤 Inserting pasta: ${pastaData.name} for ${releaseDate}`);

  const { data, error } = await supabase
    .from("pasta")
    .insert([pastaToInsert])
    .select();

  if (error) {
    console.error(`❌ Database error:`, error.message);
    return false;
  }

  const savedPasta = data?.[0];
  console.log(`✅ Pasta saved with ID: ${savedPasta?.id}`);

  // TODO: Generate tiles (Step 7.5)

  return true;
}

// ====================================================================================
// MAIN FUNCTION
// ====================================================================================

async function main() {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🍝 PASTA DAILY GENERATION`);
  console.log(`${"=".repeat(80)}\n`);

  const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

  // STEP 1: Buffer calculation and selection
  console.log(`📅 STEP 1: Buffer-based selection from CSV`);
  console.log(`${"=".repeat(80)}`);

  const today = new Date().toISOString().split("T")[0];
  const { data: futurePasta, error: countError } = await supabase
    .from("pasta")
    .select("release_date")
    .gte("release_date", today)
    .order("release_date", { ascending: true });

  if (countError) throw countError;

  const bufferDays = futurePasta?.length || 0;
  console.log(`   Current buffer: ${bufferDays} days`);
  console.log(`   Target buffer: ${TARGET_BUFFER_DAYS} days`);

  if (bufferDays >= TARGET_BUFFER_DAYS) {
    console.log(`✅ Buffer sufficient. No generation needed.`);
    return;
  }

  const pastaNeeded = TARGET_BUFFER_DAYS - bufferDays;
  console.log(`   Pasta needed: ${pastaNeeded}`);

  console.log(`\n📂 Loading pasta candidates from CSV...`);
  const allCandidates = loadPastaCandidatesFromCSV();
  console.log(`   Total candidates in CSV: ${allCandidates.length}`);

  console.log(`\n🚫 Building blocklist from database...`);
  const existingPasta = await getAllPastaFromDatabase(supabase);
  console.log(`   Existing pasta in DB: ${existingPasta.length}`);

  const availableCandidates = allCandidates.filter(
    (c) => !isCandidateBlocked(c, existingPasta)
  );
  console.log(`   Available candidates: ${availableCandidates.length}`);

  if (availableCandidates.length === 0) {
    console.log(`\n⚠️ No available pasta candidates! CSV exhausted.`);
    return;
  }

  const toGenerate = Math.min(pastaNeeded, MAX_PASTA_PER_RUN, availableCandidates.length);
  const selectedCandidates = selectRandomPasta(availableCandidates, toGenerate);

  console.log(`\n🎯 Selected ${selectedCandidates.length} pasta for generation:`);
  selectedCandidates.forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.name} (${c.region})`);
  });

  const { data: lastPasta } = await supabase
    .from("pasta")
    .select("release_date")
    .order("release_date", { ascending: false })
    .limit(1);

  let nextReleaseDate = lastPasta && lastPasta[0]
    ? new Date(lastPasta[0].release_date)
    : new Date();
  nextReleaseDate.setDate(nextReleaseDate.getDate() + 1);

  let successCount = 0;
  let spent = 0;

  // Initialize image service
  const imageService = new PastaImageService();

  for (const candidate of selectedCandidates) {
    console.log(`\n\n${"#".repeat(80)}`);
    console.log(`🔄 GENERATING: ${candidate.name} (${candidate.region})`);
    console.log(`${"#".repeat(80)}`);

    if (spent >= DAILY_COST_CAP_USD) {
      console.log(`\n⚠️ Budget cap reached ($${spent.toFixed(2)}). Stopping.`);
      break;
    }

    let enrichedContext: EnrichedPastaContext | null = null;
    let pastaData: CompletePastaData | null = null;

    try {
      // Step 2: Enrichment
      enrichedContext = await enrichPastaContext(candidate);
      if (!enrichedContext) {
        console.log(`❌ Enrichment failed, skipping.`);
        continue;
      }

      // Step 3: JSON parsing
      pastaData = await parseToStructuredJSON(enrichedContext);
      if (!pastaData) {
        console.log(`❌ JSON parsing failed, skipping.`);
        continue;
      }

      // Step 4: Validation
      const validation = validatePastaData(pastaData, candidate, enrichedContext);
      if (!validation.valid) {
        console.log(`❌ Validation failed, skipping.`);
        continue;
      }

      // Steps 5 & 6: Generate both images in unified conversation
      const { plainImageUrl, sauceImageUrl } = await generatePastaImages(
        pastaData,
        imageService
      );
      spent += 0.10; // Gemini image generation cost (both images)

      // Step 7: Save to database
      const releaseDateStr = nextReleaseDate.toISOString().split("T")[0];
      const saved = await savePastaToDatabase(
        pastaData,
        plainImageUrl,
        sauceImageUrl,
        releaseDateStr,
        supabase
      );

      if (saved) {
        successCount++;
        nextReleaseDate.setDate(nextReleaseDate.getDate() + 1);
        console.log(`\n✅ SUCCESS: ${candidate.name} saved for ${releaseDateStr}`);
      }

    } catch (error) {
      console.error(`\n💥 ERROR generating ${candidate.name}:`, error);

      // Save general error with available context
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `${candidate.name.replace(/\s+/g, "_")}_general_${timestamp}.json`;
      const filepath = path.join(DEBUG_DIR, filename);

      fs.writeFileSync(filepath, JSON.stringify({
        timestamp: new Date().toISOString(),
        error_type: "general_exception",
        step1_input: {
          pastaName: candidate.name,
          region: candidate.region,
          alternativeNames: candidate.alternativeNames,
        },
        step2_completed: enrichedContext !== null,
        step3_completed: pastaData !== null,
        error: error instanceof Error ? {
          message: error.message,
          name: error.name,
          stack: error.stack,
        } : String(error),
        partial_data: {
          enrichedContext: enrichedContext ? { hasContext: true, length: enrichedContext.fullContext.length } : null,
          pastaData: pastaData,
        },
      }, null, 2));

      console.log(`💾 General error saved to: ${filepath}`);
    }
  }

  console.log(`\n\n${"=".repeat(80)}`);
  console.log(`🎉 GENERATION COMPLETE`);
  console.log(`${"=".repeat(80)}`);
  console.log(`   Success: ${successCount}/${selectedCandidates.length}`);
  console.log(`   Cost: $${spent.toFixed(2)}`);
  console.log(`   Debug files: ${DEBUG_DIR}`);
  console.log(`${"=".repeat(80)}\n`);
}

main().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
