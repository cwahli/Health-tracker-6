# Health Cockpit — Master AI Handover (WIP status board)

**Last updated:** 2026-08-09 (portion clarify workflow + JobQueueRunner awaiting_user status fix; 30 test files / 243 unit tests PASS)  
**Source of truth code intent:** https://github.com/cwahli/Health-tracker-6  
**Tree of truth for product completeness:** **Desktop** working tree until Slice 0 / governance ship lands on origin.  
**Always `git fetch` + re-audit before a session.**

## Document roles (read this)

| Doc | What it is | Update freely? |
|-----|------------|----------------|
| **This file (`AI_HANDOVER.md`)** | **WIP / status / multi-agent handoff** — where we are, what’s next, session notes | **Yes** |
| **`plan/*`** | **Architecture & planned design** (modal, food-calc hybrid, R2, bugs…) | When design changes |
| **`AGENTS.md` + `docs/agent/**`** | **How agents work** (laws, domain guides, gates) | **Protected** — confirmation + before→after (`AGENTS.md` §3) |
| **`studio/`** | Active AI Studio pack only | Pack authoring |
| **`archive/`** | Completed packs | After COMPLETE |

**Commits/pushes to GitHub:** **AI Studio only** — local Grok/Claude/Cursor prepare code and packs; they do not push (`AGENTS.md` §4).

**Consolidated DONE / TODO (snapshot):** `plan/STATUS_CONSOLIDATED_2026-08.md` — **stale as of 2026-08-08**; re-audit before trusting GitHub vs Desktop bullets.  
**Detail roadmap:** `plan/REMAINING_ROADMAP_2026-08.md` — same: use as map, verify against tree.  
**Active Studio pack for ship:** **`studio/M20_AGENT_GOVERNANCE_AND_REGRESSION.md`**.

---

## 0. Critical: GitHub vs Desktop (read first)

| Fact | Detail |
|------|--------|
| Local branch | `main` at `ab8ab74` |
| `origin/main` | `4412fb6` — local is **behind by 5 commits**, **0 ahead** (no Desktop commit yet) |
| Dirty tree | **~57** modified + untracked paths (all real product work sits here) |
| Origin quality risk | Origin added **stub** `server_portion_clarify.ts` / `server_refine_scale.ts` (~15 lines, no-ops). Desktop has **full** modules (~193 / ~335 lines) + gates green |
| Origin missing | `foodLogDedupe`, `dataSanitize`, `foodImageSources`, `debugPayload`, Data Sanitize UI, several assert scripts (b11/b14/m3-executor local names) |
| Origin has partial | FoodAgentExecutor, `awaiting_user` wiring, B5f `skip-dietitian` in `server.ts`, label-lock edits, thin assert scripts |

**Do not** assume “GitHub is the website.” The **runnable product with green gates** is Desktop working tree.  
**Slice 0 (required):** merge/rebase the 5 origin commits carefully (prefer Desktop modules over stubs), commit, push.

```bash
# Baseline on Desktop (all PASS as of 2026-08-08 audit)
node scripts/assert-unified-modal-m3-executor.mjs
node scripts/assert-label-truth-locks.mjs
node scripts/assert-backlog-b1-portion-clarify.mjs
node scripts/assert-backlog-b5-refine.mjs
node scripts/assert-backlog-b2-b7.mjs
node scripts/assert-backlog-b14-cold-b9b.mjs
node scripts/assert-backlog-b11-image-sync.mjs
node scripts/assert-async-durable-remaining.mjs
```

---

## 1. How to work (everyone)

| Rule | Detail |
|------|--------|
| One focus | One initiative / one Studio milestone at a time |
| Review GitHub first | Audit origin → instruct **gaps only** (do not rebuild DONE work) |
| Prefer Desktop for truth | Until Slice 0 push, Desktop working tree beats origin stubs |
| Do not undo | Prior patches are intentional unless a gate proves breakage |
| Free tier | Minimize Firestore reads/writes; never remove image recompression on load |
| Models | Default app runtime: `gemini-3.5-flash-lite`. No `gemini-2.5-flash` |
| COMPLETE | Only after the **named gate** exits 0 + STATUS table |
| Studio files | Upload **one** file from `studio/` per session |
| After COMPLETE | Move finished pack `studio/` → `archive/studio/completed-2026-08/`; update this board |

