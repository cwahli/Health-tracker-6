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
const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf-8');
const tracker = fs.readFileSync(path.join(root, 'src/utils/agentLogsTracker.ts'), 'utf-8');

check('B2a', jobs.includes('Recovering: final result was present'));
check('B2b', jobs.includes('R2 debug upload failed'));
check('B2c', jobs.includes('R2 debug upload on fail'));
check('B2d', app.includes('msg_assistant_fail_'));
check('B2e', app.includes('recovered after poll window'));
check('B7', server.includes('[Food Resolver Skip]'));
check('B14', tracker.includes('HOT_LOG_CAP = 5'));

console.log(`\nResults: ${pass} passed, ${fail} failed.`);
process.exit(fail > 0 ? 1 : 0);
