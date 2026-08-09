# M21 — Meal Build durable state (end-to-end)

**Status:** ACTIVE after M20 ships (or in parallel if M20 already on origin).  
**Who commits/pushes:** **AI Studio only** (not Grok/Claude/Cursor).  
**Repo:** https://github.com/cwahli/Health-tracker-6  
**Architecture (must follow):** `plan/MEAL_BUILD_DURABLE_STATE.md`  
**Domain:** `docs/agent/domains/food-calc.md`  
**Goal:** Progressive durable Meal template (Mode A / D / Edit, no field gaps), savable-on-calc, audit ledger, dual-path persistence, reduced whole-meal failures.  
**Plan revision:** OCC/CAS, masks, stageKey, StageLimits, migrate, history/cold debug, **deletedItemIds, staleDietitianNarrative, 409 rebase, R2 debug TTL, chaos matrix §12** (`plan/MEAL_BUILD_DURABLE_STATE.md`).

---

## A. User prompt (copy-paste to AI Studio)

```text
Follow studio/M21_MEAL_BUILD_DURABLE_STATE.md end-to-end.
Architecture truth: plan/MEAL_BUILD_DURABLE_STATE.md (field inventory + §3.1 OCC + §3A masks + §3.2 stageKey + §3B limits + §10 history/debug are binding).

You are AI Studio. Only you may git commit and push after gates exit 0.

Work phases in order 0 → 6. Do not skip Mode D or Edit.
Do not rewrite nutrient math in server_budget_reconcile / aggregation.
Do not invent a second food-calc pipeline.
Do not store base64 images on the meal hot path.
Preserve food-calc invariants: rawNutritionLabel, estimatedCalories, components, locks, diningEnvironment from scout only.
Implement: meal.version OCC, stageKey idempotent consolidate, StageLimits circuit, migrateMealSchema, historyLog append on user/stage/error, cold debug package fields for errors + lastUserAction (+ optional console/network ring on client), deletedItemIds tombstones (no zombie items), staleDietitianNarrative on weight/structure change, JobStore 409 rebase max 3, respect plan chaos matrix §12.

After each phase, run that phase’s gate. After all phases, run the master gate §F.
Then commit only listed paths, push, update AI_HANDOVER.md M21 → DONE.

COMPLETE only if master gate exit 0 + push succeeded.
Forbidden until then: "all done", "fully verified".
```

---

## B. Anti-miss / honesty

1. Import without call site on **both** client path (`FoodAgentExecutor` / JobQueueRunner) **and** serverJobs path = FAIL.  
2. Mode A PASS ≠ Mode D ≠ Edit — matrix in STATUS must have three columns.  
3. Round-trip `pendingFoodLog` ↔ `MealBuild` must not drop inventory fields (assert).  
4. Detect without repair (incomplete assembly) = FAIL if you touch that path.  
5. Do not weaken existing assert scripts.  
6. Do not commit junk `* 2.ts` / `* 2.md` duplicates.  
7. Glossary: **Component** ≠ **FoodItem** ≠ **Meal** ≠ **ComparisonSet** (Mode D).  
8. Dietitian failure must **not** clear calculated nutrients.

---

## C. Already DONE — do not rebuild

| Area | Note |
|------|------|
| Food-calc math helpers | `server_budget_reconcile`, aggregation, vision merge, portion clarify, refine scale |
| JobStore / Runner / ImageStore | M1–M5 foundation |
| B1 portion clarify / B5f skip-dietitian | Reuse; generalize skip patterns |
| B9/B14 strip images + debug markdown | Extend to prefer ledger; do not remove strip |
| M20 governance docs | Separate pack |

---

## D. Acceptance IDs (≤6 outcomes; phases implement them)

| ID | Acceptance |
|----|------------|
| **MB1** | `src/mealBuild/*` types + inventory list covers Mode A/D/Edit fields from plan §2; glossary Component/FoodItem/Meal/ComparisonSet |
| **MB2** | `consolidateMeal` + `toPendingFoodLog` / `fromPendingFoodLog` round-trip preserves critical fields (test + assert) |
| **MB3** | Dietitian permanent fail after calc → job still exposes savable `pendingFoodLog` + `degradedStages` includes `dietitian`; dual path |
| **MB4** | `stageLedger` + **historyLog** append (user_action, stage_*, error); debug report order: meal → ledger → history → logs appendix; cold package has errors + lastUserAction |
| **MB5** | Mode matrix: A new_log meal; D ComparisonSet of meals; Edit same meal id preserves dbId/locks/components; **OCC version** bumps on user_edit vs job |
| **MB6** | Resume + **stageKey** idempotent retry; StageLimits circuit; early `imageUrls`; `migrateMealSchema` on load; stage **input projectors** for dietitian (no candidate dump) |

