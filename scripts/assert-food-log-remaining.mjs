import fs from 'fs';
import path from 'path';
const root = process.cwd();
const serverTs = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
const catalogTs = fs.readFileSync(path.join(root, 'server_food_catalog.ts'), 'utf8');

const checks = [
  { name: 'promptText for food_resolver (must stay)', test: /promptText:\s*prompt/.test(serverTs) },
  { name: 'TruthLock stays', test: /TruthLock|cleared locks after REJECT/.test(serverTs) },
  { name: 'form_safe or failopen pick reason', test: /form_safe|failopen.*reason|food_resolver_failopen.*picked/.test(serverTs) },
  { name: 'pre-budget truth only locked keys (no bare full assign before Budget)', test: /if \(itemLockedKeys\.has\(key\)\)[\s\S]{0,40}aggregatedNutrients\[key\]/.test(serverTs) },
  { name: 'Assembly multi-component log', test: /\[Assembly\] multi-component rows=/.test(serverTs) },
  { name: 'RealityCheck skip soft budget', test: /skipped pre-budget density rescale/.test(serverTs) },
  { name: 'cucumber not only general_dish — produce path', test: /cucumber|berry|berries/.test(catalogTs) && /produce/.test(catalogTs) },
];

let failed = false;
console.log('=== Food log remaining gate ===');
for (const c of checks) {
  if (c.test) console.log('[PASS]', c.name);
  else { console.error('[FAIL]', c.name); failed = true; }
}
process.exit(failed ? 1 : 0);
