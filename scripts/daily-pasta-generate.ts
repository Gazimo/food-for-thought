import { config } from "dotenv";
config({ path: ".env.local" }); // local development

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import italianRegions from "../public/data/italian-regions.json";
import type { PastaInsert } from "../src/types/pasta";
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import PastaImageService from "../src/services/pastaImageService";
import pdfParse from "pdf-parse";
import { PDFDocument } from "pdf-lib";
import Fuse from "fuse.js";
import sharp from "sharp";
import type { Database } from "../src/types/database";

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
const TARGET_BUFFER_DAYS = 4;
const MAX_PASTA_PER_RUN = 10;
const PASTA_DAILY_COST_CAP_USD = parseFloat(process.env.PASTA_DAILY_COST_CAP_USD || "0.7");

// Gemini model configuration
const STEP_1_CONFIG = {
  model: "gemini-3-pro-preview",
  temperature: 0.3,
  maxOutputTokens: 30000,
} as const;

const STEP_2_CONFIG = {
  model: "gemini-2.5-flash",
  temperature: 0.1,
  maxOutputTokens: 10000,
} as const;

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

// --- UPDATED PRICING CONFIG (LATE 2025) ---
const PRICING = {
  G3_PRO: { in: 2.0 / 1_000_000, out: 12.0 / 1_000_000 },
  G2_5_FLASH: { in: 0.3 / 1_000_000, out: 2.5 / 1_000_000 },
  SEARCH_GROUNDING: 0.035,
  NANO_BANANA_3: 0.134 // per image
};

const PREPOSITIONS_LOWERCASE_WORDS = [
  "il", "lo", "l'", "la", "i", "gli", "le", 
  "di", "del", "dello", "dell'", "della", "dei", "degli", "delle", 
  "a", "al", "allo", "all'", "alla", "ai", "agli", "alle", 
  "da", "dal", "dallo", "dall'", "dalla", "dai", "dagli", "dalle", 
  "in", "nel", "nello", "nell'", "nella", "nei", "negli", "nelle", 
  "su", "sul", "sullo", "sull'", "sulla", "sui", "sugli", "sulle"
];

function titleCase(s: string): string {
  if (!s) return "";
  
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (!word) return word;
      
      // Always capitalize the first word of the string
      if (index === 0) {
        return word[0].toUpperCase() + word.slice(1);
      }
      
      // If the word is in our excluded list, keep it lowercase
      if (PREPOSITIONS_LOWERCASE_WORDS.includes(word)) {
        return word;
      }
      
      // Otherwise, capitalize normally
      return word[0].toUpperCase() + word.slice(1);
    })
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

/**
 * Build a set of all Italian location names and their adjective forms
 */
function buildLocationSet(): Set<string> {
  const locations = new Set<string>();

  // Add region names
  Object.keys(ITALIAN_REGIONS).forEach(region => {
    locations.add(region.toLowerCase());
  });

  // Add cities and capitals
  Object.values(ITALIAN_REGIONS).forEach(regionData => {
    locations.add(regionData.capital.toLowerCase());
    regionData.cities.forEach(city => locations.add(city.toLowerCase()));
  });

  // Generate adjective forms
  const adjectives = new Set<string>();
  for (const location of locations) {
    // Pattern: -a → -ese (Genova → Genovese)
    if (location.endsWith('a')) {
      adjectives.add(location.slice(0, -1) + 'ese');
    }
    // Pattern: -o → -ese (Bologna → Bolognese)
    if (location.endsWith('o')) {
      adjectives.add(location.slice(0, -1) + 'ese');
    }
  }

  // Special cases
  adjectives.add('romano');
  adjectives.add('romana');
  adjectives.add('napoletano');
  adjectives.add('napoletana');

  return new Set([...locations, ...adjectives]);
}

const LOCATION_SET = buildLocationSet();

/**
 * Check if a word is an Italian location or location adjective
 */
function isItalianLocation(word: string): boolean {
  return LOCATION_SET.has(word.toLowerCase().trim());
}

function fixRegionName(regionName: string): string {
  const validRegions = Object.keys(ITALIAN_REGIONS);

  const exactMatch = validRegions.find(
    (r) => r.toLowerCase() === regionName.toLowerCase()
  );
  if (exactMatch) return exactMatch;

  const fuse = new Fuse(validRegions, {
    threshold: 0.6,
    ignoreLocation: true,
  });

  const results = fuse.search(regionName);
  if (results.length > 0) {
    const matched = results[0].item;
    console.log(`   ⚠️  Region corrected: "${regionName}" → "${matched}"`);
    return matched;
  }

  throw new Error(
    `No valid region match found for "${regionName}".`
  );
}

// Types
type PastaCandidate = {
  name: string;
  number: number;
  startPage: number;
  endPage: number;
  nextPastaName: string | null;
  nextPastaNumber: number | null;
};

type PastaContext = {
  pdfBuffer: Buffer;
  cleanedText: string;
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
  fullContext: string;
  promptLength: number;
  pdfBufferSize: number;
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
};