---

## 2. Architecture (short)

| Layer | Tech |
|-------|------|
| Frontend | React + TypeScript (`src/`) |
| Backend | Express (`server.ts` + helpers) |
| DB | Firebase Firestore (free tier) |
| Auth | Firebase Auth |
| AI | Gemini via `@google/genai` |
| Hosting | Google Cloud Run |
| Local heavy data | IndexedDB (`idb-keyval`) |

**Dual food paths:** (1) `POST /api/jobs/submit` → `serverJobs` poll; (2) client `JobQueueRunner` → `executeFoodAgent` SSE. Remaining work must name which path.

---

## 3. Initiative status (all tracks)

| # | Initiative | Status | Notes |
|---|------------|--------|-------|
| **A** | **Unified modal + async multi-job** | 🟡 **IN PROGRESS** | M1–M5 **DONE on Desktop** (gates); GitHub incomplete / stubby; push + soak next |
| B | Multi-language (i18n) | ⏸️ **PAUSED** ~75% | Resume only if user explicitly asks |
| C | Admin panel | 🟢 **Done** | |
| D | Food Mode D menu screening | 🟢 **Done** | |
| E | Health coach polish | 🟢 **Done** | |
| F | Theme engine | 🟢 **Done** | |
| G | Storage / sync / tombstones / recompress | 🟢 **Done** | Do not remove recompress-on-load |
| H | Food calc hybrid / label truth / backlog | 🟢 **Mostly done** | B5f/B3g/B1/B5/B7 green; **B8c applied** (Co-op per_100g) |
| **Sync / images** | B11 + B11d + B13 + sanitize | 🟢 **Code done** | Dedupe, sanitize, **proxy photos**, **lazy history**; multi-device soak still recommended |
| I | Cloudflare images greenfield | ⚪ Later | Not needed if B11d proxy works |
| J | True server background workers | ⚪ Later | After soak |
| **K** | **Bug tracking (food + biomarker)** | 🟢 **Done Desktop** | No Session Replay. Master: `plan/BUG_TRACKING_COMPREHENSIVE_PLAN.md` |

---

## 4. Unified modal + backlog board (Desktop truth)

### Plan / packs

| Doc | Role |
|-----|------|
| `plan/REMAINING_ROADMAP_2026-08.md` | **Master remaining map** (includes Slice K) |
| `plan/UNIFIED_MODAL_ASYNC_JOB_PLAN.md` | Architecture reference |
| `plan/FOOD_LOG_UX_CALC_BACKLOG.md` | Issue-level backlog |
| `plan/BUG_TRACKING_COMPREHENSIVE_PLAN.md` | **Master: food + biomarker bug tracking** (domain packs, durable triage, K1–K6) |
| `plan/BUG_SNAPSHOT_TRIAGE_PLAN.md` | Earlier snapshot/R2/triage detail + literature §13 |
| **`studio/`** | **Active:** `M20_AGENT_GOVERNANCE_AND_REGRESSION.md` (commit governance + regression via AI Studio) |
| `archive/studio/completed-2026-08/` | Completed Studio packs (M2.5–M14, hotfixes, multipass) |
| `AGENTS.md` + `docs/agent/` | Always-on laws + domain rulebooks (protected) |

### Milestone board (Desktop gates 2026-08-08)

| ID | Name | Desktop | GitHub `origin/main` |
|----|------|:-------:|:--------------------:|
| M1 | JobStore / Runner / credits | 🟢 | 🟢 partial |
| M2 | Nav `+` / FloatingActionSheet | 🟢 | 🟢 |
| M2.5 | Phase 1 harden | 🟢 | 🟢 |
| **M3** | `FoodAgentExecutor` extract | 🟢 gate | 🟡 present, incomplete vs Desktop |
| **M4** | Mode A async E2E + progress | 🟢 local | 🟡 |
| **M5** | Mode D + Edit async | 🟢 tests | 🟡 |
| B3 label truth | Locks / receipt / soft micros | 🟢 L1–L8 | 🟡 partial |
| B1 portion clarify | Pause + chips + skipScout | 🟢 full module | 🔴 **stub no-op on origin** |
| B5 / B5f refine | Scale-only + skip-dietitian | 🟢 | 🔴 **stub refine helpers**; B5f wired in server.ts |
| B2 / B7 / B14-hot | Jobs durability + resolver skip | 🟢 | 🟡 |
| B14 cold + B9b | R2 debug strip + report.md | 🟢 | ❌ missing helpers |
| B11 | Dedupe / images / Data Sanitize | 🟢 helpers+UI | ❌ missing modules |
| B2d reload | Keep `awaiting_user` + server running | 🟢 | 🟡 weak |
| **B11d** R2 public/signed photos | 🟢 proxy+signed | ⬜ push |
| **B13** lazy history | 🟢 page 15 + IO | ⬜ push |
| **B8c** Co-op data repair | 🟢 applied | 🟢 Supabase verified |

