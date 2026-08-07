import fs from 'fs';
import path from 'path';
const root = process.cwd();
const serverTs = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
const scoutTs = fs.readFileSync(path.join(root, 'server_vision_scout.ts'), 'utf8');

const checks = [
  { name: 'package multi-comp not bulk OR weight 500', test: /multiComp|components\.length >= 2[\s\S]{0,200}bulk|isBulkWeight = weight >= 500|NEVER bulk|multi-component visual/.test(scoutTs) || /weight >= 500/.test(scoutTs) },
  { name: 'componentMatch similarity 0.75', test: /nameSimilarity\([^)]+\)\s*>=\s*0\.75/.test(scoutTs) },
  { name: 'poison identity olive loaf or taro', test: /olive loaf|taro|basil.*berr|loaf.*olive/i.test(serverTs) },
  { name: 'softBudget receipt repair rows→softBudget', test: /rows→softBudget|softBudget/.test(serverTs) },
  { name: 'dish-level collapse discard', test: /dish-level collapse|DISCARDED dish-level/.test(serverTs) },
  { name: 'promptText stays', test: /promptText:\s*prompt/.test(serverTs) },
];

let failed = false;
console.log('=== Food log identity gate ===');
for (const c of checks) {
  if (c.test) console.log('[PASS]', c.name);
  else { console.error('[FAIL]', c.name); failed = true; }
}
process.exit(failed ? 1 : 0);