// Zod schema for runtime validation (as a failsafe)
const completePastaDataSchema = z.object({
  name: z.string(),
  acceptableGuesses: z.array(z.string()).transform((names: string[]) => names.map((name: string) => name.toLowerCase())),
  pastaAbout: z.array(z.string()).length(6),
  pastaDescription: z.string().min(20),
  sauceName: z.string(),
  sauceAcceptableGuesses: z.array(z.string()).transform((names: string[]) => names.map((name: string) => name.toLowerCase())),
  sauceIngredients: z.array(z.string()).length(6),
  sauceInstructions: z.array(z.string()).min(4).max(6),
  sauceDescription: z.string().min(20),
  region: z.string(),
  proteinPerServing: z.number().min(10).max(40),
  originStory: z.string(),
  funFact: z.string(),
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
      description: "Protein per serving in grams (10-40g, full serving with sauce)",
    },
    originStory: {
      type: Type.STRING,
      description: "80-120 words about the pasta's origins",
    },
    funFact: {
      type: Type.STRING,
      description: "One interesting fact about the pasta",
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
  ],
};

// ====================================================================================
// STEP 0: BUFFER-BASED SELECTION FROM JSON
// ====================================================================================

/**
 * Load pasta candidates from JSON
 */
function loadPastaCandidatesFromJSON(): PastaCandidate[] {
  const jsonPath = path.resolve(__dirname, "../src/data/pastas.json");

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`JSON file not found: ${jsonPath}`);
  }

  const jsonContent = fs.readFileSync(jsonPath, "utf-8");
  const pastaArray: Array<{
    number: number;
    pasta_name: string;
    start_page: number;
    end_page: number;
  }> = JSON.parse(jsonContent);

  const candidates: PastaCandidate[] = [];

  for (let i = 0; i < pastaArray.length; i++) {
    const pasta = pastaArray[i];
    const name = pasta.pasta_name?.trim();
    const number = pasta.number;
    const startPage = pasta.start_page;
    const endPage = pasta.end_page;

    if (!name || !number || !startPage || !endPage) continue;

    const nextPasta = i < pastaArray.length - 1 ? pastaArray[i + 1] : null;
    const nextPastaName = nextPasta ? nextPasta.pasta_name.trim() : null;
    const nextPastaNumber = nextPasta ? nextPasta.number : null;

    candidates.push({
      name,
      number,
      startPage,
      endPage,
      nextPastaName,
      nextPastaNumber,
    });
  }

  return candidates;
}

async function getAllPastaFromDatabase(supabase: ReturnType<typeof createClient<Database>>): Promise<PastaRecord[]> {
  const { data, error } = await supabase
    .from("pasta")
    .select("id,name,acceptable_guesses,region,release_date")
    .order("release_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

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
  }

  return false;
}

function selectRandomPasta(
  candidates: PastaCandidate[],
  count: number
): PastaCandidate[] {
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ====================================================================================
// Step 0.5: PDF CONTEXT FETCHER FUNCTIONS
// ====================================================================================

/**
 * Extract specific page range from PDF as a new PDF buffer
 */
async function extractPdfPages(
  pdfPath: string,
  startPage: number,
  endPage: number
): Promise<Buffer> {
  console.log(`   📄 extractPdfPages: Reading PDF from ${pdfPath}`);
  const pdfBytes = fs.readFileSync(pdfPath);
  console.log(`   📄 extractPdfPages: PDF loaded, size: ${pdfBytes.length} bytes`);
  
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const totalPages = pdfDoc.getPageCount();
  console.log(`   📄 extractPdfPages: Total pages in PDF: ${totalPages}`);
  console.log(`   📄 extractPdfPages: Extracting pages ${startPage}-${endPage}`);

  if (startPage < 1 || endPage > totalPages || startPage > endPage) {
    throw new Error(`Invalid page range: ${startPage}-${endPage} (PDF has ${totalPages} pages)`);
  }

  const newPdf = await PDFDocument.create();
  const pageIndices = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage - 1 + i);
  console.log(`   📄 extractPdfPages: Copying ${pageIndices.length} pages (indices: ${pageIndices.join(", ")})`);

  const pages = await newPdf.copyPages(pdfDoc, pageIndices);
  pages.forEach((page) => newPdf.addPage(page));

  const pdfBuffer = Buffer.from(await newPdf.save());
  console.log(`   📄 extractPdfPages: New PDF created, buffer size: ${pdfBuffer.length} bytes`);
  return pdfBuffer;
}

/**
 * Extract text from PDF buffer for cleaning
 */
async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  console.log(`   📝 extractTextFromPdf: Parsing PDF buffer (${pdfBuffer.length} bytes)`);
  const data = await pdfParse(pdfBuffer);
  console.log(`   📝 extractTextFromPdf: Extracted ${data.text.length} characters`);
  console.log(`   📝 extractTextFromPdf: Preview (first 150 chars): "${data.text.substring(0, 150).replace(/-\n/g, "").replace(/\n/g, "\\n")}"`);
  return data.text;
}

/**
 * Clean text by:
 * 1. Removing everything before "{pastaNumber}. {pastaName}" (excluding that line)
 * 2. Removing everything from "{nextNumber}. {nextPastaName}" to end (if next pasta exists)
 * 
 * Handles edge cases:
 * - If start pattern not found, keeps all text but still cleans the end if next pasta exists
 * - If next pasta doesn't exist, only cleans the start
 * - If end pattern not found, returns text up to the end
 */
