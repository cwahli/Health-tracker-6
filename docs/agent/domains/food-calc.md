# Domain rulebook: Food-calc

**Load when:** calories, scout, budget, reconcile, receipt, portion, catalog/resolver, Mode A/D/Edit food analyze.  
**Do not load** for pure biomarker UI or unrelated CSS.

**Plans (architecture):** `plan/FOOD_CALC_HYBRID_AND_INTERNAL_DB_PLAN.md`  
**WIP status:** `AI_HANDOVER.md`  
**Gates:** `docs/agent/DOMAIN_REGRESSION_MAP.md` → Food-calc section.

**How to use this book:** Default path that stops regressions. **Not a freeze** on product change.  
If you intentionally change pipeline/modes/fields: get confirmation for protected-doc edit (`AGENTS.md` §3), show before→after, update this file + tests in the same task. Do not invent a silent side pipeline for one bug.

---

## 1. Pipeline (current default — change only deliberately)

```text
Budget (label → dish/brand → scout → category×W)
  → foundation sum
  → reconcile
  → receipt
```

| Role | Rule |
|------|------|
| Scout calories | **One** soft `estimatedCalories` **per dish item** — not per component, not full free macros |
| `rawNutritionLabel` | **Printed label only** — never free estimates |
| Dietitian | Coaches on **server preCalc only** — no free macro invent |
| Food Resolver | Gap-only librarian (FDC / dish core) — not primary calorie estimator |
| Modes | Same finalize/budget math for **A, Edit, D** |

---

## 2. Mode matrix (default — all modes share finalize math)

| Behavior | Mode A (`new_log`) | Mode D (evaluation) | Edit / modify |
|----------|--------------------|---------------------|---------------|
| Budget / finalize | call + log | call + log `mode=D` | call + log `mode=edit` |
| Reconcile / portion | same | same | same |

- Mode A PASS ≠ Mode D/Edit PASS.  
- Prefer **one shared helper** + call sites in each mode over copy-paste math.  
- Unique log substrings for gates (e.g. `[Budget] mode=D`).

---

## 3. Second-order invariants (always if relevant)

| Topic | Must |
|-------|------|
| Merge | Preserve `rawNutritionLabel`, `estimatedCalories`, `estimatedWeightGrams`, `components` |
| Reconcile | Soft result not wiped; re-apply **only** `itemLockedKeys` |
| Scale | Item total scale ⇒ **component rows** scale |
| Invariant | Detect **and REPAIR** (not log-only FAIL) |
| Match priority | Real USDA/OFF/catalog **beats** `category_fallback` |
| Fail-open | Agent error → top form-safe candidate, not mass category dump |
| Import | Call site on **each** required branch |

**Classic regressions to refuse:**

- Spreading LLM over vision and dropping `estimatedCalories`  
- Reconcile then re-applying full “truth” map  
- Import `portionAndReconcile` without Mode D/Edit call site  

---

## 4. Hot files (prefer extract + test)

| Area | Prefer |
|------|--------|
| Budget / reconcile | `server_budget_reconcile.ts` + tests |
| Catalog / DB / resolver | `server_food_*.ts` |
| Pure helpers | `server_pure_helpers.ts`, aggregation/basis modules |
| Client jobs | `src/jobs/FoodAgentExecutor.ts`, modal/job tests |
| God files | Thin patches only in `server.ts` / large UI — no end-to-end rewrite |

---

## 5. Anti-patterns

- “Implement budget properly” without call sites + mode logs  
- Grep theater (symbol exists ≠ invoked on path)  
- Claiming COMPLETE after Mode A only  
- Weakening assert scripts to green  

---

## 6. Behavioral tests (required)

```bash
npx vitest run server_budget_reconcile.test.ts server_vision_scout.test.ts server_nutrient_aggregation.test.ts server_portion_clarify.test.ts
# + relevant assert scripts from DOMAIN_REGRESSION_MAP.md
```

| Invariant | Covered by |
|-----------|------------|
| Label / brand / dish_cache / scout / category budget priority | `server_budget_reconcile.test.ts` |
| `parseLabelCalories` | same |
| incompleteAssembly reject_scale | same |
| Vision soft kcal + weight + components survive LLM merge | `server_vision_scout.test.ts` (`mergeScoutItems`) |
| Aggregation preserves `rawNutritionLabel` / `components` + locks | `server_nutrient_aggregation.test.ts` |
| Portion choice scales `estimatedCalories`, keeps label | `server_portion_clarify.test.ts` |

### Still TODO

1. Extract post-reconcile “scale component rows + re-apply **only** locks” from `server.ts` into pure helper + tests.  
2. Mode A/D/Edit call-site remains gate-asserted (string/log); do not drop mode tags.
