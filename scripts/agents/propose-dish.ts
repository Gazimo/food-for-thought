import OpenAI from "openai";

function createOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
  return new OpenAI({ apiKey });
}

export interface ProposeDishOptions {
  /** List of countries to choose dishes from (human-readable, e.g., "Italy", "Japan") */
  countries: string[];
  /** List of dish names to avoid (human-readable, e.g., "Beef Bulgogi", "Pad Thai") */
  blockedDishes: string[];
  /** Number of dishes to suggest */
  maxSuggestions: number;
}

/**
 * Propose dish candidates using AI.
 * Uses human-readable country names and dish names (not normalized).
 */
export async function proposeDishCandidates(
  options: ProposeDishOptions
): Promise<Array<{ name: string; country: string }>> {
  const { countries, blockedDishes, maxSuggestions } = options;

  const countriesList = countries.join(", ");
  const blockedList = blockedDishes.join(", ");

  const instruction = `You are proposing dish candidates for a food guessing game.

TASK: Suggest ${maxSuggestions} traditional dishes from the following countries.

ALLOWED COUNTRIES (choose dishes ONLY from these):
${countriesList}

BLOCKED DISHES (do NOT suggest any of these):
${blockedList}

REQUIREMENTS:
- Each dish must be a real, traditional dish from one of the allowed countries
- Dish names must have proper spacing (e.g., "Pad Thai" not "PadThai")
- Do NOT include country names or nationality words in the dish name
- Return diverse dishes across different countries when possible
- Output ONLY a JSON array: [{"name": "Dish Name", "country": "Country"}]
- No markdown, no explanation, just the JSON array`;

  const messages = [
    {
      role: "user" as const,
      content: instruction,
    },
  ];

  const openai = createOpenAI();

  console.log(
    `🤖 Proposing ${maxSuggestions} dishes from ${countries.length} countries (blocking ${blockedDishes.length} dishes)`
  );

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.6,
    max_tokens: 800,
    messages,
  });

  const content = resp.choices[0]?.message?.content?.trim() || "[]";
  let json = content;

  // Strip markdown code blocks if present
  if (json.startsWith("```")) {
    json = json.replace(/^```[a-zA-Z]*\n?/, "").replace(/```\s*$/, "");
  }

  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      const valid = parsed
        .filter(
          (x) =>
            x &&
            typeof x.name === "string" &&
            typeof x.country === "string" &&
            x.name.trim() &&
            x.country.trim()
        )
        .map((x) => ({
          name: x.name.trim(),
          country: x.country.trim(),
        }));

      console.log(`✅ AI proposed ${valid.length} dishes`);
      return valid;
    }
  } catch (e) {
    console.error("❌ Failed to parse AI response:", e);
  }

  return [];
}