function cleanText(
  rawText: string,
  pastaNumber: number,
  pastaName: string,
  nextPastaNumber: number | null,
  nextPastaName: string | null
): string {
  console.log(`   🧹 cleanText: Starting with ${rawText.length} characters`);
  console.log(`   🧹 cleanText: Looking for pasta: "${pastaNumber}. ${pastaName}"`);
  console.log(`   🧹 cleanText: Next pasta: ${nextPastaNumber !== null ? `"${nextPastaNumber}. ${nextPastaName}"` : "none (last pasta)"}`);
  
  let cleaned = rawText;

  // Step 1: Remove text before the current pasta entry
  // Try both patterns: with space and without space after period
  const startPatternWithSpace = `${pastaNumber}. ${pastaName}`;
  const startPatternNoSpace = `${pastaNumber}.${pastaName}`;

  let startIndex = cleaned.indexOf(startPatternWithSpace);
  let usedPattern = startPatternWithSpace;

  if (startIndex === -1) {
    startIndex = cleaned.indexOf(startPatternNoSpace);
    usedPattern = startPatternNoSpace;
  }

  console.log(`   🧹 cleanText: Start pattern search result: ${startIndex !== -1 ? `found at index ${startIndex} using "${usedPattern}"` : "NOT FOUND"}`);

  if (startIndex !== -1) {
    // Include the pasta entry line itself, so start from the beginning of that line
    const lineStart = cleaned.lastIndexOf("\n", startIndex);
    const cutPoint = lineStart === -1 ? startIndex : lineStart + 1;
    console.log(`   🧹 cleanText: Removing ${cutPoint} characters before start pattern`);
    cleaned = cleaned.substring(cutPoint);
    console.log(`   🧹 cleanText: Text after start removal: ${cleaned.length} characters`);
  } else {
    console.log(`   ⚠️  cleanText: Start pattern NOT FOUND - keeping all text`);
    console.log(`   🧹 cleanText: Text preview (first 200 chars): "${rawText.substring(0, 200).replace(/-\n/g, "").replace(/\n/g, "\\n")}"`);
  }

  // Step 2: Remove text after the next pasta entry (if next pasta exists)
  if (nextPastaNumber !== null && nextPastaName !== null) {
    // Try both patterns: with space and without space after period
    const endPatternWithSpace = `${nextPastaNumber}. ${nextPastaName}`;
    const endPatternNoSpace = `${nextPastaNumber}.${nextPastaName}`;

    let endIndex = cleaned.indexOf(endPatternWithSpace);
    let usedEndPattern = endPatternWithSpace;

    if (endIndex === -1) {
      endIndex = cleaned.indexOf(endPatternNoSpace);
      usedEndPattern = endPatternNoSpace;
    }

    console.log(`   🧹 cleanText: End pattern search result: ${endIndex !== -1 ? `found at index ${endIndex} using "${usedEndPattern}"` : "NOT FOUND"}`);

    if (endIndex !== -1) {
      const beforeLength = cleaned.length;
      cleaned = cleaned.substring(0, endIndex).trim();
      console.log(`   🧹 cleanText: Removed ${beforeLength - cleaned.length} characters after end pattern`);
    } else {
      console.log(`   ⚠️  cleanText: End pattern NOT FOUND - keeping text to end`);
      console.log(`   🧹 cleanText: Text preview (last 200 chars): "${cleaned.substring(cleaned.length - 200).replace(/-\n/g, "").replace(/\n/g, "\\n")}"`);
    }
  } else {
    console.log(`   🧹 cleanText: No next pasta - keeping all text from start`);
  }

  const finalCleaned = cleaned.trim().replace(/-\n/g, "").replace(/\n/g, " ");
  console.log(`   ✅ cleanText: Final cleaned text: ${finalCleaned.length} characters`);
  console.log(`   📝 cleanText: Preview (first 300 chars): "${finalCleaned.substring(0, 300)}"`);
  console.log(`   📝 cleanText: Preview (last 300 chars): "${finalCleaned.substring(Math.max(0, finalCleaned.length - 300))}"`);

  return finalCleaned;
}

/**
 * Main function that returns both PDF buffer and cleaned text for injection
 */
