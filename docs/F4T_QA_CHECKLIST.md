# F4T QA Checklist - Refactor to Unified Architecture

> **CRITICAL**: F4T is in production. Every change must be tested to ensure no functionality is broken.

## Purpose
This document tracks every change made to the Food for Thought (F4T) game during the refactor to unified multi-game architecture. Each item represents a specific change that must be validated during QA.

---

## Testing Instructions

### Pre-Deployment QA Checklist
- [ ] Complete game flow from start to finish
- [ ] All three phases work correctly (Dish, Country, Protein)
- [ ] Scoring is calculated correctly
- [ ] Archive mode works for past puzzles
- [ ] Share functionality works
- [ ] Mobile responsive design intact
- [ ] Celebration animations trigger correctly
- [ ] Error states handled properly
- [ ] Page navigation works
- [ ] Data persistence (localStorage) works

### Regression Testing Areas
- [ ] Daily puzzle loads correctly
- [ ] Archive puzzle selection works
- [ ] Guess validation logic unchanged
- [ ] Score calculation unchanged
- [ ] UI/UX matches previous version
- [ ] Performance (load time) not degraded

---

## Changes Log

### Phase 1: Foundation
**Status**: ✅ Completed

#### New Files Created (No impact on F4T)
- [x] `src/store/slices/unifiedGameSlice.ts` - New unified store
- [x] `src/engine/PhaseEngine.ts` - New phase engine
- [x] `src/components/inputs/DishInput.tsx` - Split from GuessInput
- [x] `src/components/inputs/LocationInput.tsx` - Split from GuessInput
- [x] `src/components/inputs/ProteinInput.tsx` - Split from GuessInput
- [x] `src/components/inputs/PastaInput.tsx` - Split from GuessInput
- [x] `src/components/inputs/SauceInput.tsx` - Split from GuessInput
- [x] `src/components/game/phases/GenericTextGuessPhase.tsx` - Generic phase component

**QA Impact**: None (new infrastructure only)

---

### Phase 1.5: Store Integration
**Status**: ✅ Completed

#### File: `src/store/index.ts`
**Change Type**: MODIFIED - Added unified store to main store

**Before**:
```tsx
export const useGameStore = create<GameStoreState>()((...a) => ({
  ...createPersistenceSlice(...a),
  ...createGameSlice(...a),
  ...createUiSlice(...a),
  ...createGuessSlice(...a),
  ...createArchiveSlice(...a),
  ...createStreakSlice(...a),
  ...createLeaderboardSlice(...a),
}));
```

**After**:
```tsx
export interface ExtendedGameStoreState extends GameStoreState, UnifiedGameState {}

export const useGameStore = create<ExtendedGameStoreState>()((...a) => ({
  ...createPersistenceSlice(...a),
  ...createGameSlice(...a),
  ...createUiSlice(...a),
  ...createGuessSlice(...a),
  ...createArchiveSlice(...a),
  ...createStreakSlice(...a),
  ...createLeaderboardSlice(...a),
  ...createUnifiedGameSlice(...a), // NEW: Added unified store
}));
```

**What Changed**:
- [x] Added `UnifiedGameState` import from `unifiedGameSlice`
- [x] Created `ExtendedGameStoreState` interface that extends both old and new state
- [x] Added `createUnifiedGameSlice` to store composition
- [x] Maintains backward compatibility - all existing slices still work

**QA Tests**:
- [ ] Page loads without errors
- [ ] Existing game functionality untouched
- [ ] No TypeScript errors
- [ ] Store state accessible from components

---

### Phase 2: Create New Phase Components
**Status**: ✅ Completed

#### New Files Created (V2 Phase Components)
- [x] `src/app/play/DishPhaseV2.tsx` - Uses DishInput instead of GuessInput
- [x] `src/app/play/CountryPhaseV2.tsx` - Uses LocationInput instead of GuessInput
- [x] `src/app/play/ProteinPhaseV2.tsx` - Uses ProteinInput instead of GuessInput

**Key Changes in V2 Components**:
- Use specialized input components (DishInput, LocationInput, ProteinInput)
- Cleaner separation of concerns
- Better type safety
- Same functionality as original phases
- Created as NEW files (originals untouched)

