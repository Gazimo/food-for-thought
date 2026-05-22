# Game Experience Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the four sections of improvements defined in `docs/superpowers/specs/2026-05-22-game-experience-improvements-design.md` — small UX wins, broader dish acceptance, a cuisine-region progressive hint, and an image-generation upgrade to Imagen 4 Ultra.

**Architecture:** Each section is independently shippable. Section 1 is pure UI tweaks on existing components. Section 2 edits the AI prompt + adds one runtime helper. Section 3 adds one new data file and one new component. Section 4 introduces an `ImageGenerator` adapter so DALL-E 3 and the new Imagen 4 Ultra path can coexist behind a stable interface. Each task ends with a commit; each section corresponds to a natural PR boundary.

**Tech Stack:** Next.js 15 App Router, React 19, Zustand, Radix UI, framer-motion, Tailwind, OpenAI SDK (for text gen), `@google/genai` (new — for Imagen 4 image gen), Supabase (storage + db), Sharp (tile slicing).

**Testing approach:** This codebase has no test framework today. To respect that and ship velocity, this plan uses **manual play-through verification** for UI changes (per the spec's Testing section) and **inline `tsx` script invocations** for verifying pure-function helpers. No vitest/jest installation.

---

## File Structure

**Created:**
- `src/data/cuisineRegions.ts` — country → region map for Section 3.
- `src/components/RegionHintChip.tsx` — progressive hint chip for Section 3.
- `src/services/imageGenerators/types.ts` — `ImageGenerator` interface for Section 4.
- `src/services/imageGenerators/openaiDallE3.ts` — DALL-E 3 implementation (extracted from current code, kept as fallback).
- `src/services/imageGenerators/googleImagen4Ultra.ts` — new Imagen 4 Ultra implementation for Section 4.
- `src/services/imageGenerators/index.ts` — barrel + factory.
- `scripts/expand-acceptable-guesses.ts` — one-time backfill for Section 2.
- `scripts/verify-fuzzy-match.ts` — throwaway verification harness (deleted after use).

**Modified:**
- `src/components/ResultModal.tsx` — Radix Dialog (Section 1.1).
- `src/components/GameSummary.tsx` or `src/app/play/ProteinPhase.tsx` — "View Results" re-open button (Section 1.1).
- `src/components/inputs/TextInput.tsx` — desktop-only autofocus (Section 1.2).
- `src/components/inputs/GiveUpButton.tsx` — outline + label visual (Section 1.3).
- `src/components/GuessInput.tsx` — remove secondary "give up and see results" link (Section 1.3).
- `src/components/GameHeader.tsx` — streak chip next to Statistics (Section 1.4).
- `src/components/ArchiveDatePicker.tsx` — 30 → 90 day range (Section 1.5).
- `src/services/aiService.ts` — bump `acceptableGuesses` target to 6–10, validation update (Section 2.1).
- `src/utils/gameHelpers.ts` — add `getStrongFuzzyMatch` helper (Section 2.2).
- `src/app/play/DishPhase.tsx` — wire `getStrongFuzzyMatch` into correctness check (Section 2.2).
- `src/components/GuessFeedback.tsx` — render `RegionHintChip` below ingredient chips (Section 3.3).
- `src/services/dishImageService.ts` — use `ImageGenerator` adapter + new cinematographic prompt (Section 4).
- `scripts/daily-generate.ts` — adapt `generateTiles` to skip resize when source is already 3:2 (Section 4.3).
- `.github/workflows/daily-generate.yml` — add `GEMINI_API_KEY` to env file (Section 4).

**Deleted (after one-time use):**
- `scripts/expand-acceptable-guesses.ts`
- `scripts/verify-fuzzy-match.ts`

---

# Section 1 — Small UX wins

## Task 1.1: Convert ResultModal to Radix Dialog

**Files:**
- Modify: `src/components/ResultModal.tsx`

- [ ] **Step 1: Import Dialog primitives**

At the top of `src/components/ResultModal.tsx`, add:

```tsx
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
```

- [ ] **Step 2: Replace the outer `<div className="fixed inset-0 ...">` wrapper with `Dialog` + `DialogContent`**

Replace the JSX return block starting at the current `<div className="fixed inset-0 bg-black bg-opacity-50 ...">` with:

```tsx
return (
  <Dialog
    open={modalVisible}
    onOpenChange={(open) => {
      if (!open) {
        toggleModal(false);
        posthog.capture("toggle_recipe_modal", { opened: false });
      }
    }}
  >
    <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto gap-4 flex flex-col p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold">🎉 You did it!</h2>
        </div>
        {streak >= 1 && (
          <div className="text-orange-500 font-semibold text-sm mt-2 animate-streak-pop">
            🔥 You&apos;re on a {streak}-day streak!
          </div>
        )}
      </div>
      {/* …rest of the existing modal body unchanged… */}
    </DialogContent>
  </Dialog>
);
```

Notes:
- Delete the existing inline `<button onClick={() => toggleModal(false)} ...>✕</button>` — Radix `DialogContent` renders its own close button by default.
- Keep all internal content (image, dish info, `GameSummary`, `LeaderboardCard`, `ArchiveStatus`, action row, recipe panel, footer) unchanged.
- Delete the early-return guard `if (gamePhase !== "complete" || !currentDish || !modalVisible) return null;` and replace it with a guard that returns `null` only when `gamePhase !== "complete" || !currentDish`. The `open={modalVisible}` binding handles visibility.

- [ ] **Step 3: Manually verify modal dismiss paths**

Run dev server (`npm run dev`), complete a game (use a test dish or play through), and confirm:
- Pressing `Esc` closes the modal.
- Clicking the dark backdrop area closes the modal.
- The X close button (rendered by Radix) closes the modal.
- The PostHog `toggle_recipe_modal` event fires with `{ opened: false }` on close.

- [ ] **Step 4: Commit**

```bash
git add src/components/ResultModal.tsx
git commit -m "feat(modal): dismiss results modal with Esc and outside-click via Radix Dialog"
```

## Task 1.2: Add "View Results" re-open affordance after modal close

**Files:**
- Modify: `src/app/play/ProteinPhase.tsx`

- [ ] **Step 1: Read the current file to confirm where the "complete" view renders**

Look at `src/app/play/ProteinPhase.tsx` — identify where the post-completion content is rendered (after a correct protein guess). The "View Results" button needs to appear there when `gamePhase === "complete"` and `modalVisible === false`.

- [ ] **Step 2: Add the button**

In `ProteinPhase.tsx`, at the bottom of the JSX returned when the phase is complete, add:

```tsx
{gamePhase === "complete" && !modalVisible && (
  <div className="flex justify-center mt-4">
    <Button
      variant="cta"
      onClick={() => toggleModal(true)}
    >
      📋 View Results
    </Button>
  </div>
)}
```

Add the corresponding selectors to the existing `useGameStore` calls in the file:

```ts
const gamePhase = useGameStore((state) => state.gamePhase);
const modalVisible = useGameStore((state) => state.modalVisible);
const toggleModal = useGameStore((state) => state.toggleModal);
```

Add the import: `import { Button } from "@/components/ui/button";` if not already present.

- [ ] **Step 3: Manually verify**

Complete a game, close the modal (Esc), confirm the "View Results" button appears at the bottom of the protein phase view. Click it — modal re-opens with the same data. No score re-submission (check network panel for absence of duplicate `/api/leaderboard` POSTs).

- [ ] **Step 4: Commit**

```bash
git add src/app/play/ProteinPhase.tsx
git commit -m "feat(modal): persist 'View Results' button so a dismissed modal can be reopened"
```

## Task 1.3: Desktop-only autofocus on text input

**Files:**
- Modify: `src/components/inputs/TextInput.tsx`

- [ ] **Step 1: Add the ref, the desktop detection, and the autofocus effect**

In `src/components/inputs/TextInput.tsx`, add at the top of the component body (after the `useState`/`useGameStore` calls):

```tsx
const inputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  if (typeof window === "undefined") return;
  const isDesktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (isDesktop && !isComplete && !disabled) {
    inputRef.current?.focus();
  }
}, [isComplete, disabled]);
```

Add the corresponding React imports:

```tsx
import { useEffect, useRef, useState } from "react";
```

(Replace whatever the existing `import { useState }` line is.)

- [ ] **Step 2: Wire the ref onto the Input element**

Find the `<Input ... />` usage near the bottom of the file (around line 134 in the current code) and add `ref={inputRef}`:

```tsx
<Input
  ref={inputRef}
  type="text"
  value={value}
  /* …other existing props… */
/>
```

- [ ] **Step 3: Verify `Input` forwards refs**

Read `src/components/ui/input.tsx`. If it doesn't forward refs to the underlying DOM input, wrap it with `React.forwardRef`:

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn("…existing classes…", className)} {...props} />
  )
);
Input.displayName = "Input";
```

(Keep whatever existing classes/styles are on the original component — copy them into the `cn(...)` call. Don't remove styling.)

- [ ] **Step 4: Manually verify on desktop and mobile**

Desktop browser: load `/play`, confirm the dish-phase input is focused on mount (cursor is in the input, you can immediately start typing). After advancing to the country phase, confirm the country input is focused on mount.

Mobile browser / responsive devtools toggle: load `/play`, confirm the input is NOT focused and the soft keyboard does NOT pop.

- [ ] **Step 5: Commit**

```bash
git add src/components/inputs/TextInput.tsx src/components/ui/input.tsx
git commit -m "feat(input): autofocus text inputs on desktop only on phase entry"
```

## Task 1.4: Replace cryptic flag icon with outline-style "Give up" button

**Files:**
- Modify: `src/components/inputs/GiveUpButton.tsx`
- Modify: `src/components/GuessInput.tsx`

- [ ] **Step 1: Rewrite GiveUpButton with icon + label**

Replace the body of `src/components/inputs/GiveUpButton.tsx` from the JSX return downward:

```tsx
return (
  <>
    <Dialog open={giveUpOpen} onOpenChange={setGiveUpOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure you want to give up?</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button variant="default" onClick={() => setGiveUpOpen(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleGiveUp}>
            Ok
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Button
      variant="outline"
      size="sm"
      onClick={() => setGiveUpOpen(true)}
      className="text-xs sm:text-sm whitespace-nowrap"
    >
      🏳️ Give up
    </Button>
  </>
);
```

Delete the `import Image from "next/image";` line — it's no longer used. The `/images/give-up.png` asset can stay on disk (don't delete it; other branches or future flows may want it).

- [ ] **Step 2: Remove the secondary "Give up and see results" link from GuessInput**

In `src/components/GuessInput.tsx`, locate the block (around lines 165–167 and 219–230):

```tsx
const shouldShowGiveUp = isProteinPhase
  ? previousProteinGuesses.length >= 3
  : false;
```

and the JSX block that uses it:

```tsx
{shouldShowGiveUp && !isComplete && (
  <div className="absolute top-full left-0 right-0 text-center mt-2">
    <Button onClick={handleGiveUp} variant="outline" size="sm" className="text-xs">
      Give up and see results
    </Button>
  </div>
)}
```

Delete both blocks. The primary `<GiveUpButton />` is now the only give-up surface.

- [ ] **Step 3: Manually verify across all three phases**

Load a game. In each of dish, country, and protein phase: the "🏳️ Give up" button appears next to the input from the very first interaction (no minimum-guess gating). Clicking it opens the confirm dialog. Clicking "Ok" advances the phase as before.

- [ ] **Step 4: Commit**

```bash
git add src/components/inputs/GiveUpButton.tsx src/components/GuessInput.tsx
git commit -m "feat(give-up): replace flag icon with labelled outline button, drop redundant secondary link"
```

## Task 1.5: Streak chip in header

**Files:**
- Modify: `src/components/GameHeader.tsx`

- [ ] **Step 1: Pull streak from the store and render a chip**

In `src/components/GameHeader.tsx`, extend the existing `useGameStore` destructure to include `streak`:

```tsx
const { isPlayingArchive, archiveDate, exitArchiveMode, streak } = useGameStore();
```

Inside the right-side `<div className="flex items-center gap-3">` (around line 53), **before** the `showStatisticsButton` block, add:

```tsx
{streak >= 1 && !isPlayingArchive && (
  <Link href="/statistics">
    <div
      className="flex items-center gap-1 px-2 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-md text-sm font-semibold transition-colors"
      title={`${streak}-day streak`}
    >
      <span>🔥</span>
      <span>{streak}</span>
    </div>
  </Link>
)}
```

- [ ] **Step 2: Manually verify**

If you have a streak of 0 today, simulate one in dev: open browser devtools → Application → Local Storage → set the streak key to a value ≥1 (look in `src/utils/streak.ts` for the exact key), reload `/play`. Confirm the 🔥 chip renders next to the Statistics button. Click it — should route to `/statistics`. In archive mode the chip should not render (header already filters statistics in archive mode; the same condition guards the chip).

- [ ] **Step 3: Commit**

```bash
git add src/components/GameHeader.tsx
git commit -m "feat(header): show streak chip next to Statistics when streak >= 1"
```

## Task 1.6: Expand archive range from 30 to 90 days

**Files:**
- Modify: `src/components/ArchiveDatePicker.tsx`

- [ ] **Step 1: Bump the constant**

In `src/components/ArchiveDatePicker.tsx`, replace lines 34–36:

```tsx
const earliestDate = new Date();
earliestDate.setDate(today.getDate() - 30);
const earliestDateString = earliestDate.toISOString().split("T")[0];
```

with:

```tsx
const ARCHIVE_DAYS_BACK = 90;
const earliestDate = new Date();
earliestDate.setDate(today.getDate() - ARCHIVE_DAYS_BACK);
const earliestDateString = earliestDate.toISOString().split("T")[0];
```

Also update the dialog description text in the same file (~line 170):

```tsx
<DialogDescription>
  Select a date to play a previous game. You can only access games
  from the last 90 days.
</DialogDescription>
```

- [ ] **Step 2: Verify the archive API does not enforce its own 30-day cap**

Read `src/pages/api/dishes.ts` and `src/pages/api/archive-unlock.ts`. Search for the literal `30` and for any date arithmetic. If either file enforces a 30-day window on the server side, change that constant to `90` too. If neither does, no further changes are needed.

- [ ] **Step 3: Manually verify**

Open the archive date picker, navigate back through months — confirm dates from up to 90 days ago are selectable (previously the past 31st day onward was greyed out). Pick a date 60 days back and confirm the dish loads.

- [ ] **Step 4: Commit**

```bash
git add src/components/ArchiveDatePicker.tsx src/pages/api/dishes.ts src/pages/api/archive-unlock.ts
git commit -m "feat(archive): expand playable archive range from 30 to 90 days"
```

(Only stage the API files if Step 2 required edits.)

---

# Section 2 — Widen dish acceptance

## Task 2.1: Broaden AI-generated acceptable guesses (6–10 variations)

**Files:**
- Modify: `src/services/aiService.ts`

- [ ] **Step 1: Update the prompt**

In `src/services/aiService.ts`, find the requirements block (line ~145):

```ts
2. acceptableGuesses: 2-4 smart variations/alternative names people might use for "${dishName}"
```

Replace with:

```ts
2. acceptableGuesses: 6-10 smart variations and alternative names people might use for "${dishName}". Include:
   - Shortened or common-misname forms (e.g. "piri piri" for "Piri-piri Chicken").
   - English vs. native-language names where both are commonly used.
   - Singular and plural forms.
   - Common alternate spellings and regional variants.
   All entries lowercase, no duplicates.
```

- [ ] **Step 2: Update validation**

In the same file, find `validateDishData` (line ~286) and change:

```ts
Array.isArray(dishData.acceptableGuesses) &&
dishData.acceptableGuesses.length >= 1 &&
```

to:

```ts
Array.isArray(dishData.acceptableGuesses) &&
dishData.acceptableGuesses.length >= 6 &&
```

- [ ] **Step 3: Manually generate one dish end-to-end to verify**

Run a single-dish smoke test:

```bash
npm run smart-generate -- --name "Margherita Pizza"
```

(If `smart-generate` doesn't accept a name flag in the current implementation, use whichever one-off generation script the repo provides — e.g. `tsx scripts/test-single-dish.ts`. Skim that script first to confirm the invocation.)

Inspect the output JSON — confirm `acceptableGuesses` contains at least 6 entries covering the variation types above.

- [ ] **Step 4: Commit**

```bash
git add src/services/aiService.ts
git commit -m "feat(dish-gen): generate 6-10 acceptable guesses per dish with explicit variation guidance"
```

## Task 2.2: Add `getStrongFuzzyMatch` helper

**Files:**
- Modify: `src/utils/gameHelpers.ts`

- [ ] **Step 1: Append the helper to gameHelpers.ts**

At the end of `src/utils/gameHelpers.ts`, after the existing `getClosestGuess` function, add:

```ts
/**
 * Returns the canonical match string when the input is a high-confidence match
 * for one of the options. Used to auto-accept near-perfect fuzzy matches
 * without showing a "did you mean?" prompt. Returns null when confidence is
 * not high enough to auto-accept.
 */
export function getStrongFuzzyMatch(
  input: string,
  options: string[]
): string | null {
  const normalizedInput = input.toLowerCase().trim();
  if (normalizedInput.length < 3) return null;

  // Exact-substring containment: input is a substantial portion of an option,
  // or an option is a substantial portion of input.
  for (const option of options) {
    const normalizedOption = option.toLowerCase();
    if (
      normalizedOption.includes(normalizedInput) &&
      normalizedInput.length / normalizedOption.length >= 0.5
    ) {
      return option;
    }
    if (
      normalizedInput.includes(normalizedOption) &&
      normalizedOption.length / normalizedInput.length >= 0.5
    ) {
      return option;
    }
  }

  // Very high-confidence fuzzy match (Fuse score <= 0.15 is essentially a typo).
  const fuse = new Fuse(options, {
    threshold: 0.4,
    includeScore: true,
    ignoreLocation: false,
    distance: 10,
  });
  const results = fuse.search(normalizedInput);
  if (results.length === 0) return null;

  const best = results[0];
  if ((best.score ?? 1) <= 0.15) {
    return best.item;
  }

  return null;
}
```

- [ ] **Step 2: Write a throwaway verification script**

Create `scripts/verify-fuzzy-match.ts`:

```ts
import { getStrongFuzzyMatch } from "../src/utils/gameHelpers";

const dishOptions = ["piri-piri chicken", "peri-peri chicken", "piri piri"];

const cases: Array<[string, string | null]> = [
  ["piri piri", "piri piri"],          // exact match to one of the options
  ["piri-piri", "piri-piri chicken"],  // strong substring
  ["pirir piri chicken", "piri-piri chicken"], // typo, very close
  ["adasd", null],                     // nonsense
  ["chicken", null],                   // partial too generic — substring ratio is too low
  ["xx", null],                        // too short
];

let failed = 0;
for (const [input, expected] of cases) {
  const got = getStrongFuzzyMatch(input, dishOptions);
  const ok = got === expected;
  console.log(`${ok ? "✅" : "❌"}  input=${JSON.stringify(input)}  expected=${JSON.stringify(expected)}  got=${JSON.stringify(got)}`);
  if (!ok) failed++;
}
process.exit(failed === 0 ? 0 : 1);
```

- [ ] **Step 3: Run the verification script and confirm all pass**

```bash
npx tsx scripts/verify-fuzzy-match.ts
```

Expected: six `✅` lines, exit code 0. If any fail, adjust thresholds in `getStrongFuzzyMatch` until they pass without breaking the others.

- [ ] **Step 4: Delete the throwaway script**

```bash
rm scripts/verify-fuzzy-match.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/gameHelpers.ts
git commit -m "feat(guess): add getStrongFuzzyMatch for high-confidence dish-name acceptance"
```

## Task 2.3: Wire `getStrongFuzzyMatch` into the dish phase

**Files:**
- Modify: `src/app/play/DishPhase.tsx`

- [ ] **Step 1: Update the import and the correctness check**

At the top of `src/app/play/DishPhase.tsx`, change:

```tsx
import { useGameStore } from "@/store";
```

to add the helper import:

```tsx
import { useGameStore } from "@/store";
import { getStrongFuzzyMatch } from "@/utils/gameHelpers";
```

Replace the `handleGuess` function body (around line 35):

```tsx
const handleGuess = (guess: string) => {
  const normalized = guess.toLowerCase().trim();
  const acceptable = currentDish?.acceptableGuesses ?? [];

  const exactMatch = acceptable.includes(normalized);
  const fuzzyMatch = exactMatch ? null : getStrongFuzzyMatch(normalized, acceptable);

  const isCorrect = exactMatch || !!fuzzyMatch;
  const guessToRecord = fuzzyMatch ?? guess;

  posthog.capture("guess_dish", {
    guess,
    correct: isCorrect,
    fuzzy_match: !!fuzzyMatch,
  });

  guessDish(guessToRecord);
};
```

- [ ] **Step 2: Manually verify against a live dish**

Run dev server and play through a dish whose `acceptableGuesses` includes a known short form. Try:
- The canonical name — should be accepted (as before).
- The short form ("piri piri" for "Piri-piri Chicken") — should be accepted via fuzzy match. Confirm via devtools that PostHog event shows `fuzzy_match: true`.
- A typo of the canonical name — should be accepted (or fall through to the existing "did you mean?" toast if the typo is too far off).
- Random nonsense — should be a normal wrong guess, no fuzzy match.

- [ ] **Step 3: Commit**

```bash
git add src/app/play/DishPhase.tsx
git commit -m "feat(dish-phase): auto-accept high-confidence fuzzy matches and record canonical form"
```

## Task 2.4: One-time backfill script for existing dishes

**Files:**
- Create: `scripts/expand-acceptable-guesses.ts`

- [ ] **Step 1: Create the script**

Create `scripts/expand-acceptable-guesses.ts`:

```ts
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
```

- [ ] **Step 2: Run a dry-run on the first few dishes locally to sanity-check the output**

Temporarily add `if (updated >= 3) break;` after the `updated++` line, run once:

```bash
npx tsx scripts/expand-acceptable-guesses.ts
```

Inspect the database (Supabase studio or a `select id,name,acceptable_guesses` query) and confirm three dishes now have ≥6 entries with sensible variation. Remove the early-break.

- [ ] **Step 3: Run the full backfill**

```bash
npx tsx scripts/expand-acceptable-guesses.ts
```

Expect: every dish that previously had <6 entries is now updated. The script is idempotent — re-running it skips dishes already at ≥6.

- [ ] **Step 4: Delete the script and commit**

```bash
rm scripts/expand-acceptable-guesses.ts
git add scripts/expand-acceptable-guesses.ts
git commit -m "chore(dishes): one-time backfill of acceptable guesses (script removed after use)"
```

(`git add` will stage the deletion. The DB changes were applied by Step 3 and don't need staging.)

---

# Section 3 — Cuisine-region progressive hint

## Task 3.1: Build the cuisine-region data map

**Files:**
- Create: `src/data/cuisineRegions.ts`

- [ ] **Step 1: Get the list of distinct countries currently in the database**

Run from the project root:

```bash
npx tsx -e "
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
sb.from('dishes').select('country').then(({data}) => {
  const uniq = [...new Set((data ?? []).map((r: any) => r.country))].sort();
  console.log(JSON.stringify(uniq, null, 2));
});
"
```

Save the printed array — it's the input to Step 2.

- [ ] **Step 2: Create the data file**

Create `src/data/cuisineRegions.ts` populated with one entry per country printed in Step 1. Example shape (extend to cover every country):

```ts
/**
 * Cuisine-region map keyed by the `country` field on dishes.
 * Used by the dish-phase progressive hint chip.
 * Region labels are intentionally broad — the goal is to nudge the player
 * toward the right corner of the world, not narrow the answer further.
 */
export const CUISINE_REGIONS: Record<string, string> = {
  Portugal: "Iberian / Southern Europe",
  Spain: "Iberian / Southern Europe",
  Italy: "Mediterranean Europe",
  France: "Western Europe",
  Greece: "Mediterranean Europe",
  Turkey: "Anatolia / Eastern Mediterranean",
  Lebanon: "Levant / Middle East",
  Israel: "Levant / Middle East",
  Morocco: "North Africa / Maghreb",
  India: "South Asia",
  Pakistan: "South Asia",
  Thailand: "Southeast Asia",
  Vietnam: "Southeast Asia",
  Indonesia: "Southeast Asia",
  Japan: "East Asia",
  China: "East Asia",
  Korea: "East Asia",
  // …extend with every country from Step 1…
  Mexico: "Latin America",
  Peru: "Latin America",
  Brazil: "Latin America",
  USA: "North America",
};

export function getCuisineRegion(country: string): string | null {
  return CUISINE_REGIONS[country] ?? null;
}
```

Every country from Step 1 must appear as a key. If you genuinely can't categorize one, omit it — `getCuisineRegion` returns `null` and the chip won't render for that dish.

- [ ] **Step 3: Quick coverage check**

Run:

```bash
npx tsx -e "
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { getCuisineRegion } from './src/data/cuisineRegions';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
sb.from('dishes').select('country').then(({data}) => {
  const missing = [...new Set((data ?? []).map((r: any) => r.country))].filter(c => !getCuisineRegion(c));
  console.log(missing.length ? 'Missing regions for:' : 'All countries mapped ✅');
  if (missing.length) console.log(missing);
});
"
```

Expected: `All countries mapped ✅`. If any countries are missing, decide per-country whether to add a mapping or leave it unmapped (which gracefully skips the hint for that dish).

- [ ] **Step 4: Commit**

```bash
git add src/data/cuisineRegions.ts
git commit -m "feat(hints): add cuisine-region map for dish-phase progressive hint"
```

## Task 3.2: Build `RegionHintChip` component

**Files:**
- Create: `src/components/RegionHintChip.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/RegionHintChip.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import React from "react";

interface RegionHintChipProps {
  region: string;
}

export const RegionHintChip: React.FC<RegionHintChipProps> = ({ region }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative inline-flex items-center gap-2 self-start mt-2 px-3 py-1.5 rounded-full border border-indigo-300 bg-indigo-50 text-indigo-800 text-sm font-medium overflow-hidden animate-hint-glow"
    >
      <span aria-hidden>💡</span>
      <span>
        <span className="opacity-70 mr-1">Hint:</span>
        {region}
      </span>
      <span className="absolute inset-0 pointer-events-none animate-hint-shimmer" />
    </motion.div>
  );
};
```

- [ ] **Step 2: Add the keyframes to globals.css**

Open `src/app/globals.css` and append:

```css
@keyframes hint-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.0); }
  50%      { box-shadow: 0 0 16px 2px rgba(99, 102, 241, 0.35); }
}
.animate-hint-glow {
  animation: hint-glow 2.4s ease-in-out infinite;
}

