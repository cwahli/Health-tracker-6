import fs from 'fs';
import path from 'path';
const root = process.cwd();
const serverTs = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');

const checks = [
  { name: 'D1 primaryAlreadyInList', test: /primaryAlreadyInList/.test(serverTs) },
  { name: 'D2 sumFromListOnly', test: /sumFromListOnly/.test(serverTs) },
  { name: 'no bare double seed without gate', test: /sumFromListOnly \? 0 : portionBaseCal/.test(serverTs) },
  { name: 'multi-row log or rowsSummary', test: /using preCalc multi-row/.test(serverTs) },
  { name: 'componentsDetailList still present', test: /componentsDetailList/.test(serverTs) },
];

let failed = false;
console.log('=== Meal accuracy next (double-count +) ===');
for (const c of checks) {
  if (c.test) console.log('[PASS]', c.name);
  else { console.error('[FAIL]', c.name); failed = true; }
}
process.exit(failed ? 1 : 0);
