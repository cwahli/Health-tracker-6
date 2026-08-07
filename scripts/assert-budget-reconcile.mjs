import fs from 'fs';
import path from 'path';

const root = process.cwd();
const serverTs = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
const scoutTs = fs.readFileSync(path.join(root, 'server_vision_scout.ts'), 'utf8');
const helperTs = fs.readFileSync(path.join(root, 'server_budget_reconcile.ts'), 'utf8');

const checks = [
  { name: 'helper computeItemBudget', test: /export function computeItemBudget/.test(helperTs) },
  { name: 'helper reconcileNutrients', test: /export function reconcileNutrients/.test(helperTs) },
  { name: 'helper portionAndReconcile', test: /export function portionAndReconcile/.test(helperTs) },
  { name: 'server imports budget module', test: /server_budget_reconcile/.test(serverTs) },
  { name: 'Mode A Budget log', test: /\[Budget\]/.test(serverTs) },
  { name: 'Mode A Reconcile log', test: /\[Reconcile\]/.test(serverTs) },
  { name: 'Mode D portionAndReconcile call', test: /portionAndReconcile\s*\(/.test(serverTs) },
  { name: 'Mode D Budget log', test: /\[Budget\] mode=D/.test(serverTs) },
  { name: 'Edit Budget log', test: /\[Budget\] mode=edit/.test(serverTs) },
  { name: 'scout estimatedCalories', test: /estimatedCalories/.test(scoutTs) },
  { name: 'merge preserves estimatedCalories', test: /estimatedCalories:\s*vItem\.estimatedCalories/.test(scoutTs) },
  { name: 'ReceiptInvariant REPAIRED', test: /ReceiptInvariant.*REPAIRED|REPAIRED itemCal/.test(serverTs) },
  { name: 'MatchPriority or skip category_fallback in findBestMatch', test: /MatchPriority|category_fallback' \|\| m\.source === 'fallback_estimated'|category_fallback.*return/.test(serverTs) },
];

let failed = false;
console.log('=== Budget + Reconcile Gate (delta) ===');
for (const c of checks) {
  if (c.test) console.log('[PASS]', c.name);
  else { console.error('[FAIL]', c.name); failed = true; }
}
process.exit(failed ? 1 : 0);