---

## E. Phases (implement in order)

### Phase 0 — Module + field coverage (no behavior change required)

**Create files (full content — adapt imports to repo style):**

#### `src/mealBuild/nutrientKeys.ts`

```ts
/** Re-export single source of 31 keys — do not fork lists. */
export { NUTRIENT_KEYS, CORE_NUTRIENT_KEYS } from '../utils/nutrients';
```

#### `src/mealBuild/types.ts`

Define (match plan glossary):

- `NutrientMap` partial Record of NUTRIENT_KEYS  
- `MealComponent` — composition only  
- `MealFoodItem` — all item fields from plan §2.3 (include index signature only if needed; prefer explicit fields)  
- `MealContent` — name/benefits/risks/recommendation/verdict/message/…  
- `StageAuditRecord` — plan §2.8  
- `MealBuild` — id, **schemaVersion: 1**, **version**, **lastUpdatedBy**, **lastUserAction?**, **historyLog[]**, stageLimits?, mode: `new_log` | `edit` | `compare_option`, parentComparisonId?, items, nutrients, imageUrls, content, scoutSnapshot?, scoutContentType?, diningEnvironment?, cookingMethod?, scoutConfidence*, receiptTable?, dangerBadges?, biomarkerStatus?, savable, lastCompletedStage, degradedStages, stageLedger (with **stageKey**, attempt), coldDebugUrl?, photoUrl?, portionClarify?, needsPortionClarify?, date, weightGrams, quantity, basis_type?, serving_grams?, updatedAt  
- `ComparisonSet` — id, schemaVersion, version, mode: `compare`, optionMeals: MealBuild[], content?, isMenuScale?, stageLedger, historyLog?, selectedOptionMealId?, imageUrls?, updatedAt  
- Helpers: `migrateMealSchema`, `makeStageKey(mealId, stage, attempt)`, `appendHistory`, `projectDietitianInput` (and other projectors as pure functions)  

**Required explicit item fields (no silent drops):**  
`itemId`, `scoutIndex`, `name`, `canonicalDbName`, `originalName`, `originalLocalName`, `keyword`, `weightGrams`, `estimatedWeightGrams`, `estimatedCalories`, `nutrients`, `nutrientStatus`, `compositionStatus`, `dbSource`, `dbId`, `cookingMethod`, `visualIngredients`, `components`, `componentsDetailList`, `hasComponents`, `primaryBase100g`, `primaryBaseMatchName`, `primaryBaseWeightG`, `labelNutrientsPerServing`, `rawNutritionLabel`, `lockedNutrientKeys`, `itemLockedKeys`, `truthNutrients`, `cookingAdded`, `ingredientsList`, `chainName`, `foodType`, `warnings`, `confidenceRating`, `confidenceComment`, `physicalFormClassification`, `matchReasonInfo`, `diningEnvironment`, `saucesDetailList`, `portionChoiceApplied`, `fill`

#### `src/mealBuild/fieldInventory.ts`

Export:

```ts
export const MEAL_ENVELOPE_FIELDS: string[] = [ /* plan §2.2 keys */ ];
export const MEAL_ITEM_FIELDS: string[] = [ /* plan §2.3 keys */ ];
export const CRITICAL_PRESERVE_FIELDS: string[] = [
  'rawNutritionLabel', 'estimatedCalories', 'estimatedWeightGrams', 'components',
  'componentsDetailList', 'dbId', 'dbSource', 'lockedNutrientKeys', 'itemLockedKeys',
  'primaryBase100g', 'scoutIndex', 'itemId', 'diningEnvironment'
];
```

#### `src/mealBuild/consolidate.ts`

