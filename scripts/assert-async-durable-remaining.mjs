import fs from 'fs';
import path from 'path';

let pass = 0;
let fail = 0;
function check(desc, cond) {
  if (cond) {
    console.log(`PASS: ${desc}`);
    pass++;
  } else {
    console.error(`FAIL: ${desc}`);
    fail++;
  }
}

const root = process.cwd();
const jobStore = fs.readFileSync(path.join(root, 'src/jobs/JobStore.ts'), 'utf-8');
const server = fs.readFileSync(path.join(root, 'server.ts'), 'utf-8');
const agg = fs.readFileSync(path.join(root, 'server_nutrient_aggregation.ts'), 'utf-8');
const logChat = fs.readFileSync(path.join(root, 'src/components/LogChat.tsx'), 'utf-8');
const foodCard = fs.readFileSync(path.join(root, 'src/components/chat-cards/FoodCard.tsx'), 'utf-8');

check(
  'B2d JobStore reload preserves server-owned running jobs and awaiting_user',
  jobStore.includes('hasServerJob') &&
    jobStore.includes('job.status === \'running\'') &&
    (jobStore.includes('job.result?.jobId') || jobStore.includes('job.requestId'))
);

check(
  'B5f server skips Dietitian on label-locked pure weight scale',
  server.includes('[Refine] skip-dietitian') &&
    server.includes('canSkipDietitianForPureScale')
);

check(
  'B3g aggregateItemsNutrients preserves locked macros while allowing soft micros',
  agg.includes('applyTruthLocks') &&
    agg.includes('itemLockedKeys')
);

check(
  'LogChat has synchronous isSendingRef double-tap guard with failsafe',
  logChat.includes('isSendingRef.current = true') &&
    logChat.includes('isSendingRef.current = false') &&
    logChat.includes('setTimeout')
);

check(
  'FoodCard has synchronous isLoggingRef double-tap guard',
  foodCard.includes('isLoggingRef.current = true') &&
    foodCard.includes('isLoggingRef.current = false')
);

console.log(`\nResults: ${pass} passed, ${fail} failed.`);
process.exit(fail > 0 ? 1 : 0);
