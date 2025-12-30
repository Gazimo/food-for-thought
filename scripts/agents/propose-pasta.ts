/**
 * Propose Pasta Candidates Agent
 *
 * Uses Google Gemini AI to propose authentic Italian pasta types
 * from specified regions, avoiding already-used pasta names.
 *
 * This agent is designed to suggest lesser-known regional specialties
 * to keep the game interesting and educational.
 */

export interface ProposePastaOptions {
  /** List of Italian regions to choose pasta from (e.g., ["Toscana", "Puglia", "Liguria"]) */
  regions: string[];
  /** List of pasta names to avoid (human-readable, e.g., ["Pici", "Orecchiette"]) */
  blockedPasta: string[];
  /** Number of pasta to suggest */
  maxSuggestions: number;
}

/**
 * Propose pasta candidates using Gemini AI.
 * Uses human-readable region names and pasta names (not normalized).
 */
export async function proposePastaCandidates(
  options: ProposePastaOptions
): Promise<Array<{ name: string; region: string }>> {
  const { regions, blockedPasta, maxSuggestions } = options;

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.warn("⚠️ GEMINI_API_KEY not set. Cannot propose pasta candidates.");
    return [];
  }

  const regionsList = regions.join(", ");
  const blockedList = blockedPasta.join(", ");

  // TODO: Design prompt that:
  // 1. Instructs AI to suggest authentic Italian pasta types
  // 2. Focuses on lesser-known regional specialties
  // 3. Avoids common pasta like spaghetti, penne, rigatoni
  // 4. Returns diverse pasta across different regions
  // 5. Uses proper Italian names with correct spelling
  // 6. Output format: JSON array [{"name": "Pasta Name", "region": "Region"}]
  //
  // Example instruction structure:
  const instruction = `You are an expert in Italian cuisine and regional pasta traditions.

TASK: Suggest ${maxSuggestions} authentic traditional pasta types from the following Italian regions.

ALLOWED REGIONS (choose pasta ONLY from these):
${regionsList}

BLOCKED PASTA (do NOT suggest any of these or their variants):
${blockedList}

REQUIREMENTS:
- Each pasta must be a real, authentic regional pasta from one of the allowed regions
- Focus on LESSER-KNOWN regional specialties (avoid spaghetti, penne, fusilli, rigatoni, etc.)
- Pasta names must use proper Italian spelling and capitalization
- Each pasta should come from a different region when possible
- Return pasta that have interesting origin stories or traditional sauce pairings
- Output ONLY a JSON array: [{"name": "Pasta Name", "region": "Region Name"}]
- No markdown formatting, no explanations, just the JSON array

EXAMPLES of the level of specificity we want:
- Good: "Pici" from "Toscana"
- Good: "Trofie" from "Liguria"
- Good: "Culurgiones" from "Sardegna"
- Bad: "Spaghetti" (too common)
- Bad: "Penne" (too common)`;

  console.log(
    `🤖 Proposing ${maxSuggestions} pasta from ${regions.length} regions (blocking ${blockedPasta.length} pasta)`
  );

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: instruction }] }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 800,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    // Strip markdown code blocks if present
    let json = content.trim();
    if (json.startsWith("```json")) {
      json = json.replace(/^```json\s*/, "").replace(/```\s*$/, "");
    } else if (json.startsWith("```")) {
      json = json.replace(/^```\s*/, "").replace(/```\s*$/, "");
    }

    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      const valid = parsed
        .filter(
          (x) =>
            x &&
            typeof x.name === "string" &&
            typeof x.region === "string" &&
            x.name.trim() &&
            x.region.trim()
        )
        .map((x) => ({
          name: x.name.trim(),
          region: x.region.trim(),
        }));

      console.log(`✅ AI proposed ${valid.length} pasta`);
      return valid;
    }
  } catch (e) {
    console.error("❌ Failed to propose pasta candidates:", e);
  }

  return [];
}