### Frozen decisions (D1–D10)

| ID | Decision |
|----|----------|
| D1 | maxQueued = 5, concurrency = 1 (FIFO) |
| D2 | Reload: preserve `awaiting_user` + server-owned `running` |
| D3 | Explicit Save for food |
| D4 | Edit = same jobId |
| D5 | Health Info sync for now |
| D6 | Placeholders on food history with honest progress |
| D7 | Auto-retries ×2; Page Visibility wake |
| D8 | Pure weight scale on label-locked meals skips Dietitian |
| D9 | Core macros label-locked; soft micros from USDA |
| D10 | User photo → badge; never inject Unsplash stock |

---

## 5. Multi-language (i18n) — paused

**Status:** PAUSED (~75%). Do not work until the user explicitly asks.

---

## 6. Admin panel — done

Complete. Not the master focus of this handover.

---

## 7. Next action (right now)

| Who | Do this |
|-----|---------|
| **AI Studio** | M20 shipped!
|-----|---------|
| **Human** | Upload **`studio/M20_AGENT_GOVERNANCE_AND_REGRESSION.md`** (+ docs/agent + AGENTS + listed tests/code) to **AI Studio** → Studio gate + **commit/push** |
| **Local agents (Grok/Claude/Cursor)** | Prepare code only; **do not** `git push`; put session notes here |
| **After M20 ships** | Reconcile origin vs Desktop (merge carefully; prefer full modules over stubs); multi-device soak |

**Do not** re-upload archived packs. **Do not** rebuild M/B/K already green unless gate FAIL.  
**Do not** edit `AGENTS.md` / `docs/agent/**` without confirmation + before→after.

### Session notes (multi-agent — append short bullets)
- 2026-08-09: Completed M21.1 Meal Build Completion (`studio/M21_1_MEAL_BUILD_COMPLETION_GATES.md`):
  - Hard gate `scripts/assert-meal-build-m21-1.mjs` passed (exit 0).
  - Wired `attachHappyPathMealBuild` on `new_log` success path in `server.ts`.
  - Wired `projectDietitianInput` call site in `server.ts` before dietitian LLM call.
  - Updated Mode D evaluation branch in `server.ts` to attach `comparisonSet` and log `[MealBuild] mode=D`.
  - Updated `TaskPlaceholderCard.tsx` to handle `comparison.groups` / `comparisonSet` and render `staleDietitianNarrative` warning badge.
  - Updated `JobQueueRunner.ts` done handler to store `mealBuild` on job completion.
  - Verified all tests: `m21_1_completion.test.ts` (6/6 PASS), full `mealBuild` suite (25/25 PASS), food-calc suite (42/42 PASS), `npx tsc --noEmit` (0 errors), and `compile_applet` (succeeded).
- 2026-08-09: Implemented Formalized Pure Projectors (`plan §3A`) and Bi-directional Agent Reflection Loop:
  - Created `src/mealBuild/projectors.ts` with standalone stage input masks (`projectScoutInput`, `projectResolverInput`, `projectCalculatorInput`, `projectDietitianInput`) preventing context bloat and raw payload dilution.
  - Created `src/mealBuild/reflection.ts` providing `evaluateResolverConfidence` and `buildVisionCropReQuery` to trigger targeted crop re-queries for low-confidence (<60%) candidate matches before category fallback.
  - Created unit tests `src/mealBuild/__tests__/projectors.test.ts` and `src/mealBuild/__tests__/reflection.test.ts`.
