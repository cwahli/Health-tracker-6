import fs from 'fs';

let failed = false;
function assert(condition, msg) {
  if (!condition) {
    console.error(`FAIL: ${msg}`);
    failed = true;
  }
}

// 1. Verify JobQueueRunner has wake and visibility change support
const runnerSrc = fs.readFileSync('src/jobs/JobQueueRunner.ts', 'utf8');
assert(runnerSrc.includes('wake('), 'JobQueueRunner is missing wake() method');
assert(runnerSrc.includes('visibilitychange'), 'JobQueueRunner is missing visibilitychange event registration');
assert(runnerSrc.includes('document.visibilityState === \'visible\'') || runnerSrc.includes('document.visibilityState === "visible"'), 'JobQueueRunner is missing document visibility State check');

// 2. Verify JobQueueRunner has delayed transient error retries
assert(runnerSrc.includes('error.class === \'transient\'') || runnerSrc.includes('isTransient'), 'JobQueueRunner is missing transient class check');
assert(runnerSrc.includes('retryNotBefore'), 'JobQueueRunner is missing retryNotBefore setting');
assert(runnerSrc.includes('60') && runnerSrc.includes('300'), 'JobQueueRunner is missing 60s/300s transient delay schedule');

// 3. Verify MedicalHistoryTab uses TaskPlaceholderCard
const medHistorySrc = fs.readFileSync('src/components/MedicalHistoryTab.tsx', 'utf8');
assert(medHistorySrc.includes('TaskPlaceholderCard'), 'MedicalHistoryTab is missing TaskPlaceholderCard usage');

// 4. Verify TaskPlaceholderCard supports medical jobs
const cardSrc = fs.readFileSync('src/components/TaskPlaceholderCard.tsx', 'utf8');
assert(cardSrc.includes('medical') && cardSrc.includes('Analyzing medical request') || cardSrc.includes('Analyzing medical data...'), 'TaskPlaceholderCard does not support medical kind placeholders');

// 5. Verify App.tsx executes medical jobs
const appSrc = fs.readFileSync('src/App.tsx', 'utf8');
assert(appSrc.includes('executeMedicalAgent'), 'App.tsx does not reference executeMedicalAgent');

if (failed) {
  process.exit(1);
} else {
  console.log('PASS assert-unified-modal-m6');
}
