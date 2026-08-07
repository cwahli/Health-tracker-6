import fs from 'fs';

let failed = false;
function assert(c, m) {
  if (!c) { console.error('FAIL:', m); failed = true; }
}

const header = fs.readFileSync('src/components/Header.tsx', 'utf8');
const card = fs.readFileSync('src/components/TaskPlaceholderCard.tsx', 'utf8');
const store = fs.readFileSync('src/jobs/JobStore.ts', 'utf8');
const progress = fs.readFileSync('src/jobs/progress.ts', 'utf8');
const bottomNav = fs.readFileSync('src/components/BottomNav.tsx', 'utf8');

// Product decision: NO medical tab in BottomNav (home | insights | + | food | trends)
assert(!/nav-tab-medical/.test(bottomNav), 'BottomNav must NOT add nav-tab-medical (product: not needed)');
assert(/JobStore|jobs\.filter|runningCount|queuedCount/.test(header), 'Header missing job badge wiring');
assert(/ahead|Queued|Waiting/i.test(card), 'TaskPlaceholderCard missing queue waiting copy');
assert(/progress|getProgress|step/.test(progress), 'progress.ts missing step helpers');
assert(/localStorage|strip|base64|image/i.test(store), 'JobStore should address persistence size / strip concerns');

if (failed) process.exit(1);
console.log('PASS assert-unified-modal-r2');
