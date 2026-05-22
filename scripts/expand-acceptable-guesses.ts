import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface DishRow {
  id: number;
  name: string;
  acceptable_guesses: string[] | null;
}

async function expandOne(name: string, existing: string[]): Promise<string[]> {
  const prompt = `Given the dish "${name}" and the current list of accepted player guesses:
${JSON.stringify(existing)}

Expand this list to 6-10 entries total. Add entries covering:
- Shortened/common-misname forms (e.g. "piri piri" for "Piri-piri Chicken").
- English vs. native-language names where both are commonly used.
- Singular and plural forms.
- Common alternate spellings and regional variants.

Return ONLY a JSON array of lowercase strings. No duplicates. Preserve the existing entries.`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 400,
  });

  const content = res.choices[0]?.message?.content?.trim() ?? "";
  const cleaned = content.replace(/^```json\s*/, "").replace(/```\s*$/, "");
  const parsed = JSON.parse(cleaned) as string[];

  const merged = Array.from(new Set([...existing.map((s) => s.toLowerCase()), ...parsed.map((s) => s.toLowerCase())]));
  return merged;
}

async function main() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await supabase
    .from("dishes")
    .select("id,name,acceptable_guesses");
  if (error) throw error;

  const rows = (data ?? []) as DishRow[];
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const current = row.acceptable_guesses ?? [];
    if (current.length >= 6) {
      skipped++;
      continue;
    }

    try {
      console.log(`🔄 Expanding ${row.name} (currently ${current.length} entries)…`);
      const expanded = await expandOne(row.name, current);

      const { error: upErr } = await supabase
        .from("dishes")
        .update({ acceptable_guesses: expanded })
        .eq("id", row.id);
      if (upErr) throw upErr;

      console.log(`  ✅ Now ${expanded.length} entries.`);
      updated++;
    } catch (e) {
      console.error(`  ❌ Failed for ${row.name}:`, e);
      failed++;
    }
  }

  console.log(`\nDone. Updated: ${updated}, Skipped (already >= 6): ${skipped}, Failed: ${failed}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
