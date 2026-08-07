# Health Cockpit — Master AI Handover

**Last updated:** 2026-08-06  
**Source of truth code:** https://github.com/cwahli/Health-tracker-3 (`origin/main`)  
**Always `git fetch` + read latest commits before a session.**

This file is the **single progress map** for humans, AI Studio, Grok, and Cursor.  
**Studio milestone packs (one file per step):** folder **`studio/`**.  
**How agents author packs / archive completed ones:** **`AGENTS.md` §0**.

---

## 1. How to work (everyone)

| Rule | Detail |
|------|--------|
| One focus | One initiative / one Studio milestone at a time |
| Review GitHub first | Audit origin → instruct **gaps only** (do not rebuild DONE work) |
| Do not undo | Prior patches are intentional unless a gate proves breakage |
| Free tier | Minimize Firestore reads/writes; never remove image recompression on load |
| Models | Default app runtime: `gemini-3.5-flash-lite`. No `gemini-2.5-flash` |
| COMPLETE | Only after the **named gate** exits 0 + STATUS table |
| Studio files | Upload **one** file from `studio/` per session (self-contained) |
| After COMPLETE | Move finished pack `studio/` → `archive/`; update this board |

**Pre-commit (when implementing):** relevant `npx vitest run` + `npm run lint` / `tsc` as available.

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

**Key UI:** `App.tsx` · `LogChat.tsx` · `FoodHistoryTab` · admin `UserManagementTab`  
**Key server:** `server.ts`, vision scout, nutrient/food helpers, food catalog modules.

---

## 3. Initiative status (all tracks)

| # | Initiative | Status | Notes |
|---|------------|--------|-------|
| **A** | **Unified modal + async multi-job** | 🟡 **IN PROGRESS** | **#1 priority.** M1–M2 on GitHub; M3+ not done |
| B | Multi-language (i18n) framework | ⏸️ **PAUSED** ~75% | Resume only if user explicitly asks |
| C | Admin panel (real Firebase users) | 🟢 **Done** | List / delete auth·data / resets / UI |
| D | Food Mode D menu screening | 🟢 **Done** | Large menu compare UX |
| E | Health coach / planning UI polish | 🟢 **Done** | |
| F | Theme engine | 🟢 **Done** | |
| G | Storage / sync / tombstones / image recompress | 🟢 **Done** | Do not remove recompress-on-load |
| H | Food calc hybrid / budget-reconcile / catalog | 🟡 **Partial** | Much on main; not current Studio focus unless user says so |
| I | Cloudflare image hosting | ⚪ **Not started** | Separate future plan; not modal async v1 |
| J | Server job durability (true background) | ⚪ Later | After client async if tab-loss still hurts |

---

## 4. Unified modal — detailed progress (priority A)

### Plan / packs

| Doc | Role |
|-----|------|
| `plan/UNIFIED_MODAL_ASYNC_JOB_PLAN.md` | Full architecture — use to author **remaining** Studio packs |
| **`studio/`** | **What you send to AI Studio** — one `M*.md` per session |
| `AGENTS.md` | Pack authoring + archive-on-complete workflow (§0) |
| `archive/` | Completed/legacy packs — do **not** re-upload for new work |

### Milestone board (verified against `origin/main` ~952b617)

| ID | Name | Status | Evidence on GitHub |
|----|------|--------|--------------------|
| **M1** | Phase 0 — `src/jobs/` JobStore, ImageStore, Runner, credits, tests, hooks | 🟢 **DONE** | `e04fecd`+ |
| **M2** | Phase 1 — nav `+`, FloatingActionSheet, `activeJobId`, pills removed, draft cleanup | 🟢 **DONE** (older pack) | `952b617` |
| **M2.5** | Phase 1 harden (optional) — hard mode lock, medical tab, dead code | 🟡 Optional | `studio/M2_5_PHASE1_HARDEN.md` |
| **M3** | Extract `FoodAgentExecutor` from `handleSend` | 🔴 **NEXT** | `studio/M3_EXTRACT_EXECUTOR.md` |
| **M4** | Food Mode A async E2E | 🔴 Pending | `studio/M4_ASYNC_MODE_A.md` |
| **M5** | Mode D + Edit async (full matrix) | 🔴 Pending | `studio/M5_MODE_D_AND_EDIT.md` |

### Already on GitHub (do not rebuild in Studio)

