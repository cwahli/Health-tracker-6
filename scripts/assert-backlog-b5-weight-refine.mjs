import fs from 'fs';
import path from 'path';

let pass = 0;
let fail = 0;
function check(desc, cond) {
  if (cond) { console.log(`PASS: ${desc}`); pass++; }
  else { console.error(`FAIL: ${desc}`); fail++; }
}

const root = process.cwd();
const server = fs.readFileSync(path.join(root, 'server.ts'), 'utf-8');
const logChat = fs.readFileSync(path.join(root, 'src/components/LogChat.tsx'), 'utf-8');
const helpers = fs.readFileSync(path.join(root, 'server_pure_helpers.ts'), 'utf-8');
let scale = '';
try { scale = fs.readFileSync(path.join(root, 'server_refine_scale.ts'), 'utf-8'); } catch(e){}

check('B5a', scale.includes('detectWeightRefineIntent'));
check('B5b', server.includes('reason=${refineDecision.reason}'));
check('B5c', server.includes('applyWeightRefineToScoutItems'));
check('B5d', server.includes('!isWeightModification && !refineDecision.skip'));
check('B5e', logChat.includes('agentResult.scoutItems.map(si => si.estimatedWeightGrams)'));
check('B5f', helpers.includes('originalData: Array.isArray(raw) ? raw : [raw]'));

console.log(`\nResults: ${pass} passed, ${fail} failed.`);
process.exit(fail > 0 ? 1 : 0);