async function fetchPastaContext(
  pastaName: string,
  number: number,
  startPage: number,
  endPage: number,
  nextPastaNumber: number | null,
  nextPastaName: string | null
): Promise<PastaContext> {
  console.log(`\n   🔍 fetchPastaContext: Starting PDF context fetch`);
  console.log(`   🔍 Pasta: "${pastaName}" (number: ${number})`);
  console.log(`   🔍 Page range: ${startPage}-${endPage}`);
  console.log(`   🔍 Next pasta: ${nextPastaNumber ? `"${nextPastaName}" (${nextPastaNumber})` : "None (last pasta)"}`);
  
  const pdfPath = path.resolve(__dirname, "../src/data/pasta_glossary.pdf");

  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF file not found: ${pdfPath}`);
  }

  console.log(`   ✅ PDF file found: ${pdfPath}`);
  
  const pdfBuffer = await extractPdfPages(pdfPath, startPage, endPage);
  const rawText = await extractTextFromPdf(pdfBuffer);
  const cleanedText = cleanText(rawText, number, pastaName, nextPastaNumber, nextPastaName);

  console.log(`   ✅ fetchPastaContext: Context fetch complete`);
  console.log(`   📊 Summary: ${pdfBuffer.length} bytes PDF, ${cleanedText.length} chars cleaned text\n`);

  return {
    pdfBuffer,
    cleanedText,
  };
}

// ====================================================================================
// STEP 1: ENRICHMENT WITH GEMINI 2.0 FLASH THINKING + GROUNDING
// ====================================================================================

async function enrichPastaContext(
  candidate: PastaCandidate,
  pdfContext?: PastaContext
): Promise<EnrichedPastaContext | null> {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🔬 STEP 1: ENRICHMENT - Context Generation`);
  console.log(`${"=".repeat(80)}`);
  console.log(`📍 Pasta: ${candidate.name}`);
  console.log(`📍 Number: ${candidate.number}`);
  console.log(`📍 Pages: ${candidate.startPage}-${candidate.endPage}`);
  if (pdfContext) {
    console.log(`📍 PDF context available: ${pdfContext.cleanedText.length} chars`);
  }

  const prompt = `You are a distinguished Italian culinary historian and pasta scholar with expertise in regional Italian gastronomy, traditional recipes, and the cultural anthropology of pasta-making traditions. Your knowledge spans centuries of Italian culinary heritage, from medieval manuscripts to modern ethnographic studies.

## Your Research Mission

You are conducting authoritative research on the pasta "${candidate.name}".
This is the pasta name, do not assume a typo.

Your goal is to uncover authentic, historically-grounded information about this traditional pasta shape.

### Required Search Strategy

For additional information that doesn't appear in the above know information, execute systematic searches using these specific resources and terms:
1. Search the P.A.T. (Prodotti Agroalimentari Tradizionali) database for "${candidate.name}"
2. Query tasteatlas.com for "${candidate.name} traditional recipe"
3. Search Italian culinary websites using terms:
   - "${candidate.name} ricetta tradizionale"
   - "${candidate.name} storia origine"
   - "${candidate.name} tradizione"
4. Look for historical recipes and documentation:
   - "antica ricetta ${candidate.name}"
   - "${candidate.name} ricetta originale della nonna"

### Pasta Known Information

This information was derived from a well-established knowledge base (see attached PDF pages ${candidate.startPage}-${candidate.endPage}). The text below has been cleaned to focus on ${candidate.name}:

${pdfContext?.cleanedText}

You must use both the PDF pages and the extracted text above to answer the questions below.

## Required Output Essay (~1000 words)

Write a comprehensive essay covering the following topics. Your essay will later be parsed to extract structured data, so ensure you thoroughly cover each area.

### SECTION 1: HISTORICAL CONTEXT AND ORIGINS (300-350 words)

Provide comprehensive historical documentation including:
- **Precise Geographic Origin**: Identify the specific region or locality where ${candidate.name} originated. Avoid mentioning "North / South Italy"
- **Historical Timeline**: When was ${candidate.name} first documented? Include specific dates, centuries, or historical periods
- **Etymology**: Explain the linguistic roots and meaning of the name "${candidate.name}" - what does it literally translate to and why? any cultural or urban legend?
- **Cultural Significance**: Why was this pasta shape created? What problem did it solve or what tradition did it serve?
- **Traditional Makers**: Name specific families, historic trattorias, or artisan pasta makers associated with ${candidate.name}
- **Fascinating Historical Elements**: Include 1-2 captivating historical facts, urban legends, or folk stories about ${candidate.name}
- **Alternative Names**: Research and mention 1-5 alternative regional names, dialect variations, or historical appellations.

### SECTION 2: TRADITIONAL SAUCE PAIRING AND AUTHENTIC RECIPE (350-400 words)

**CRITICAL REQUIREMENT**: Identify and describe the ONE most traditional, historical, and authentic sauce pairing for ${candidate.name} as originated in its original region.

Use these specific search terms to ensure authenticity:
- "traditional ${candidate.name} sauce"
- "classic ${candidate.name} recipe"
- "${candidate.name} sugo tradizionale"
- "${candidate.name} condimento classico"

Your response MUST include:

**Sauce Identification:**
- The traditional sauce name in original language
- Historical reasoning: WHY this specific sauce pairs with ${candidate.name}
- List the 6 most important ingredients that define this sauce.

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

**Protein Content Estimation:** (per 300-400g serving, pasta + sauce):

Base Pasta Protein:
- Durum wheat (no egg): 10-13g
- Egg pasta: 15-17g

Sauce Protein Addition by Category:
1. Oil/Tomato-based (Aglio e Olio, Pomodoro): +1-3g → Total: 13-17g
2. Cured Meat (Amatriciana, Carbonara): +10-19g → Total: 24-32g
3. Ground Meat (Bolognese, Ragù): +15-22g → Total: 30-35g
4. Seafood (Vongole, Mussels): +10-15g → Total: 23-28g
5. Mixed Protein (Mare e Monti): +16-22g → Total: 29-37g

Method: Identify pasta type (egg vs no-egg), identify sauce category, sum ranges.

Calculate protein per 300-400g serving (pasta + sauce) using the guide above.
Explicitly state: pasta base type, sauce category, and calculation reasoning.

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
Describe in 2-3 sentences what the raw, uncooked pasta looks like. If the PDF context provided detail or photo, prioritize these in your response:
- Overall shape and geometry (tubes, ribbons, spirals, etc.)
- Approximate dimensions (length, width, thickness in mm/cm)
- Surface texture (smooth, ridged, rough)
- Distinctive features
- Focus ONLY on visible, physical attributes for image generation purposes

### SECTION 4: CULTURAL SIGNIFICANCE AND INTERESTING FACTS (50-100 words)

- Provide an 80-120 word narrative about the pasta's origins that captures its cultural importance
- Include one particularly surprising or delightful fun fact about ${candidate.name}

## Deduction Guidelines

- Prioritize PRIMARY SOURCES: the PDF context,historical cookbooks, traditional recipe collections, ethnographic studies
- When citing modern sources, ensure they reference traditional/historical practices
- Use phrases like "Historical records indicate...", "Traditional accounts suggest...", "According to local tradition..." when sources are uncertain
- Include specific name of the Region the pasta was created in / known to be associated with.
- Focus on PRE-1950s traditions before industrial pasta production
- If information is scarce, acknowledge this honestly rather than inventing details

## Tone Requirements

Write with scholarly authority while maintaining engaging readability. Your voice should convey deep respect for Italian culinary traditions and the cultural significance of regional pasta-making. Use Italian terms naturally, providing translations where helpful.

Remember: You are documenting living heritage. Every detail you uncover helps preserve authentic Italian pasta traditions for future generations.`;

  console.log(`\n📤 Sending Step #1 request to Gemini...`);

  try {
    const contents: any[] = [];
    
    if (pdfContext) {
      contents.push({
        inlineData: {
          mimeType: "application/pdf",
          data: pdfContext.pdfBuffer.toString("base64"),
        },
      });
    }
    
    contents.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: STEP_1_CONFIG.model,
      contents,
      config: {
        temperature: STEP_1_CONFIG.temperature,
        maxOutputTokens: STEP_1_CONFIG.maxOutputTokens,
        tools: [{ googleSearch: {} }],
      },
    });

    console.log(`Step #1 enrichment response received`);

    const content = response.text;

    if (!content) {
      console.error(`❌ Empty Step #1 enrichment response`);
      return null;
    }

    console.log(`✅ Step #1 Context enriched successfully`);
    console.log(`   Content length: ${content.length} characters`);
    console.log(`   Preview: ${content.substring(0, 200)}...`);

    const successFile = path.join(
      DEBUG_DIR,
      `${candidate.name.replace(/\s+/g, "_")}_success_${new Date().toISOString().replace(/[:.]/g, "-")}.json`
    );
    fs.writeFileSync(
      successFile,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          pastaName: candidate.name,
          contentLength: content.length,
          preview: content.substring(0, 500),
        },
        null,
        2
      )
    );
    console.log(`💾 Enrichment success saved to: ${successFile}`);

    return {
      pastaName: candidate.name,
      fullContext: content,
      promptLength: prompt.length,
      pdfBufferSize: pdfContext?.pdfBuffer.length || 0,
    };
  } catch (error) {
    console.error(`💥 Step #1 enrichment failed:`, error);

    // Save enrichment failure for debugging
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${candidate.name.replace(/\s+/g, "_")}_enrichment_${timestamp}.json`;
    const filepath = path.join(DEBUG_DIR, filename);

    fs.writeFileSync(filepath, JSON.stringify({
      timestamp: new Date().toISOString(),
      error_type: "enrichment_failure",
      step2_input: {
        pastaName: candidate.name,
        number: candidate.number,
        startPage: candidate.startPage,
        endPage: candidate.endPage,
        pdfContextLength: pdfContext?.cleanedText.length,
        pdfBufferSize: pdfContext?.pdfBuffer.length,
      },
      api_error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack,
      } : String(error),
      model: STEP_1_CONFIG.model,
      config: {
        temperature: STEP_1_CONFIG.temperature,
        maxOutputTokens: STEP_1_CONFIG.maxOutputTokens,
        tools: [{ googleSearch: {} }],
      },
    }, null, 2));

    console.log(`💾 Step #1 enrichment failure saved to: ${filepath}`);
    return null;
  }
}

