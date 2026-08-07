import fs from 'fs';
import path from 'path';

const root = process.cwd();
const serverTs = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
const helperTs = fs.readFileSync(path.join(root, 'server_budget_reconcile.ts'), 'utf8');

const checks = [
  { name: 'TruthLock clear after REJECT', test: /TruthLock|cleared locks after REJECT/.test(serverTs) },
  { name: 'TruthSkip multi-component web_search', test: /TruthSkip|ignoring web_search as dish truth/.test(serverTs) },
  { name: 'stripped non-genuine calorie lock OR printedCaloriesPresent', test: /stripped non-genuine calorie lock|printedCaloriesPresent|genuineHard/.test(serverTs) },
  { name: 'findBestMatch skips web_search', test: /web_search.*return|source === 'web_search'.*return/.test(serverTs) },
  { name: 'food_resolver_failopen OR Fail-open', test: /food_resolver_failopen|Fail-open: first allowlisted|failOpen/.test(serverTs) },
  { name: 'ReceiptInvariant SKIP absurd factor OR factor out of band', test: /SKIP rows→item|out of band/.test(serverTs) },
  { name: 'budget helpers still present', test: /computeItemBudget/.test(helperTs) && /reconcileNutrients/.test(helperTs) },
];

let failed = false;
console.log('=== False hard-lock fix gate ===');
for (const c of checks) {
  if (c.test) console.log('[PASS]', c.name);
  else { console.error('[FAIL]', c.name); failed = true; }
}
process.exit(failed ? 1 : 0);