**QA Impact**: None yet (components not wired up)

---

### Phase 3: Wire Up V2 Components
**Status**: ✅ Completed

#### File: `src/components/game/GamePhaseRenderer.tsx`
**Change Type**: MODIFIED - Phase rendering logic

**Before**:
```tsx
import { DishPhase } from "@/app/play/DishPhase";
import { CountryPhase } from "@/app/play/CountryPhase";
import { ProteinPhase } from "@/app/play/ProteinPhase";

// Rendering:
<DishPhase />
<CountryPhase />
<ProteinPhase />
```

**After**:
```tsx
// Added V2 imports
import { DishPhaseV2 } from "@/app/play/DishPhaseV2";
import { CountryPhaseV2 } from "@/app/play/CountryPhaseV2";
import { ProteinPhaseV2 } from "@/app/play/ProteinPhaseV2";

// Feature flag
const USE_V2_COMPONENTS = true;

// Conditional rendering:
{USE_V2_COMPONENTS ? <DishPhaseV2 /> : <DishPhase />}
{USE_V2_COMPONENTS ? <CountryPhaseV2 /> : <CountryPhase />}
{USE_V2_COMPONENTS ? <ProteinPhaseV2 /> : <ProteinPhase />}
```

**What Changed**:
- [x] Added imports for all V2 phase components
- [x] Added `USE_V2_COMPONENTS` feature flag (set to `true`)
- [x] Modified rendering logic to use V2 components when flag is enabled
- [x] Maintained backward compatibility - can toggle back to original by setting flag to `false`
- [x] Applied to both loading state rendering and normal rendering

**QA Tests - CRITICAL**:
- [ ] **Page loads without errors**
- [ ] **Dish phase renders and accepts input**
- [ ] **Can make dish guesses**
- [ ] **Tiles reveal correctly**
- [ ] **Can transition to country phase**
- [ ] **Country phase renders and accepts input**
- [ ] **Can make country guesses**
- [ ] **Map visualizer works**
- [ ] **Can transition to protein phase**
- [ ] **Protein phase renders and accepts input**
- [ ] **Can make protein guesses**
- [ ] **Protein feedback (hot/cold) works**
- [ ] **Can complete full game**
- [ ] **Score calculation correct**
- [ ] **Results modal displays**
- [ ] **Archive mode works**
- [ ] **LocalStorage persistence works**

---

### Phase 4: Testing Results
**Status**: Pending

**Before**:
```tsx
// Uses GameContainer with gameTypeId="food-for-thought"
```

**After**:
```tsx
// Will use same GameContainer but with unified store
```

**What Changed**:
- [ ] TODO: Document actual changes made

**QA Tests**:
- [ ] Page loads without errors
- [ ] Game initializes correctly
- [ ] Daily puzzle displays
- [ ] Archive mode accessible

---

#### File: `src/components/GameContainer.tsx`
**Change Type**: MODIFIED - Main game orchestrator

**What Changed**:
- [ ] TODO: Document changes to store integration
- [ ] TODO: Document changes to phase rendering

**QA Tests**:
- [ ] Container initializes game state
- [ ] Phase transitions work
- [ ] Error boundaries catch errors

---

#### File: `src/components/game/GameLayout.tsx`
**Change Type**: MODIFIED - Game layout component

**What Changed**:
- [ ] TODO: Document changes

**QA Tests**:
- [ ] Layout renders correctly
- [ ] Header shows correct info
- [ ] Game grid displays

---

#### File: `src/components/game/phases/GuessTheDishPhase.tsx`
**Change Type**: MODIFIED - Dish guessing phase

**What Changed**:
- [ ] TODO: Convert from store-connected to props-based
- [ ] TODO: Use new DishInput component

**QA Tests**:
- [ ] Dish input appears
- [ ] Autocomplete works
- [ ] Guess submission works
- [ ] Correct/incorrect feedback
- [ ] Celebration on correct guess
- [ ] Moves to next phase after correct

---

#### File: `src/components/game/phases/GuessTheCountryPhase.tsx`
**Change Type**: MODIFIED - Country guessing phase