// ====================================================================================
// STEP 2: VALIDATION & JSON REFINEMENT WITH STRUCTURED OUTPUT
// ====================================================================================

/**
 * Parse enriched context into structured JSON using Gemini 2.5 Flash
 */
async function parseToStructuredJSON(
  context: EnrichedPastaContext
): Promise<CompletePastaData | null> {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🏗️ STEP 2: VALIDATION & JSON REFINEMENT`);
  console.log(`${"=".repeat(80)}`);

  const prompt = `You are a data architect extracting structured pasta information from culinary research essays into strict JSON format for a visual database.

### INPUT ESSAY:
"""
${context.fullContext}
"""

### TASK:
Extract and structure the information from the essay above into the provided JSON schema below. Ensure all descriptions are optimized for image generation models.

### EXTRACTION GUIDELINES:

**name**: "${context.pastaName}"

**acceptableGuesses**: Extract all alternative names, dialect variations, and regional spellings mentioned in the essay. Include 1-5 items.

**pastaAbout**: Extract EXACTLY 6 characteristics in this order:
   [1] Category (Long/Short/Ribbon/Filled/Soup pasta)
   [2] Flour Type (Tipo 00/Semola/Whole wheat/Mixed)
   [3] Egg Content (e.g., "Rich egg dough", "Eggless", "Egg-based")
   [4] Shape/Texture (e.g., "Thick irregular strands", "Hollow tubes")
   [5] Etymology ("From '[Italian word]' meaning '[English translation]'" - max 10 words)
   [6] Production Method (Hand-rolled/Extruded/Stamped/Cut)
    Constraint: These must be EXACTLY 6 items. Each items must be of length up to 5 words.

**pastaDescription**: Extract the visual description of RAW, UNCOOKED pasta (2-3 sentences). Must describe:
   - Geometric shape (tubes, ribbons, spirals, etc.)
   - Approximate dimensions (length, width, thickness)
   - Surface texture (smooth, ridged, rough)
   - Distinctive features
   - ONLY visible, physical attributes suitable for image generation

**sauceName**: Extract the traditional sauce name.

**sauceAcceptableGuesses**: Extract alternative sauce names or regional variations.

**sauceIngredients**: Extract the 6 MOST IMPORTANT ingredients that define the sauce. These should be SHORT names (1-5 words), not quantities. EXACTLY 6 items.

**sauceInstructions**: Extract the complete recipe preparation steps (4-6 cooking instructions with timing and techniques)

**sauceDescription**: Extract the visual description of the PLATED dish with sauce (2-3 sentences). Must describe:
   - Primary sauce color and texture
   - How sauce coats or pools around pasta
   - Visible ingredients or garnishes
   - Overall visual impression
   - ONLY visible elements for image generation

**region**: Extract the region the pasta was originated in / known to be associated with. Must be a valid Italian region name of the 20 official regions, not an area (South / North). Use the Italian name.

**proteinPerServing**: Extract the protein estimate per 300-400g serving. 
Expected range: 10-40g. Use the calculation method from the essay.
If calculation is missing, infer from pasta type (egg vs no-egg) + sauce category.

**originStory**: Extract the ~100 word narrative about the pasta's origins.
   - CRITICAL: Remove any mention of the region name - replace with "this area" or specific town names.
   - Must be ~100 words

**funFact**: Extract one interesting or surprising fact (1-2 sentences)

### CRITICAL CONSTRAINTS:

1. **REGION SCRUBBING**: The extracted region name is strictly forbidden in certain fields.
   - In originStory and funFact: Replace with "this area", "locally", or remove entirely
   - Allowed in: region field only

2. **VISUAL SALIENCE**: In pastaDescription and sauceDescription, ignore invisible ingredients (salt, sugar, dissolved spices). Focus ONLY on what is visible to a camera.

3. **EXACT ARRAY LENGTHS**:
   - pastaAbout: EXACTLY 6 items
   - sauceIngredients: EXACTLY 6 items (short names for hints, not full recipe)

### OUTPUT SCHEMA:
{
  "name": "${context.pastaName}",
  "acceptableGuesses": ["string"],
  "pastaAbout": ["string", "string", "string", "string", "string", "string"],
  "pastaDescription": "string",
  "sauceName": "string",
  "sauceAcceptableGuesses": ["string"],
  "sauceIngredients": ["string", "string", "string", "string", "string", "string"],
  "sauceInstructions": ["string"],
  "sauceDescription": "string",
  "region": "string",
  "proteinPerServing": number,
  "originStory": "string",
  "funFact": "string"
}

Return ONLY valid JSON.`;

  console.log(`\nStep #2: Sending structured output request...`);

  let rawContent: string | undefined;

  try {
    const response = await ai.models.generateContent({
      model: STEP_2_CONFIG.model,
      contents: prompt,
      config: {
        temperature: STEP_2_CONFIG.temperature,
        maxOutputTokens: STEP_2_CONFIG.maxOutputTokens,
        responseMimeType: "application/json",
        responseSchema: geminiPastaSchema,
      },
    });

    console.log(`Step #2 structured JSON response received`);

    rawContent = response.text;

    if (!rawContent) {
      console.error(`❌ Empty Step #2 structured JSON response`);
      return null;
    }

    console.log(`🔍 Step #2 Parsing and validating JSON with Zod...`);
    const parsed = completePastaDataSchema.parse(JSON.parse(rawContent));
    console.log(`✅ Step #2 JSON parsed and validated successfully`);
    
    console.log(`✅ Step #2 Verifying and fixing region name...`);
    parsed.region = fixRegionName(parsed.region);

    return parsed;
  } catch (error) {
    console.error(`💥 Step #2 JSON parsing/validation failed:`, error);

    // Save JSON parsing failure for debugging
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${context.pastaName.replace(/\s+/g, "_")}_parsing_${timestamp}.json`;
    const filepath = path.join(DEBUG_DIR, filename);

    fs.writeFileSync(filepath, JSON.stringify({
      timestamp: new Date().toISOString(),
      error_type: "json_parsing_failure",
      step2_input: {
        pastaName: context.pastaName,
        context: context.fullContext,
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

    console.log(`💾 Step #2 JSON parsing failure saved to: ${filepath}`);
    return null;
  }
}