```ts
export function consolidateMeal(
  prev: MealBuild | null,
  patch: Partial<MealBuild>,
  stage: string,
  opts?: { stageKey?: string; expectedVersion?: number; actor?: string; attempt?: number }
): MealBuild
export function mergeFoodItem(prev: MealFoodItem | undefined, patch: Partial<MealFoodItem>): MealFoodItem
export function appendStageLedger(meal: MealBuild, record: StageAuditRecord): MealBuild
export function appendHistory(meal: MealBuild, entry: Omit<HistoryLogEntry, 'seq'|'id'> & { id?: string }): MealBuild
export function migrateMealSchema(json: unknown): MealBuild
export function makeStageKey(mealId: string, stage: string, attempt: number): string
```

Rules (binding):

- Merge items by `itemId` → else `scoutIndex` → else name+weight key  
- Never overwrite non-empty CRITICAL_PRESERVE_FIELDS with null/undefined/empty array from patch  
- `diningEnvironment`: if prev set from scout, patch from dietitian must not replace  
- Ledger: same **stageKey** replaces that attempt’s record; do not duplicate items from replay  
- OCC: if `expectedVersion` provided and ≠ `prev.version`, rebase with user-owned keys winning (plan §3.1); always bump `version` on successful apply  
- historyLog: append on stage/user/error; cap with pin last error + last user_action (plan §10.2)  
- **deletedItemIds**: union tombstones; drop matching items; stages cannot re-add (plan §3.4)  
- Structural/weight change without dietitian → **staleDietitianNarrative=true** (plan §3.5)  

#### `src/mealBuild/adapters.ts`

```ts
export function fromPendingFoodLog(log: any, meta?: Partial<MealBuild>): MealBuild
export function toPendingFoodLog(meal: MealBuild): any
export function fromEvaluationComparison(comparison: any, scoutItems: any[], meta?: any): ComparisonSet
export function toEvaluationPayload(set: ComparisonSet): { mode: 'evaluation'; comparison: any, scoutItems?: any[], message?: string }
export function fromActiveMeal(activeMeal: any): MealBuild
```

**Round-trip law:** `toPendingFoodLog(fromPendingFoodLog(x))` keeps CRITICAL_PRESERVE_FIELDS and all 31 nutrient keys present on nutrients object when they were on input.

#### `src/mealBuild/index.ts` — re-exports

#### Tests

- `src/mealBuild/__tests__/consolidate.test.ts`  
  - preserve locks/label/components when patch omits them  
  - partial item (label 700 kcal only) stays partial, no invented components  
  - ledger append-only  
  - delete item + stage patch re-sends it → stays deleted (zombie)  
  - weight +50% → staleDietitianNarrative true  
- `src/mealBuild/__tests__/adapters.roundtrip.test.ts`  
  - fixture with full item (dbId, primaryBase100g, componentsDetailList, rawNutritionLabel, estimatedCalories, scoutIndex) survives round-trip  
  - Mode D: two option meals independent  

#### Gate Phase 0

```bash
npx vitest run src/mealBuild/__tests__/
```

---

### Phase 1 — Savable-on-calculation + dietitian degrade (MB3)

**FIND in `server.ts` dietitian failure path** (where permanent dietitian throw happens after retries):

- If `parsedData` / preCalc / aggregated `pendingFoodLog`-equivalent **already has nutrients.calories or itemsBreakdown**, do **not** fail the whole request as empty.  
- Build/update `MealBuild` via consolidate; set `savable: true`, `lastCompletedStage: 'calculation'`, `degradedStages: ['dietitian']`, append ledger error with `recovery: 'retry_advice'`.  
- Return JSON shaped like success for food log purposes: `pendingFoodLog` / `data` from `toPendingFoodLog(meal)`, plus `mealBuild`, `degradedStages`, message like nutrients logged / AI advice unavailable.  
- Keep existing skip-dietitian refine path (B5f).

**serverJobs.ts:** if stream ends with pendingFoodLog even when dietitian degraded, `persistSucceeded` (or succeed with warnings payload) — do **not** mark `failed` when pendingFoodLog present.

**TaskPlaceholderCard.tsx:**

- Show Save when `pendingFoodLog` exists **and** (status succeeded **or** result.savable **or** mealBuild.savable).  
- If `degradedStages` includes dietitian: amber “AI advice pending” + Retry that only re-requests advice (do not clear checkpoint/meal).  
- Full Retry only when no savable meal.

**Tests:** unit test for degrade path if pure helper extracted; extend FoodAgentExecutor test if needed.

#### Gate Phase 1

```bash
npx vitest run src/mealBuild/__tests__/ src/jobs/__tests__/FoodAgentExecutor.test.ts
# plus any new degrade test file
```