@keyframes hint-shimmer {
  0%   { transform: translateX(-100%); opacity: 0; }
  10%  { opacity: 0.6; }
  60%  { opacity: 0.6; }
  100% { transform: translateX(100%); opacity: 0; }
}
.animate-hint-shimmer {
  background: linear-gradient(
    100deg,
    transparent 30%,
    rgba(255, 255, 255, 0.55) 50%,
    transparent 70%
  );
  animation: hint-shimmer 1.2s ease-out 0.1s 1 forwards;
}
```

(The shimmer runs once on mount; the glow loops gently to keep marking it as a clue without becoming distracting.)

- [ ] **Step 3: Visually verify the component in isolation**

Temporarily add `<RegionHintChip region="Iberian / Southern Europe" />` somewhere obvious (e.g. inside `GuessFeedback` unconditionally). Run dev server, confirm:
- The chip appears with the lightbulb prefix, indigo accent, the word "Hint:" muted.
- A one-time light sweep crosses left-to-right on mount.
- A soft glow pulses gently after the shimmer ends.
- Visually distinct from the amber ingredient chips already on screen.

Remove the temporary render before continuing.

- [ ] **Step 4: Commit**

```bash
git add src/components/RegionHintChip.tsx src/app/globals.css
git commit -m "feat(hints): RegionHintChip component with lightbulb + shimmer + glow"
```

## Task 3.3: Wire the hint into `GuessFeedback`

**Files:**
- Modify: `src/components/GuessFeedback.tsx`

- [ ] **Step 1: Add the trigger and the render**

Replace the body of `src/components/GuessFeedback.tsx`:

```tsx
"use client";