// ====================================================================================
// STEP 3: QUICK VALIDATION (GOLDEN SIX) + ERROR DUMP
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
      number: candidate.number,
      startPage: candidate.startPage,
      endPage: candidate.endPage,
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
  if (data.proteinPerServing < 10 || data.proteinPerServing > 40) {
    errors.push(`proteinPerServing must be 10-40g (has ${data.proteinPerServing})`);
  }

  console.log(`📋 Validation results:`);
  console.log(`   pastaAbout: ${data.pastaAbout?.length || 0}/6 ${data.pastaAbout?.length === 6 ? "✓" : "✗"}`);
  console.log(`   sauceIngredients: ${data.sauceIngredients?.length || 0}/6 ${data.sauceIngredients?.length === 6 ? "✓" : "✗"}`);
  console.log(`   region: ${data.region} ${Object.keys(ITALIAN_REGIONS).includes(data.region) ? "✓" : "✗"}`);
  console.log(`   originStory: ${storyWords} words ${storyWords >= 80 && storyWords <= 120 ? "✓" : "✗"}`);
  console.log(`   proteinPerServing: ${data.proteinPerServing}g ${data.proteinPerServing >= 10 && data.proteinPerServing <= 40 ? "✓" : "✗"}`);

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
  supabase: ReturnType<typeof createClient<Database>>
): Promise<boolean> {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`💾 STEP 7: Save to Database`);
  console.log(`${"=".repeat(80)}`);

  const coords = getRegionCoords(pastaData.region);
  if (!coords) {
    console.error(`❌ Could not find coordinates for region: ${pastaData.region}`);
    return false;
  }

  /**
   * Expand sauce acceptable guesses to include base name for location-qualified sauces
   * Examples:
   *   "Pesto alla Genovese" → adds "Pesto" (Genovese is a location)
   *   "Ragu di Lepre" → no expansion (Lepre is not a location)
   */
  const expandSauceGuesses = (sauceName: string, guesses: string[]): string[] => {
    const words = sauceName.toLowerCase().split(/\s+/);

    // Find first preposition
    const prepIndex = words.findIndex(word =>
      PREPOSITIONS_LOWERCASE_WORDS.includes(word)
    );

    // No preposition found → single-word sauce, no expansion needed
    if (prepIndex === -1) {
      return guesses;
    }

    // Extract base (everything before preposition)
    const baseName = words.slice(0, prepIndex).join(' ');

    // Extract qualifier (everything after preposition)
    const qualifier = words.slice(prepIndex + 1).join(' ');

    // Check if qualifier is a location
    // For multi-word qualifiers, check if ANY word is a location
    const qualifierWords = qualifier.split(/\s+/);
    const hasLocation = qualifierWords.some(word => isItalianLocation(word));

    if (hasLocation) {
      // Location qualifier → Add base name to guesses if not already present
      const normalizedBase = baseName.trim();
      const hasBase = guesses.some(g => g.toLowerCase().trim() === normalizedBase);

      if (!hasBase) {
        console.log(`  ℹ️  Adding base "${normalizedBase}" for location-qualified sauce "${sauceName}"`);
        return [...guesses, normalizedBase];
      }
    }

    // Not a location or base already present → return unchanged
    return guesses;
  };

  // Ensure the pasta name is always in acceptable_guesses (lowercase)
  const ensureNameInGuesses = (name: string, guesses: string[]): string[] => {
    const normalizedName = name.toLowerCase().trim();
    const hasName = guesses.some(guess => guess.toLowerCase().trim() === normalizedName);
    return hasName ? guesses : [normalizedName, ...guesses];
  };

  const pastaToInsert: PastaInsert = {
    name: titleCase(pastaData.name),
    acceptable_guesses: ensureNameInGuesses(pastaData.name, pastaData.acceptableGuesses),
    pasta_about: pastaData.pastaAbout,
    pasta_description: pastaData.pastaDescription,
    pasta_image_url: plainImageUrl,
    sauce_name: titleCase(pastaData.sauceName),
    sauce_acceptable_guesses: ensureNameInGuesses(
      pastaData.sauceName,
      expandSauceGuesses(pastaData.sauceName, pastaData.sauceAcceptableGuesses)
    ),
    sauce_ingredients: pastaData.sauceIngredients,
    sauce_instructions: pastaData.sauceInstructions,
    sauce_description: pastaData.sauceDescription,
    sauce_image_url: sauceImageUrl,
    region: pastaData.region,
    region_coordinates: coords,
    protein_per_serving: Math.round(pastaData.proteinPerServing),
    origin_story: pastaData.originStory,
    fun_fact: pastaData.funFact || null,
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

  if (savedPasta?.id && (plainImageUrl || sauceImageUrl)) {
    console.log(`\n🔲 STEP 7.5: Generating tiles for pasta ID ${savedPasta.id}...`);
    try {
      await generatePastaTiles(supabase, savedPasta.id, plainImageUrl, sauceImageUrl);
      console.log(`✅ Step 7.5: Tiles generated successfully`);
    } catch (error) {
      console.error(`❌ Step 7.5: Tile generation failed (non-fatal):`, error);
    }
  }

  return true;
}

