import fs from 'fs';
import path from 'path';
const root = process.cwd();
const serverTs = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');

const checks = [
  { name: 'D1 still present', test: /primaryAlreadyInList/.test(serverTs) },
  { name: 'D2 still present', test: /sumFromListOnly/.test(serverTs) },
  { name: 'L4 listIsMulti print gate', test: /listIsMulti/.test(serverTs) },
  { name: 'hasComponents plumbed Boolean', test: /hasComponents:\s*Boolean\(/.test(serverTs) },
  { name: 'stronger dedupe stripDisplayNoise or id:', test: /stripDisplayNoise|id:\$\{|rowKey\s*=/.test(serverTs) },
  { name: 'no bare primary print without listIsMulti', test: /if \(!listIsMulti\)/.test(serverTs) },
  { name: 'componentsDetailList still used', test: /componentsDetailList/.test(serverTs) },
];

let failed = false;
console.log('=== Receipt dup rows (post D1/D2) ===');
for (const c of checks) {
  if (c.test) console.log('[PASS]', c.name);
  else { console.error('[FAIL]', c.name); failed = true; }
}
process.exit(failed ? 1 : 0);