import { useGameStore } from "@/store";
import { AnimatePresence, motion } from "framer-motion";
import { getCuisineRegion } from "@/data/cuisineRegions";
import { RegionHintChip } from "./RegionHintChip";

export const GuessFeedback = () => {
  const { currentDish, gamePhase, revealedIngredients, dishGuesses } = useGameStore();

  if (!currentDish) return null;

  const showIngredientHints =
    gamePhase !== "country" && revealedIngredients >= 1;

  const isDishPhase = gamePhase === "dish";
  const region = isDishPhase ? getCuisineRegion(currentDish.country) : null;
  const showRegionHint =
    isDishPhase && dishGuesses.length >= 3 && region !== null;

  // Early return only when there's truly nothing to show.
  if (!showIngredientHints && !showRegionHint) return null;

  return (
    <div className="flex flex-col gap-2">
      {showIngredientHints && revealedIngredients > 1 && (
        <div className="flex flex-col gap-1">
          <div className="text-sm text-gray-600">Revealed Ingredients:</div>
          <div className="flex flex-wrap gap-1">
            <AnimatePresence initial={false}>
              {currentDish.ingredients
                .slice(0, revealedIngredients - 1)
                .map((ingredient, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded border border-amber-300 list-none"
                  >
                    {ingredient}
                  </motion.li>
                ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {showRegionHint && region && <RegionHintChip region={region} />}
    </div>
  );
};
```

- [ ] **Step 2: Manually verify the trigger**

Load a dish you know the country of (or check the local store via devtools). Make:
- 1st wrong guess — no region chip yet.
- 2nd wrong guess — no region chip yet.
- 3rd wrong guess — chip appears with shimmer + glow below the ingredient row.
- 4th wrong guess — chip persists, does NOT re-shimmer.

For a dish whose country is *not* in `CUISINE_REGIONS` (you can temporarily delete its mapping to test): make 3 wrong guesses — no chip renders, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/GuessFeedback.tsx
git commit -m "feat(hints): show cuisine-region chip after 3rd wrong dish guess"
```

---

# Section 4 — Image generation upgrade

## Task 4.1: Define the `ImageGenerator` interface

**Files:**
- Create: `src/services/imageGenerators/types.ts`

- [ ] **Step 1: Create the interface file**

Create `src/services/imageGenerators/types.ts`:

```ts
export interface ImageGenerationOpts {
  width: number;
  height: number;
}

export interface ImageGenerationResult {
  /** Direct URL to the generated image (typically expires; consumers re-host). */
  url: string;
  /** Cost of this single generation in USD. */
  cost: number;
  /** Provider/model identifier for downstream tracking. */
  source: string;
}

export interface ImageGenerator {
  generate(prompt: string, opts: ImageGenerationOpts): Promise<ImageGenerationResult>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/imageGenerators/types.ts
git commit -m "feat(image-gen): introduce ImageGenerator adapter interface"
```

## Task 4.2: Extract the existing DALL-E 3 path behind the interface

**Files:**
- Create: `src/services/imageGenerators/openaiDallE3.ts`

- [ ] **Step 1: Create the DALL-E 3 generator**

Create `src/services/imageGenerators/openaiDallE3.ts`:

```ts
import OpenAI from "openai";
import { ImageGenerator, ImageGenerationOpts, ImageGenerationResult } from "./types";

export class OpenAIDallE3Generator implements ImageGenerator {
  private openai: OpenAI;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OpenAIDallE3Generator: missing OPENAI_API_KEY");
    this.openai = new OpenAI({ apiKey: key });
  }

  async generate(prompt: string, _opts: ImageGenerationOpts): Promise<ImageGenerationResult> {
    // DALL-E 3 only supports a fixed set of resolutions; we keep it on the
    // historical 1024x1024 for backwards-compatibility with existing tiles.
    const response = await this.openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural",
    });

    const url = response.data?.[0]?.url;
    if (!url) throw new Error("OpenAIDallE3Generator: no image URL returned");

    return {
      url,
      cost: 0.04,
      source: "dall-e-3",
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/imageGenerators/openaiDallE3.ts
git commit -m "feat(image-gen): extract DALL-E 3 path behind ImageGenerator interface"
```

## Task 4.3: Build the Google Imagen 4 Ultra generator

**Files:**
- Create: `src/services/imageGenerators/googleImagen4Ultra.ts`

- [ ] **Step 1: Install the Google GenAI SDK**

```bash
npm install @google/genai
```

- [ ] **Step 2: Look up the current Imagen API surface in `@google/genai`**

Open `node_modules/@google/genai/dist/index.d.ts` (or the equivalent path post-install) and find the image-generation method. As of the package's current Imagen support, generation is done via something like:

```ts
const ai = new GoogleGenAI({ apiKey });
const result = await ai.models.generateImages({
  model: "imagen-4.0-ultra-generate-001",
  prompt,
  config: {
    numberOfImages: 1,
    aspectRatio: "3:2",
  },
});
const imageBytes = result.generatedImages?.[0]?.image?.imageBytes; // base64
```

If the actual SDK shape differs (the field names sometimes drift between versions), prefer the shape that matches the installed `@google/genai` `.d.ts`. The contract you need is: send a prompt + model + aspect ratio, receive bytes back.

- [ ] **Step 3: Create the generator**

Create `src/services/imageGenerators/googleImagen4Ultra.ts`:

```ts
import { GoogleGenAI } from "@google/genai";
import { ImageGenerator, ImageGenerationOpts, ImageGenerationResult } from "./types";

const MODEL_ID = "imagen-4.0-ultra-generate-001";
const COST_PER_IMAGE_USD = 0.06;

export class GoogleImagen4UltraGenerator implements ImageGenerator {
  private ai: GoogleGenAI;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GoogleImagen4UltraGenerator: missing GEMINI_API_KEY");
    this.ai = new GoogleGenAI({ apiKey: key });
  }

  async generate(prompt: string, opts: ImageGenerationOpts): Promise<ImageGenerationResult> {
    // Only 3:2 is supported by this generator right now (matches our tile aspect).
    if (opts.width !== 1536 || opts.height !== 1024) {
      throw new Error(
        `GoogleImagen4UltraGenerator: unsupported size ${opts.width}x${opts.height}; expected 1536x1024 (3:2)`
      );
    }

    const result = await this.ai.models.generateImages({
      model: MODEL_ID,
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "3:2",
      },
    });

    const imageBytes = result.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) throw new Error("GoogleImagen4UltraGenerator: no image bytes returned");

    // Convert base64 bytes to a data URL so the existing uploadImageToSupabase
    // (which fetches the URL via fetch()) can consume it without code changes.
    const url = `data:image/png;base64,${imageBytes}`;

    return {
      url,
      cost: COST_PER_IMAGE_USD,
      source: "imagen-4-ultra",
    };
  }
}
```

- [ ] **Step 4: Confirm `uploadImageToSupabase` can handle `data:` URLs**

Read `src/services/dishImageService.ts` line ~170 (`uploadImageToSupabase`). It uses `fetch(imageUrl)`. `fetch` in modern Node 20 accepts `data:` URLs natively (added in Node 20). If for some reason the existing code path fails on `data:` URLs in your environment, fall back to decoding the base64 directly in the generator and returning a temporary `https://` URL via a Supabase pre-signed upload — but try the simple path first; it almost certainly works.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/services/imageGenerators/googleImagen4Ultra.ts
git commit -m "feat(image-gen): add Google Imagen 4 Ultra generator (1536x1024 3:2)"
```

## Task 4.4: Add the generator barrel + default selector

**Files:**
- Create: `src/services/imageGenerators/index.ts`

- [ ] **Step 1: Create the barrel + factory**

Create `src/services/imageGenerators/index.ts`:

```ts
import { GoogleImagen4UltraGenerator } from "./googleImagen4Ultra";
import { OpenAIDallE3Generator } from "./openaiDallE3";
import { ImageGenerator } from "./types";

export type { ImageGenerator, ImageGenerationOpts, ImageGenerationResult } from "./types";
export { GoogleImagen4UltraGenerator, OpenAIDallE3Generator };

/**
 * Returns the configured default ImageGenerator.
 * Set IMAGE_GENERATOR=dall-e-3 in env to fall back to the old path
 * (e.g. for emergency rollback). Defaults to Imagen 4 Ultra.
 */
export function createDefaultImageGenerator(): ImageGenerator {
  const which = (process.env.IMAGE_GENERATOR ?? "imagen-4-ultra").toLowerCase();
  switch (which) {
    case "dall-e-3":
      return new OpenAIDallE3Generator();
    case "imagen-4-ultra":
    default:
      return new GoogleImagen4UltraGenerator();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/imageGenerators/index.ts
git commit -m "feat(image-gen): add generator barrel + IMAGE_GENERATOR env-driven selector"
```

## Task 4.5: Rewrite `createOptimizedPrompt` to the cinematographic template

**Files:**
- Modify: `src/services/dishImageService.ts`

- [ ] **Step 1: Replace `createOptimizedPrompt` and `getDishStyle`**

In `src/services/dishImageService.ts`, replace the existing `createOptimizedPrompt` method (line ~86) AND the existing `getDishStyle` method (line ~109) with the new helpers:

```ts
private createOptimizedPrompt(dishData: DishImageData): string {
  const { name, ingredients, country, blurb, tags } = dishData;
  const text = [...tags, blurb].join(" ").toLowerCase();
  const angle = this.getCameraAngle(text);
  const surface = this.getSurface(text);
  const cookingCue = this.getCookingCue(text);
  const visibleIngredients = ingredients.slice(0, 3).join(", ");

  return (
    `${angle} photograph of ${name}, traditional dish from ${country}. ` +
    `${cookingCue}, plated with ${visibleIngredients}. ` +
    `Soft natural daylight from the left, ${surface} background, ` +
    `shallow depth of field with the plate centered in frame. ` +
    `Editorial food photography, 50mm lens, warm color grading, restaurant magazine quality.`
  );
}

private getCameraAngle(text: string): string {
  if (/(soup|stew|ramen|broth|curry)/.test(text)) return "45-degree close-up";
  if (/(street food|handheld|sandwich|taco|burger|wrap)/.test(text)) return "Eye-level close-up";
  return "Overhead";
}

private getSurface(text: string): string {
  if (/(fine dining|elegant|refined)/.test(text)) return "dark slate";
  if (/(street food|market|casual)/.test(text)) return "weathered concrete";
  return "rustic weathered wood";
}

private getCookingCue(text: string): string {
  const cues: string[] = [];
  if (/(grilled|bbq|charred)/.test(text)) cues.push("deep char marks, glossy marinade");
  if (/fried/.test(text)) cues.push("golden brown crispy crust, light oil sheen");
  if (/(baked|roasted)/.test(text)) cues.push("caramelized crust, deep golden tones");
  if (/steamed/.test(text)) cues.push("tender moist surface, subtle steam rising");
  if (/(creamy|rich)/.test(text)) cues.push("velvety sauce with glossy sheen");
  if (/(noodles|pasta)/.test(text)) cues.push("perfectly twirled strands, sauce clinging to each");
  if (/(soup|stew)/.test(text)) cues.push("rich broth catching the light, ingredients half-submerged");
  if (/(spicy|hot)/.test(text)) cues.push("deep red and orange tones");
  if (/(fresh|salad|raw)/.test(text)) cues.push("vibrant raw textures, glistening dressing");
  return cues.length ? cues.join(", ") : "rich textures and natural colors";
}
```

- [ ] **Step 2: Eyeball-verify the prompt output**

Add a temporary console log inside `generateDishImage` printing the full prompt before the API call. Run any single-dish smoke test (the existing `scripts/test-single-dish.ts` or the daily generator pointed at a known dish). Confirm the printed prompt:
- Starts with one of "Overhead" / "45-degree close-up" / "Eye-level close-up".
- Does NOT contain the old "appetizing", "vibrant colors", or "perfectly centered" repetitions.
- Mentions a single camera angle (no "or").
- Ends with the cinematographic phrasing ("50mm lens, warm color grading, restaurant magazine quality.").

Remove the temporary console.log.

- [ ] **Step 3: Commit**

```bash
git add src/services/dishImageService.ts
git commit -m "feat(image-gen): replace DALL-E hedging prompt with cinematographic template"
```

## Task 4.6: Make `DishImageService` use the configured generator at 3:2

**Files:**
- Modify: `src/services/dishImageService.ts`

- [ ] **Step 1: Switch from direct OpenAI calls to the adapter**

At the top of `src/services/dishImageService.ts`, add:

```ts
import { createDefaultImageGenerator, ImageGenerator } from "./imageGenerators";
```

In the class field declarations, replace `private openai: OpenAI;` with:

```ts
private generator: ImageGenerator;
private supabase: ReturnType<typeof createClient>;
```

In the constructor, replace the OpenAI initialization with:

```ts
constructor() {
  this.generator = createDefaultImageGenerator();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  this.supabase = createClient(supabaseUrl, supabaseServiceKey);
}
```

- [ ] **Step 2: Replace the `generateDishImage` body with the adapter call**

Replace the body of `generateDishImage` (the part inside the try block, lines ~46–76):

```ts
async generateDishImage(dishData: DishImageData): Promise<ImageGenerationResult> {
  try {
    console.log(`🎨 Generating image for: ${dishData.name}`);
    const prompt = this.createOptimizedPrompt(dishData);
    console.log(`📝 Using prompt: ${prompt.substring(0, 100)}…`);

    const result = await this.generator.generate(prompt, { width: 1536, height: 1024 });

    const { filename, publicUrl } = await this.uploadImageToSupabase(result.url);
    console.log(`✅ Image generated and uploaded to Supabase: ${filename}`);

    return {
      imageUrl: publicUrl,
      source: result.source as "dall-e-3", // existing return type accepts string literal; widen if needed
      cost: result.cost,
      prompt,
      filename,
    };
  } catch (error) {
    console.error(`💥 Image generation failed for ${dishData.name}:`, error);
    throw error;
  }
}
```

Also update the existing local `ImageGenerationResult` interface at the top of the file to widen `source` from `"dall-e-3"` to `string` (since the value now varies by generator).

- [ ] **Step 3: Update `generateImageVariations` to use the adapter too**

In the same file, in `generateImageVariations` (around line 212), replace each `this.openai.images.generate({...})` call with `this.generator.generate(prompt, { width: 1536, height: 1024 })` following the same pattern as in Step 2. Drop the in-loop `imageUrl: publicUrl || "/images/404.png"` defensiveness — let exceptions bubble per the existing catch-and-continue.

- [ ] **Step 4: Delete the unused OpenAI import**

Since the direct `OpenAI` client is no longer instantiated in this file, remove `import OpenAI from "openai";` from the top of `dishImageService.ts`.

- [ ] **Step 5: Smoke-test with the new generator**

Set `GEMINI_API_KEY` in `.env.local` (use a personal API key from https://aistudio.google.com). Run a single-dish generation:

```bash
npx tsx scripts/test-single-dish.ts
```

Confirm:
- Generation succeeds.
- The saved image is 1536×1024 (check via Supabase storage or by downloading it).
- The image visibly resembles the cinematographic prompt — single angle, food magazine quality, no "uncanny" DALL-E artifacts.
- The cost logged is `0.06`.
- The source recorded is `imagen-4-ultra`.

Then sanity-check rollback works: set `IMAGE_GENERATOR=dall-e-3` in `.env.local`, rerun the smoke test — generation should succeed via DALL-E 3 producing a 1024×1024 image (which will still be tile-able via the existing crop fallback added in Task 4.7). Unset the env var to restore Imagen as default.

- [ ] **Step 6: Commit**

```bash
git add src/services/dishImageService.ts
git commit -m "feat(image-gen): swap DishImageService to use ImageGenerator adapter at 1536x1024"
```

## Task 4.7: Skip resize-to-3:2 step in `generateTiles` when source already matches

**Files:**
- Modify: `scripts/daily-generate.ts`

- [ ] **Step 1: Update `generateTiles`**

In `scripts/daily-generate.ts`, replace the body of `generateTiles` (lines ~536–612) — specifically the resize math block (~552–562) — with:

```ts
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
  const aspectMatches = Math.abs(currentAspectRatio - targetAspectRatio) < 0.01;

  let baseImage: any;
  let resizeWidth: number;
  let resizeHeight: number;

  if (aspectMatches) {
    // Source is already 3:2 (Imagen 4 Ultra path) — tile directly, no resize.
    resizeWidth = metadata.width;
    resizeHeight = metadata.height;
    baseImage = image;
  } else {
    // Source is square (DALL-E 3 fallback) — keep the historical fit-crop path.
    if (currentAspectRatio > targetAspectRatio) {
      resizeHeight = metadata.height;
      resizeWidth = Math.round(resizeHeight * targetAspectRatio);
    } else {
      resizeWidth = metadata.width;
      resizeHeight = Math.round(resizeWidth / targetAspectRatio);
    }
    baseImage = image.resize(resizeWidth, resizeHeight, {
      fit: "cover",
      position: "center",
    });
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
```

- [ ] **Step 2: Smoke-test tile generation**

Run a full end-to-end generation against a staging DB (or your local Supabase):

```bash
npx tsx scripts/daily-generate.ts
```

Look in Supabase storage `dish-tiles/<dishId>/`:
- 6 `regular-*.jpg` files exist.
- 6 `blurred-*.jpg` files exist.
- Combined visually they reconstruct the full image (no gaps, no overlap).

Play the generated dish via the dev server — the tile grid should render and reveal correctly.

- [ ] **Step 3: Commit**

```bash
git add scripts/daily-generate.ts
git commit -m "feat(tiles): skip resize-to-3:2 when source image already matches the target aspect"
```

## Task 4.8: Add `GEMINI_API_KEY` to the daily-generate workflow

**Files:**
- Modify: `.github/workflows/daily-generate.yml`

- [ ] **Step 1: Add the secret to the .env.local heredoc**

In `.github/workflows/daily-generate.yml`, in the "Create .env.local" step, add a line for `GEMINI_API_KEY`:

```yaml
      - name: Create .env.local
        run: |
          cat > .env.local << 'EOF'
          OPENAI_API_KEY=${{ secrets.OPENAI_API_KEY }}
          GEMINI_API_KEY=${{ secrets.GEMINI_API_KEY }}
          NEXT_PUBLIC_SUPABASE_URL=${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY=${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          DAILY_COST_CAP_USD=${{ secrets.DAILY_COST_CAP_USD }}
          TARGET_BUFFER_DAYS=${{ secrets.TARGET_BUFFER_DAYS }}
          EOF
```

- [ ] **Step 2: Add the secret to the GitHub repo**

In the GitHub repo settings → Secrets and variables → Actions → New repository secret:
- Name: `GEMINI_API_KEY`
- Value: your Imagen API key from https://aistudio.google.com

(This is a manual step done in the GitHub UI, not in code. Skip if the team handles secrets via a different mechanism — just ensure the secret exists by the time the workflow next runs.)

- [ ] **Step 3: Manually trigger the workflow to verify**

In GitHub Actions → Daily Dish Generation → Run workflow (workflow_dispatch).

Watch the run logs:
- "Create .env.local" step succeeds.
- "Run daily generator" step logs `🎨 Generating image for: <name>` followed by a successful Supabase upload.
- No `GEMINI_API_KEY missing` errors.

If the buffer is already full (`bufferDays >= TARGET_BUFFER_DAYS`) the script will short-circuit. To force a generation, temporarily lower `TARGET_BUFFER_DAYS` in the workflow secrets, run, then restore. Or pick any dish in the database, delete it, and re-run — but that's destructive, avoid unless needed.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/daily-generate.yml
git commit -m "ci(daily-generate): pass GEMINI_API_KEY into the workflow env file"
```

---

## Final Verification

Walk through the complete play-through once with all changes integrated:

- [ ] Load `/play` — text input is auto-focused on desktop (not mobile).
- [ ] Header shows the 🔥 streak chip if your streak is ≥1.
- [ ] Type a wrong dish guess — get an ingredient hint.
- [ ] After the 3rd wrong dish guess — region hint chip appears below ingredients, shimmer + glow visible, clearly distinct from amber ingredient chips.
- [ ] Try a known short-form for a recently-generated dish — accepted via fuzzy match.
- [ ] Click the give-up button — confirm it reads "🏳️ Give up" outline style, opens the confirm dialog.
- [ ] Solve the dish — advance to country phase (autofocus there too).
- [ ] Solve country and protein — results modal appears (Radix, dismissible via Esc / outside-click / X).
- [ ] Dismiss the modal — "View Results" button appears at the bottom of the protein phase. Click it — modal re-opens, no duplicate score submission.
- [ ] Open archive picker — confirm 90 days of past dates are selectable.
- [ ] Visit `/statistics` — streak chip on the header still works there if it's visible across routes (it is — `GameHeader` is shared).
- [ ] Visually compare the dish image (newly generated, Imagen 4 Ultra) against an older DALL-E 3 dish image side by side — the new one should look noticeably better.