async function generatePastaTiles(
  supabase: ReturnType<typeof createClient<Database>>,
  pastaId: number,
  pastaImageUrl: string | null,
  sauceImageUrl: string | null
): Promise<void> {
  const phases = [
    { name: "pasta", url: pastaImageUrl },
    { name: "sauce", url: sauceImageUrl },
  ];

  for (const phase of phases) {
    if (!phase.url) {
      console.log(`⏭️  Skipping ${phase.name} tiles (no image URL)`);
      continue;
    }

    try {
      console.log(`  🔲 Generating ${phase.name} tiles...`);

      const imageResponse = await fetch(phase.url);
      if (!imageResponse.ok) throw new Error(`Failed to fetch ${phase.name} image`);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      if (!metadata.width || !metadata.height) {
        throw new Error("Invalid image metadata");
      }

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

        const filenameRegular = `${pastaId}/${phase.name}/regular-${tileIndex}.jpg`;
        const filenameBlurred = `${pastaId}/${phase.name}/blurred-${tileIndex}.jpg`;

        const { error: upErr1 } = await supabase.storage
          .from("pasta-tiles")
          .upload(filenameRegular, regularTileBuffer, {
            contentType: "image/jpeg",
            upsert: true,
          });
        if (upErr1) throw new Error(upErr1.message);

        const { error: upErr2 } = await supabase.storage
          .from("pasta-tiles")
          .upload(filenameBlurred, blurredTileBuffer, {
            contentType: "image/jpeg",
            upsert: true,
          });
        if (upErr2) throw new Error(upErr2.message);
      }

      console.log(`  ✅ ${phase.name} tiles generated (6 regular + 6 blurred)`);
    } catch (error) {
      console.error(`  ❌ ${phase.name} tiles failed:`, error);
    }
  }
}