---

### Phase 2 — Persist meal both paths + resume (MB6 partial)

**Job types** `src/jobs/types.ts`:

- Extend `AgentJob` with optional `mealBuild?: MealBuild` (import type).  
- Keep `checkpoint` for backward compat; when scout lands, also consolidate into mealBuild.items.

**JobQueueRunner / FoodAgentExecutor:**

- On checkpoint/done: `JobStore.updateJob` with `mealBuild` from server payload.  
- On retry/resume: send `activeScoutItems` / `skipScout` from mealBuild when scout filled; send flag or body `resumeStage: 'dietitian'` when calc filled and only advice missing.  
- Wire `skipScout: true` when meal has scouted items (existing pattern).

**serverJobs clean_result:** include `mealBuild`, `degradedStages`, `stageLedger` summary; cap `backendLogs` (e.g. last 16k) and rely on debugUrl for full cold.

**SupabaseJobSync:** pass through mealBuild fields if present (no schema migration required if inside clean_result JSON).

#### Gate Phase 2

```bash
npx vitest run src/mealBuild/__tests__/ src/jobs/__tests__/
```

---

### Phase 3 — Early media (MB6)

- When photo uploads to R2 (client or serverJobs), write `mealBuild.imageUrls` / `photoUrl` **before** waiting on dietitian.  
- `toPendingFoodLog` copies imageUrls.  
- stripHeavyImages still applies; never put `data:image` into mealBuild.

#### Gate Phase 3

```bash
npx vitest run src/utils/debugPayload.test.ts src/mealBuild/__tests__/
```

---

### Phase 4 — Orchestrator harness (thin) (MB4)

**New** `server_meal_orchestrator.ts` (or `server_meal_build_runtime.ts`):

- `appendStage` / `markDietitianDegraded` / `buildSavableMealFromParsed` helpers used by server.ts (FIND→REPLACE call sites — no math rewrite).  
- Emit structured ledger decisions for calculation close and dietitian degrade.

**debugPayload.ts:** `buildDebugMarkdownReport` accepts optional `stageLedger` + meal summary section **before** backend logs; backend logs remain appendix capped.

#### Gate Phase 4

```bash
npx vitest run src/mealBuild/__tests__/ src/utils/debugPayload.test.ts
npx vitest run server_budget_reconcile.test.ts server_vision_scout.test.ts server_nutrient_aggregation.test.ts server_portion_clarify.test.ts
```

---

### Phase 5 — Mode D ComparisonSet (MB5 D)

- `fromEvaluationComparison` / `toEvaluationPayload` used when mode evaluation returns.  
- Each comparison group → option Meal with its items + server preCalc nutrients (existing `applyServerAverageNutrients` / preCalcByScoutIndex — **do not reimplement math**).  
- UI may keep reading `comparison` via adapter; store `comparisonSet` on job result when easy.  
- Log tags `[Budget] mode=D` must remain.

#### Gate Phase 5

```bash
npx vitest run src/mealBuild/__tests__/
# ensure Mode D fixture in adapters.roundtrip.test.ts PASS
```

---

### Phase 6 — Edit path (MB5 Edit)

- `fromActiveMeal` seeds mealBuild on edit jobs.  
- Edit merge path in server.ts that backfills dbId/primaryBase/componentsDetailList: route through `mergeFoodItem` / `consolidateMeal` so CRITICAL_PRESERVE_FIELDS cannot wipe.  
- Same meal id / job id (D4).  
- Weight-only skip dietitian unchanged (D8).

#### Gate Phase 6

```bash
npx vitest run src/mealBuild/__tests__/ src/jobs/__tests__/ModeDAndEdit.test.ts
npx vitest run server_budget_reconcile.test.ts server_vision_scout.test.ts server_nutrient_aggregation.test.ts server_portion_clarify.test.ts
```

---

## F. Machine gate (master — exit 0 required for COMPLETE)

**Create** `scripts/assert-meal-build-m21.mjs` that checks:

1. Files exist: `src/mealBuild/types.ts`, `consolidate.ts`, `adapters.ts`, `fieldInventory.ts`, `plan/MEAL_BUILD_DURABLE_STATE.md`  
2. Source strings: `CRITICAL_PRESERVE_FIELDS`, `consolidateMeal`, `toPendingFoodLog`, `ComparisonSet` or `compare_option`, `degradedStages`, `stageLedger`, `savable`, `stageKey` or `makeStageKey`, `historyLog` or `appendHistory`, `migrateMealSchema`, `expectedVersion` or `lastUpdatedBy`  
3. `server.ts` or orchestrator contains dietitian degrade / savable path (e.g. `retry_advice` or `degradedStages` + `savable`)  
4. `TaskPlaceholderCard` shows save path considering savable/degraded (grep `degradedStages` or `savable` or `Retry Advice`)  
5. Does **not** require Temporal/LangGraph  
6. `fieldInventory` lists at least: `rawNutritionLabel`, `estimatedCalories`, `componentsDetailList`, `scoutIndex`, `primaryBase100g`, `diningEnvironment`  
7. `debugPayload` or report builder references stageLedger or historyLog (plan §10.4)

```bash
node scripts/assert-meal-build-m21.mjs
npx vitest run src/mealBuild/__tests__/
npx vitest run server_budget_reconcile.test.ts server_vision_scout.test.ts server_nutrient_aggregation.test.ts server_portion_clarify.test.ts
npx vitest run src/jobs/__tests__/FoodAgentExecutor.test.ts src/jobs/__tests__/ModeDAndEdit.test.ts
npx tsc --noEmit
```

All must exit 0.

---

## G. STATUS table (fill before COMPLETE)

| ID | Mode A | Mode D | Edit | Dual path (client+serverJobs) | Evidence | PASS/FAIL |
|----|:------:|:------:|:----:|:-----------------------------:|----------|-----------|
| MB1 | | | | n/a | | |
| MB2 | | | | n/a | | |
| MB3 | | | | | | |
| MB4 | | | | | | |
| MB5 | | | | | | |
| MB6 | | | | | | |

COMPLETE only if every cell PASS or explicit N/A with reason.

---

## H. Commit (AI Studio only)

```bash
git add \
  plan/MEAL_BUILD_DURABLE_STATE.md \
  plan/README.md \
  src/mealBuild \
  scripts/assert-meal-build-m21.mjs \
  server.ts \
  serverJobs.ts \
  server_meal_orchestrator.ts \
  src/jobs/types.ts \
  src/jobs/JobQueueRunner.ts \
  src/jobs/FoodAgentExecutor.ts \
  src/jobs/SupabaseJobSync.ts \
  src/components/TaskPlaceholderCard.tsx \
  src/utils/debugPayload.ts \
  src/utils/debugPayload.test.ts \
  AI_HANDOVER.md \
  studio/ACTIVE_STATUS.md \
  studio/00_README.md \
  studio/M21_MEAL_BUILD_DURABLE_STATE.md

# Only add files you actually changed; omit missing paths.

git commit -m "$(cat <<'EOF'
feat(meal-build): durable progressive Meal template (M21)

Introduce MealBuild/ComparisonSet with full Mode A/D/Edit field inventory,
consolidate merge without provenance wipes, savable-on-calculation with
dietitian degrade, stage ledger for audit, and dual-path job persistence.

EOF
)"

git push origin HEAD
```

Update `AI_HANDOVER.md`: M21 DONE; archive pack to `archive/studio/completed-2026-08/` after push.

---

## I. Out of scope

- Temporal / LangGraph  
- Rewriting budget/reconcile math  
- Biomarker durable build (later same pattern)  
- Cloudflare greenfield beyond existing R2 photo path  
- Weakening food-calc gates  
- i18n  

---

## J. Order if quota / time limited

If you must ship partial:

1. **Must ship:** Phase 0 + 1 + assert script (MB1–MB3) — biggest user-facing win  
2. Then Phase 2 + 6 (resume + edit preserve)  
3. Then Phase 3–5  

Do **not** claim M21 COMPLETE until master gate §F is green for all MB1–MB6 **or** board explicitly records known-broken MB ids.

---

## K. Upload checklist (human)

1. Prefer ship **M20** first if origin still lacks governance.  
2. Upload to AI Studio:  
   - `studio/M21_MEAL_BUILD_DURABLE_STATE.md`  
   - `plan/MEAL_BUILD_DURABLE_STATE.md`  
   - `docs/agent/domains/food-calc.md` (reference)  
   - Current `server.ts` / `serverJobs.ts` / `src/jobs/*` / `TaskPlaceholderCard.tsx` as needed  
3. Paste §A user prompt.  
4. After COMPLETE: archive pack; update board.