- `src/jobs/*`, `src/hooks/useJob.ts`, `useJobs.ts`
- `FloatingActionSheet.tsx`, center `+` in `BottomNav.tsx`
- `App.tsx`: `activeJobId`, createJob Log Meal (A) / Compare (D), Health Info → front_desk
- LogChat `jobId`, draft delete on close, food mode pills removed
- `scripts/assert-unified-modal-nav.mjs`

### Known gaps after older Phase 1

| Gap | Action |
|-----|--------|
| Dead compare-keyword leftovers; overrideMode can flip family | Optional M2.5 |
| Messages still local React state | Expected until M3/M4 |
| Analyze still blocking in modal | M4 |
| Credits “reserve” deducts immediately | Fix when wiring M4 |
| Medical tab missing from BottomNav | Optional M2.5 |
| No FoodAgentExecutor | **M3** |
| No placeholder / queue badge / async close | **M4** |

### Frozen decisions (D1–D7)

| ID | Decision |
|----|----------|
| D1 | maxQueued = 5, concurrency = 1 |
| D2 | v1 does not claim browser-kill survival |
| D3 | Explicit Save for food |
| D4 | Edit = same jobId |
| D5 | Health Info sync for now |
| D6 | Placeholders on food history |
| D7 | Immediate auto-retries ×2 only until server `requestId` |

### How to run Studio

1. Open **`studio/`**.  
2. Upload **only** the next file (default: **`M3_EXTRACT_EXECUTOR.md`**).  
3. Paste the User prompt at the top of that file.  
4. Gate must exit 0 → move pack to **`archive/`** → update this board → next file.

**Do not** upload the whole plan + many packs at once.

---

## 5. Multi-language (i18n) — paused

**Status:** PAUSED (~75%).  
Do not work on UI string pass-throughs, agent prompt translations, or CSV i18n **until the user explicitly asks**.

---

## 6. Admin panel — done

Admin Firebase user management (list, delete auth/data, resets, UI) is **complete**.  
Historical roadmap notes may live under `plan/ADMIN_FIREBASE_USERS_ROADMAP.md` if present; they are **not** the master handover.

---

## 7. Historical / do-not-undo (summary)

Includes (non-exhaustive): unified multi-agent LogChat, theme engine, vitest harness, vision scout schema work, label/truth-source architecture, Atwater checks, admin user management, image recompress-on-load, tombstone sync, food catalog / budget-reconcile partials.

**Gotchas still valid:**

- Schema field order matters for truncation.  
- Never `Number(x) || fallback` for LLM numbers.  
- Nested JSON schema needs nested `required`.  
- Large images: API only; persistence recompressed.

---

## 8. Not current priority

- Cloudflare image storage (separate plan later)  
- Full server-side job workers  
- Re-running `archive/` food-calc or old multi-file packs  
- i18n (paused)  
- Parallel multi-agent runners  

---

## 9. Next action (right now)

| Who | Do this |
|-----|---------|
| **You** | Share **`studio/`**; start with **`studio/M3_EXTRACT_EXECUTOR.md`** (or M2.5 first if wanted) |
| **AI Studio** | One pack file only; gap-only; gate exit 0 |
| **Agent (Grok etc.)** | Audit GitHub → update packs/gaps from `plan/UNIFIED_MODAL_ASYNC_JOB_PLAN.md` → archive when complete (`AGENTS.md` §0) |

---

## 10. Doc layout

```text
AI_HANDOVER.md              ← THIS FILE (progress + all initiatives)
AGENTS.md                   ← how to author packs; archive-on-complete
studio/                     ← ONLY active packs for AI Studio (one at a time)
  00_README.md
  M2_5_PHASE1_HARDEN.md
  M3_EXTRACT_EXECUTOR.md    ← default NEXT
  M4_ASYNC_MODE_A.md
  M5_MODE_D_AND_EDIT.md
plan/
  UNIFIED_MODAL_ASYNC_JOB_PLAN.md   ← architecture for remaining work
archive/
  aistudio-instructions/    ← old multi-file packs
  aistudio-food-calc/       ← old food-calc packs
```

---

## 11. Changelog

| Date | Note |
|------|------|
| 2026-08-06 | Replaced July 2026 / admin-only handover with master status: modal M1–M2 done, M3 next; studio/ + archive workflow; i18n paused |

---

*If this file ever shrinks back to “Admin Panel roadmap only”, restore this master content — admin is §6, not the whole document.*
