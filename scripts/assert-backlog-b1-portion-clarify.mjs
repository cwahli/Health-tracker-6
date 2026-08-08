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
const jobs = fs.readFileSync(path.join(root, 'serverJobs.ts'), 'utf-8');
const logChat = fs.readFileSync(path.join(root, 'src/components/LogChat.tsx'), 'utf-8');
let clarify = '';
try { clarify = fs.readFileSync(path.join(root, 'server_portion_clarify.ts'), 'utf-8'); } catch(e){}

check('B1a', clarify.includes('detectPortionAmbiguity'));
check('B1b', server.includes('[PortionClarify] Pausing'));
check('B1c', server.includes('applyPortionChoices'));
check('B1d', jobs.includes("status: 'awaiting_user'"));
check('B1e', logChat.includes('PortionClarifyCard'));
check('B1f', jobs.includes('portionChoices: payload.portionChoices'));

console.log(`\nResults: ${pass} passed, ${fail} failed.`);
process.exit(fail > 0 ? 1 : 0);