// ====================================================================================
// MAIN FUNCTION
// ====================================================================================

async function main() {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🍝 PASTA DAILY GENERATION`);
  console.log(`${"=".repeat(80)}\n`);

  const supabase = createClient<Database>(supabaseUrl!, supabaseServiceKey!);

  // STEP 1: Buffer calculation and selection
  console.log(`📅 STEP 1: Buffer-based selection from JSON`);
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

  console.log(`\n📂 Step 0: Loading pasta candidates from JSON...`);
  const allCandidates = loadPastaCandidatesFromJSON();

  console.log(`\n🚫 Step 0: Building blocklist from database...`);
  const existingPasta = await getAllPastaFromDatabase(supabase);

  const availableCandidates = allCandidates.filter(
    (c) => !isCandidateBlocked(c, existingPasta)
  );

  if (availableCandidates.length === 0) {
    console.log(`\n⚠️ Step 0: No available pasta candidates! JSON exhausted.`);
    return;
  }

  const toGenerate = Math.min(pastaNeeded, MAX_PASTA_PER_RUN, availableCandidates.length);
  const selectedCandidates = selectRandomPasta(availableCandidates, toGenerate);

  console.log(`\n🎯 Step 0: Selected ${selectedCandidates.length} pasta for generation:`);
  selectedCandidates.forEach((c, i) => {
    console.log(`   Step 0: ${i + 1}. ${c.name} (#${c.number}, pages ${c.startPage}-${c.endPage})`);
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
    console.log(`🔄 GENERATING: ${candidate.name} (#${candidate.number})`);
    console.log(`${"#".repeat(80)}`);

    if (spent >= DAILY_COST_CAP_USD) {
      console.log(`\n⚠️ Budget cap reached ($${spent.toFixed(2)}). Stopping.`);
      break;
    }

    let enrichedContext: EnrichedPastaContext | null = null;
    let pastaData: CompletePastaData | null = null;
    let pdfContext: PastaContext | null = null;

    try {
      // Step 0.5: Fetch PDF context
      console.log(`\n📄 Step 0.5: Fetching PDF context...`);
      console.log(`📄 Candidate details:`);
      console.log(`   - Name: "${candidate.name}"`);
      console.log(`   - Number: ${candidate.number}`);
      console.log(`   - Pages: ${candidate.startPage}-${candidate.endPage}`);
      console.log(`   - Next pasta: ${candidate.nextPastaName || "none (last)"}`);
      
      pdfContext = await fetchPastaContext(
        candidate.name,
        candidate.number,
        candidate.startPage,
        candidate.endPage,
        candidate.nextPastaNumber,
        candidate.nextPastaName
      );
      console.log(`✅ Step 0.5: PDF context fetched successfully`);
      console.log(`   📊 PDF buffer size: ${pdfContext.pdfBuffer.length} bytes`);
      console.log(`   📊 Cleaned text length: ${pdfContext.cleanedText.length} characters`);
      console.log(`   📝 Cleaned text preview (first 500 chars):`);
      console.log(`   "${pdfContext.cleanedText.substring(0, 500).replace(/\n/g, "\\n")}"`);
      console.log(`   📝 Cleaned text preview (last 300 chars):`);
      console.log(`   "${pdfContext.cleanedText.substring(Math.max(0, pdfContext.cleanedText.length - 300)).replace(/\n/g, "\\n")}"`);

      // Step 1: Enrichment
      enrichedContext = await enrichPastaContext(candidate, pdfContext);
      if (!enrichedContext) {
        console.log(`❌ Step 1: Enrichment failed, skipping.`);
        continue;
      }
      const step1InTokens = (enrichedContext.promptLength + enrichedContext.pdfBufferSize) / 4;
      const step1OutTokens = enrichedContext.fullContext.length / 4;
      const step1Cost = (step1InTokens * PRICING.G3_PRO.in) +
                        (step1OutTokens * PRICING.G3_PRO.out) +
                        PRICING.SEARCH_GROUNDING;
      spent += step1Cost;

      // Step 2: JSON parsing
      pastaData = await parseToStructuredJSON(enrichedContext);
      if (!pastaData) {
        console.log(`❌ Step 2: JSON parsing failed, skipping.`);
        continue;
      }
      const step2InTokens = enrichedContext.fullContext.length / 4;
      const step2OutTokens = JSON.stringify(pastaData).length / 4;
      spent += (step2InTokens * PRICING.G2_5_FLASH.in) + 
              (step2OutTokens * PRICING.G2_5_FLASH.out);

      // Step 3: Validation
      const validation = validatePastaData(pastaData, candidate, enrichedContext);
      if (!validation.valid) {
        console.log(`❌ Step 3: Validation failed, skipping.`);
        continue;
      }

      // Steps 5 & 6: Generate both images in unified conversation
      const { plainImageUrl, sauceImageUrl } = await generatePastaImages(
        pastaData,
        imageService
      );
      if (plainImageUrl) spent += PRICING.NANO_BANANA_3;
      if (sauceImageUrl) spent += PRICING.NANO_BANANA_3;

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
          number: candidate.number,
          startPage: candidate.startPage,
          endPage: candidate.endPage,
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
