# Game Experience Improvements — Design

A bundle of UX, gameplay, and content-quality improvements to the daily dish-guessing game. Scoped to changes that don't require new backend infrastructure beyond swapping the image generation provider.

## Goals

- Reduce small friction points in the play loop (modal close, autofocus, give-up affordance, streak visibility).
- Make dishes more guessable by widening the accepted answer set without making the game trivial.
- Add a single, well-emphasized progressive hint that complements (not duplicates) the existing ingredient-reveal mechanic.
- Replace the current image generation model with a higher-quality, similarly-priced alternative, and lean into a cleaner prompt style.
- Expand archive access from 30 days to 90 days.

## Non-Goals

- No changes to scoring, leaderboard math, or the protein/country phase core mechanics.
- No re-design of the share modal, statistics page, or onboarding/intro flow.
- No phase auto-advance after a correct guess (decided out of scope).
- No new runtime LLM calls for guess evaluation (deferred — re-evaluate after Section 3 ships and analytics show whether near-miss frustration persists).
- No new backend services. The image-model swap stays inside `daily-generate.ts` and `dishImageService.ts`.

## Architecture Overview

The improvements split into four loosely-coupled areas, each shippable in its own PR:

1. **Small UX wins** — modal dismiss, autofocus, give-up button, streak chip, archive range.
2. **Guess acceptance widening** — broaden AI-generated `acceptableGuesses` + auto-accept high-confidence fuzzy matches at runtime.
3. **Cuisine-region progressive hint** — new chip after the 3rd wrong dish guess, with a distinct visual treatment to mark it as a clue.
4. **Image generation upgrade** — DALL-E 3 → Imagen 4 Ultra (via fal.ai), at 3:2 native, with a leaner cinematographic prompt.

All four can ship independently and in any order. There are no cross-cutting state/store changes required.

---

## Section 1 — Small UX wins

### 1.1 Result modal: ESC + outside-click dismiss

**Current state:** `src/components/ResultModal.tsx:138` renders a raw `<div>` overlay with a single `✕` button as the only dismiss path. No keyboard or backdrop handling.

**Change:** replace the raw overlay with the existing Radix-based `Dialog` (already used in `ArchiveDatePicker.tsx` and `GiveUpButton.tsx`). Radix handles ESC and outside-click natively via `onOpenChange`. Modal open state is bound to the existing `modalVisible` store flag.

**Mid-game re-open safety:** once the modal is closed mid-day, the player should never lose access to their final results. When `gamePhase === "complete"` and `modalVisible === false`, render a persistent **"View Results"** button at the bottom of the protein-phase complete view. Clicking re-opens the modal via `toggleModal(true)`. No new state needed.

### 1.2 Autofocus text input on game entry — desktop only

**Current state:** `TextInput` in `src/components/inputs/TextInput.tsx:134` is not autofocused. Players have to click before typing.

**Change:** add autofocus on mount when the active phase is `dish` or `country` (both text-input phases) **and** the device is non-touch. Touch detection via `window.matchMedia('(hover: hover) and (pointer: fine)').matches` — true on desktop/laptop, false on mobile/tablet, avoids popping the mobile keyboard.

Implementation: `useRef<HTMLInputElement>` on the `Input` inside `TextInput`, focus call in a `useEffect` gated by the media query. No focus on `NumberInput` (protein phase) — that one's less essential and the iOS numeric keyboard popping uninvited is more disruptive.

### 1.3 Give-up button — clearer affordance, consistent across phases

**Current state:** `GiveUpButton.tsx` renders a red-background button with only a `/images/give-up.png` flag icon. Functional but cryptic. A secondary "Give up and see results" text link exists in `GuessInput.tsx:219` but only for the protein phase at ≥3 guesses — that secondary path is inconsistent with the other phases.

**Change:**
- Replace the icon-only button with an outline button: `🏳️ Give up` (icon + label). Same `GiveUpButton.tsx` component, same confirm dialog. Just a visual swap so it reads as an action.
- Remove the secondary "Give up and see results" link from `GuessInput.tsx` — the primary button is now clear enough on its own.
- No conditioning on guess count — flag is available immediately in every phase.

### 1.4 Streak chip in header

**Current state:** the 🔥 streak indicator only appears inside the post-game result modal.

**Change:** render a small streak chip in `GameHeader.tsx` next to the Statistics button, **only when `streak ≥ 1`**. Reuses the existing `streak` value from `useGameStore`. Tapping it routes to `/statistics`. Visual style matches the in-modal version (orange/red, 🔥 emoji prefix).

### 1.5 Archive range: 30 → 90 days