- 2026-08-09: Implemented Initiative J (True Server Background Workers & Crash Recovery):
  - Added `recoverInterruptedServerJobs()` in `serverJobs.ts` to scan and resume interrupted in-memory and Supabase running jobs following server restart/crashes.
  - Integrated worker recovery invocation into `server.ts` boot sequence.
  - Added unit test suite `src/jobs/__tests__/ServerJobRecovery.test.ts` validating crash detection and job resumption.
- 2026-08-09: Completed Phase 3, 5, 6 Roadmap items from `plan/MEAL_BUILD_DURABLE_STATE.md`:
  - Integrated `migrateMealSchema` into `storageUtils.ts` for clean client-side local storage pull schema migration.
  - Enhanced `FoodEvaluationComparisonCard.tsx` and `TaskPlaceholderCard.tsx` to project Mode D `ComparisonSet` option meals with side-by-side macro grids and recommendations.
  - Implemented `rebaseUserEdit` and `rebaseJobMealEdit` OCC 409 rebase logic with tombstone preservation and `staleDietitianNarrative` flags in `consolidate.ts` and `JobStore.ts`.
- 2026-08-09: Completed Phases 2–6 of Meal Build durable state (`plan/MEAL_BUILD_DURABLE_STATE.md`). Implemented Supabase sync for `mealBuild` / `stageLedger` / `historyLog`, early R2 photo URL synchronization on client submit, Mode D multi-meal ComparisonSet summary rendering in TaskPlaceholderCard, and client-side OCC 409 rebase loop with `rebaseUserEdit` and `rebaseJobMealEdit` in JobStore. All 250 unit tests across 32 test files passing cleanly, linter zero errors, applet compiled successfully.
- 2026-08-09: AI Studio verified and shipped M21 (Meal Build Durable State). All M21 gates passed.
- 2026-08-09: AI Studio verified and shipped M20. All gates passed.

- 2026-08-09: Agent governance + domain rulebooks + sync/biomarker/food regression tests prepared on Desktop. Ship path = M20 via AI Studio.
- 2026-08-09: Verified `node scripts/assert-agent-governance.mjs` (exit 0), all 87 vitest regression tests (passed), `tsc --noEmit` (clean), and `compile_applet` (succeeded).
- 2026-08-09: Bug Tracker & Snapshot overhaul completed:
  1. Mobile screenshot viewport positioning with scroll translation (`window.scrollX`/`window.scrollY`).
  2. Immediate modal opening flow on snapshot FAB click (open -> brief hide -> capture -> reopen).
  3. Multi-image selection support for bug snapshot attachments.
  4. Automatic page/category preselection based on active tab.
  5. Interactive bug tag problem viewer showing previously identified problems and open items.
  6. Cleaned up Capture Pack UI text.
  7. Interactive data-sharing checkboxes (a11y tree, overview & logs, session data, photos, nutrient calculation, debug JSON) controlling exported payload.
  8. Prominent console and network error buffer capture in snapshot payloads.
  9. Fixed "View Status" button in Bug Tracker modal to reliably trigger status view.
  10. Refined error detection in Log History so non-fatal log lines containing "error" don't display as "Failed processing".
  11. Fixed Zip Export to generate complete archives containing `bug_summary.md`, `overview.md`, `accessibility_tree.txt`, calculation JSON, and all screenshots with R2/payload fallbacks.
- Plan snapshots (`STATUS_CONSOLIDATED`, REMAINING_ROADMAP) dated 2026-08-08 — verify before acting.

---

## 8. Doc layout

```text
AI_HANDOVER.md                 ← THIS FILE = WIP status + handoff (update freely)
AGENTS.md                      ← always-on laws (protected)
docs/agent/                    ← rulebooks + packs guide (protected)
plan/                          ← architecture / planned design
studio/                        ← ACTIVE: M20_AGENT_GOVERNANCE_AND_REGRESSION.md
  00_README.md
  ACTIVE_STATUS.md
archive/
  studio/completed-2026-08/
```

---

## 9. Changelog

| Date | Note |
|------|------|
| 2026-08-08 | Full audit: Desktop gates all green; origin behind/ahead mess (5 commits stubs); archive consolidated; M15 sole active pack |
| 2026-08-06 | Master handover: modal M1–M2 done, M3 next (superseded by later Desktop work) |

---

*If this file ever shrinks back to “Admin Panel only”, restore this master content.*