**What Changed**:
- [ ] TODO: Convert from store-connected to props-based
- [ ] TODO: Use new LocationInput component

**QA Tests**:
- [ ] Country input appears
- [ ] Autocomplete works
- [ ] Guess submission works
- [ ] Tile reveals work correctly
- [ ] Correct/incorrect feedback
- [ ] Celebration on correct guess
- [ ] Moves to next phase after correct

---

#### File: `src/components/game/phases/GuessTheProteinPhase.tsx`
**Change Type**: MODIFIED - Protein guessing phase

**What Changed**:
- [ ] TODO: Convert from store-connected to props-based
- [ ] TODO: Use new ProteinInput component

**QA Tests**:
- [ ] Protein input appears
- [ ] Autocomplete works
- [ ] Guess submission works
- [ ] Tile reveals work correctly
- [ ] Correct/incorrect feedback
- [ ] Celebration on correct guess
- [ ] Shows final results after correct

---

#### File: `src/components/GuessInput.tsx`
**Change Type**: MODIFIED - Input component

**What Changed**:
- [ ] TODO: Refactor to use specialized input components
- [ ] TODO: Remove game-specific logic

**QA Tests**:
- [ ] Input renders for all phases
- [ ] Autocomplete functionality intact
- [ ] Enter key submits
- [ ] Clear button works
- [ ] Disabled state works

---

#### File: `src/store/index.ts`
**Change Type**: MODIFIED - Store configuration

**What Changed**:
- [ ] TODO: Integrate unified game slice

**QA Tests**:
- [ ] Store initializes correctly
- [ ] State persists to localStorage
- [ ] State hydration works on page load

---

### Phase 3: Integration Testing
**Status**: Not Started

#### Critical User Flows to Test

**Flow 1: Complete Daily Puzzle**
- [ ] Navigate to /play
- [ ] See daily puzzle loaded
- [ ] Guess the dish (correct)
- [ ] See celebration animation
- [ ] Progress to country phase
- [ ] Guess the country (correct)
- [ ] See celebration animation
- [ ] Progress to protein phase
- [ ] Guess the protein (correct)
- [ ] See celebration animation
- [ ] See final results screen
- [ ] Verify score calculation
- [ ] Test share functionality

**Flow 2: Archive Mode**
- [ ] Navigate to /archive
- [ ] Select a past puzzle
- [ ] Complete the puzzle
- [ ] Verify it doesn't affect today's progress
- [ ] Return to daily puzzle
- [ ] Verify daily puzzle state preserved

**Flow 3: Error Handling**
- [ ] Test with network offline
- [ ] Test with invalid puzzle ID
- [ ] Test with corrupted localStorage
- [ ] Verify error messages display
- [ ] Verify app doesn't crash

**Flow 4: Mobile Experience**
- [ ] Test on mobile viewport
- [ ] Verify layout responsive
- [ ] Verify inputs work on touch
- [ ] Verify autocomplete works on mobile

---

## Performance Benchmarks

### Load Time (Target: No degradation)
- [ ] Initial page load: ___ms (before) → ___ms (after)
- [ ] Game initialization: ___ms (before) → ___ms (after)
- [ ] Phase transition: ___ms (before) → ___ms (after)

### Bundle Size (Target: Similar or smaller)
- [ ] Main bundle: ___KB (before) → ___KB (after)
- [ ] Game components: ___KB (before) → ___KB (after)

---

## Rollback Plan

If critical issues are found:
1. Identify which phase introduced the issue
2. Revert specific commits from that phase
3. Document what broke and why
4. Fix in separate branch
5. Re-test before re-deploying

### Critical Files for Rollback
- `src/app/play/page.tsx`
- `src/components/GameContainer.tsx`
- `src/components/game/phases/*Phase.tsx`
- `src/store/index.ts`

---

## Sign-Off

- [ ] Developer: All changes implemented and unit tested
- [ ] QA: All checklist items verified
- [ ] Product: User flows validated
- [ ] Ready for production deployment

---

## Notes

_Add any observations, issues, or special notes here during testing_