**Current state:** `src/components/ArchiveDatePicker.tsx:34` hard-codes a 30-day window.

**Change:** bump the constant to 90 days. Verify that the `/api/archive-unlock` and `/api/dishes?date=...` paths don't impose their own 30-day cap. If they do, lift those too.

---

## Section 2 — Widen dish acceptance

### 2.1 Broader `acceptableGuesses` at generation time

**Current state:** `src/services/aiService.ts:148` prompts the AI for `2-4 smart variations`. Result is often too narrow — e.g. "piri piri" is rejected for "Piri-piri Chicken" (see attached gameplay screenshot, guess #2).

**Change:** update the prompt to request **6 to 10 variations** covering:
- Common misnames and shortened forms (e.g. "piri piri", "peri peri chicken").
- English vs. native-language names where both are commonly used.
- Singular and plural forms.
- Common alternate spellings and regional variants.

Validation in `validateDishData` updated to require `acceptableGuesses.length >= 6`.

**Backfill:** existing dishes in the database keep their narrower lists. We don't retroactively regenerate — but we *do* add a one-off script `scripts/expand-acceptable-guesses.ts` that takes the existing dish list and asks the AI to extend each `acceptableGuesses` array to the new 6–10 target. Idempotent (skips dishes already at ≥6 variations). Cost is bounded — ~$0.001 per dish via gpt-4o-mini, run once.

### 2.2 Auto-accept high-confidence fuzzy matches at runtime

**Current state:** `src/utils/gameHelpers.ts:181` (`getClosestGuess`) only ever returns a suggestion to render as a "Did you mean X?" toast — never marks the guess correct directly.

**Change:** introduce a new helper `getStrongFuzzyMatch(input, options)` that returns a match only when confidence is *very* high — fuse.js score ≤ 0.15, OR a meaningful exact-substring containment with length ratio ≥ 0.5. In `DishPhase.tsx:36`, the dish-correctness check becomes:

```ts
const isCorrect =
  currentDish?.acceptableGuesses?.includes(guess.toLowerCase()) ||
  !!getStrongFuzzyMatch(guess, currentDish?.acceptableGuesses ?? []);
```

When the fuzzy match wins, the canonical form is stored in `dishGuesses` (not the raw input) so the UI shows the player they got it right with the "real" answer.

`getClosestGuess` continues to handle the looser "did you mean?" suggestion case for typos that aren't quite confident enough to auto-accept.

---

## Section 3 — Cuisine-region progressive hint

**Background:** the existing wrong-guess feedback already reveals ingredients one by one (`GuessFeedback.tsx`, driven by `revealedIngredients` in the game store). `reorderIngredientsForGameplay` ensures the first revealed ingredients are "safe" — they don't appear in `acceptableGuesses`. This existing mechanic is good and stays unchanged.

**Change:** add **one** additional hint type — cuisine region — that complements the ingredient reveals rather than duplicating them.

### 3.1 Region data

New file `src/data/cuisineRegions.ts`:

```ts
export const CUISINE_REGIONS: Record<string, string> = {
  Portugal: "Iberian / Southern Europe",
  Spain: "Iberian / Southern Europe",
  Thailand: "Southeast Asia",
  Japan: "East Asia",
  // ...one entry per country currently in the dishes table
};

export function getCuisineRegion(country: string): string | null {
  return CUISINE_REGIONS[country] ?? null;
}
```

Generated once from the existing list of distinct `country` values in the dishes table. Manual curation — there are only ~50 countries.

### 3.2 Trigger and display

**Trigger:** appears after the **3rd wrong dish guess** (i.e. when `dishGuesses.length === 3` and the most recent guess was wrong). Persists for the rest of the dish phase. No additional hint chips after this one.

**Component:** new `RegionHintChip.tsx` rendered inside `GuessFeedback.tsx`, below the existing ingredient chip row. Only renders during the dish phase, only when the trigger condition is met.

**Visual treatment** (to mark it as a *clue*, distinct from the *factual* ingredient chips):
- 💡 lightbulb icon prefix.
- Soft indigo / lavender accent (distinct from the amber ingredient chips).
- One-time shimmer sweep on first appearance (CSS keyframe animation, ~1.2s, runs once).
- Subtle pulsing glow that persists (low-intensity, doesn't compete for attention after the first second).

**Copy:** `💡 Hint: {region}` — e.g. `💡 Hint: Iberian / Southern Europe`.

**Fallback:** if `getCuisineRegion(country)` returns null (unmapped country), the chip doesn't render. No error.

---

## Section 4 — Image generation upgrade

### 4.1 Model swap: DALL-E 3 → Imagen 4 Ultra via Google Gemini Developer API

**Current state:** `src/services/dishImageService.ts:49` calls `openai.images.generate({ model: "dall-e-3", ... })` at `1024×1024`, `standard` quality, ~$0.04/image. DALL-E 3 is now ~2 years old; bake-off (3 contenders × 4 dishes on fal.ai's playground) confirmed Imagen 4 Ultra as the best quality-per-dollar for this game's plated-food aesthetic. We integrate against Google directly (not fal.ai) — same model, no middleman markup, no extra account.

**Sunset awareness:** Google has signalled that the Imagen 4 family is scheduled for deprecation on/around June 24, 2026 with a planned migration path to Gemini Image / Nano Banana models. At today's pricing Nano Banana is ~5x more expensive ($0.30 vs $0.06), so it's not a drop-in replacement we'd want to make pre-emptively. The adapter pattern below makes the eventual swap a ~1-day change. A follow-up task (see Open Questions) tracks revisiting this in mid-June.

**Change:**
- Add Google Gemini Developer API integration via the `@google/genai` package — API-key auth (`GEMINI_API_KEY`), same shape as the existing `OPENAI_API_KEY`. No GCP project / service account / Vertex setup required.
- Replace the OpenAI `images.generate` call in `generateDishImage` with a Gemini API call to model `imagen-4.0-ultra-generate-001`.
- Output resolution: **`1536×1024` (3:2 aspect)** native — eliminates the post-generation crop step in `daily-generate.ts:552-562` (`generateTiles` previously had to compute a target 3:2 box and crop the square down).
- The `uploadImageToSupabase` flow (download → hash → upload to `dish-images-v2` bucket) stays unchanged.
- New env var: `GEMINI_API_KEY` (read in `dishImageService.ts` constructor alongside the existing `SUPABASE_*` vars; also added to the GitHub Actions secrets used by the `daily-generate` workflow).
- Update `ImageGenerationResult.source` from `"dall-e-3"` to `"imagen-4-ultra"`.
- Cost field: `0.06` per image (up from `0.04`). At ~1 dish/day, monthly cost stays under $2.

**Thin adapter for future swaps:** factor the model call behind a small interface so the model is one config flip:

```ts
interface ImageGenerator {
  generate(prompt: string, opts: { width: number; height: number }): Promise<{ url: string; cost: number }>;
}

class GoogleImagen4UltraGenerator implements ImageGenerator { ... }
class OpenAIDallE3Generator implements ImageGenerator { ... } // kept as fallback / for reference
```

`DishImageService` constructs the configured generator and calls it. Default: `GoogleImagen4UltraGenerator`. Pre-sunset migration adds a third class (`GoogleNanoBananaGenerator` or whichever replacement we settle on) and flips the default.

### 4.2 New cinematographic prompt template

**Current state:** `createOptimizedPrompt` in `dishImageService.ts:86` and `getDishStyle` at line 109 produce a prompt that triple-repeats "centered", hedges "overhead OR 45-degree", and front-loads adjective hedging ("appetizing", "vibrant") that were DALL-E 3 workarounds. Modern models reward specificity.

**Change:** rewrite `createOptimizedPrompt` and replace `getDishStyle` with three smaller helpers that return cinematographic phrasing instead of adjectives:

```ts
private createOptimizedPrompt(dishData: DishImageData): string {
  const { name, ingredients, country, blurb, tags } = dishData;
  const text = [...tags, blurb].join(" ").toLowerCase();
  const angle = this.getCameraAngle(text);
  const surface = this.getSurface(text);
  const cookingCue = this.getCookingCue(text);
  const visibleIngredients = ingredients.slice(0, 3).join(", ");

  return `${angle} photograph of ${name}, traditional dish from ${country}. ` +
    `${cookingCue}, plated with ${visibleIngredients}. ` +
    `Soft natural daylight from the left, ${surface} background, ` +
    `shallow depth of field with the plate centered in frame. ` +
    `Editorial food photography, 50mm lens, warm color grading, restaurant magazine quality.`;
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

Old `getDishStyle` and its style branches are deleted. `generateImageVariations` is updated to use the new prompt too.

### 4.3 Tile generation: drop the crop step

**Current state:** `daily-generate.ts:552-562` resizes the square 1024×1024 to a 3:2 fit before extracting six tiles.

**Change:** when the source image is already 3:2 (1536×1024), skip the resize-and-fit math and tile directly. Falls back to the existing resize logic if a non-3:2 image is ever passed in (defensive — e.g. the DALL-E 3 fallback generator). No change to tile output dimensions, bucket layout, or `/api/dish-tiles*` consumers.

---

## Data Flow

No new long-lived state. Summary of touched components:

```
GameHeader  ──reads──> useGameStore.streak  (new: streak chip)

DishPhase ──renders──> GuessFeedback
                          ├── existing: ingredient chips
                          └── new: RegionHintChip (after 3rd wrong guess)

GuessInput ──renders──> GiveUpButton  (new visual: outline + label)
                       (removed: secondary "give up and see results" link)

ResultModal (Radix Dialog) ──bound to──> useGameStore.modalVisible
            └── ESC / outside-click → toggleModal(false)
            └── persistent re-open via "View Results" in complete view

ArchiveDatePicker ──constant──> 90 days (was 30)

daily-generate ──> AIService (broader acceptableGuesses)
              ──> DishImageService ──> ImageGenerator (FalImagen4Ultra)
                                      └── 1536×1024 native, no crop
              ──> generateTiles (skip resize when source is 3:2)
```

## Error Handling

- **Region hint:** missing region → don't render. No log spam.
- **Fuzzy auto-accept:** never relies on a single signal — both score threshold AND substring containment paths must pass independently. A failed fuzzy lookup falls through to existing "did you mean?" toast logic.
- **fal.ai client errors:** caught in `generateDishImage` and re-thrown — `daily-generate.ts` already has a `continue` on the catch, so a single failed generation doesn't abort the batch.
- **Missing `FAL_KEY`:** fail fast at service construction with a clear error message (matching the existing pattern for `SUPABASE_SERVICE_ROLE_KEY`).
- **Modal close mid-game:** the "View Results" button is the safety net. No data loss possible since results are already computed and submitted by the time the modal opens.

## Testing

Manual verification per area:

**Section 1**
- Modal closes on `Esc`, on backdrop click, and on the `✕` button.
- Close → re-open via "View Results" works without re-running scoring or animations.
- Desktop: input is focused on game load and after each phase transition. Mobile: keyboard does NOT pop.
- Give-up button shows "🏳️ Give up" label, works on first guess in all three phases.
- Streak chip appears in header only when `streak ≥ 1`, links to `/statistics`.
- Archive picker offers 90 days of past dates; selecting day 89 loads the correct dish.

**Section 2**
- Generate a new dish, confirm `acceptableGuesses.length >= 6`.
- Run `scripts/expand-acceptable-guesses.ts` against staging dishes, verify each now has ≥6 entries, no duplicates.
- Play a dish with a known short variant (e.g. "piri piri" for "Piri-piri Chicken") and confirm auto-accept.
- Play with an obvious typo ("piri pirir") — should still show "Did you mean piri piri?" rather than auto-accepting.
- Play with nonsense ("adasd") — no fuzzy match, no suggestion, normal wrong-guess flow.

**Section 3**
- Make 3 wrong dish guesses on a dish whose country is in the region map — chip appears with shimmer + lightbulb on the 3rd wrong guess.
- Make 3 wrong guesses on a dish whose country is NOT in the map — no chip, no error.
- Chip persists through subsequent wrong guesses; doesn't re-shimmer.
- Visual matches design — distinct from amber ingredient chips.

**Section 4**
- Run `npm run daily-generate` against a staging DB.
- Verify generated image is 1536×1024, looks visibly better than DALL-E 3 baseline, prompt logged shows the new template.
- Verify tiles are generated correctly (6 tiles, 3:2 grid layout intact).
- Verify game plays end-to-end with the new image — blurred tiles + full reveal both render.

## Open Questions / Follow-ups

- **After Section 3 ships:** revisit whether to add a 2nd hint type (e.g. dish category — "noodle dish", "stew") at the 5th wrong guess. Decide based on whether players still get stuck after the region hint.
- **After Section 2 ships:** check PostHog `guess_dish` events for `correct: false` followed by a give-up within 1 guess — high rates suggest semantic-similarity (Option B from brainstorming) is worth adding as a fallback layer.
- **`scripts/expand-acceptable-guesses.ts`** is a one-time backfill. After it runs in production, delete the script (don't leave dead code).
- **Imagen 4 sunset (~June 24, 2026):** before mid-June, verify the deprecation timeline against the Google Cloud / Gemini API console, run a fresh bake-off comparing whatever Imagen-replacement Google is pushing (Nano Banana et al.) against the then-current options across providers, and add a new `ImageGenerator` implementation. Adapter pattern in Section 4.1 keeps this to a ~1-day swap. Track as a calendar reminder.
