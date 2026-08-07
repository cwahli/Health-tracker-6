import fs from 'fs';

let failed = false;
function assert(c, m) {
  if (!c) { console.error('FAIL:', m); failed = true; }
}

const app = fs.readFileSync('src/App.tsx', 'utf8');
const runner = fs.readFileSync('src/jobs/JobQueueRunner.ts', 'utf8');
const card = fs.readFileSync('src/components/TaskPlaceholderCard.tsx', 'utf8');
const executor = fs.readFileSync('src/jobs/FoodAgentExecutor.ts', 'utf8');

// Checkpoint on retry path
assert(/skipScout/.test(app) && /checkpoint/.test(app), 'App.tsx missing checkpoint/skipScout wiring for food retries');
assert(/job\.checkpoint|getJob\([^\)]*\)\.checkpoint/.test(app) || /checkpoint:\s*cp/.test(app) || /checkpoint:\s*job\.checkpoint/.test(app),
  'App.tsx must pass job checkpoint into executeFoodAgent');

// No stacked 60/300 delayed requeue as default agent policy (allow commented/flagged)
const delayedRequeue = /delaySeconds\s*=\s*currentAttempts\s*===\s*1\s*\?\s*60\s*:\s*300/.test(runner);
if (delayedRequeue) {
  // Fail unless explicitly disabled by flag in same function (simple check: AGENT_DELAYED_RETRY and false)
  assert(/DELAYED_RETRY|delayedRetry|ENABLE_DELAYED/.test(runner),
    'JobQueueRunner still has 60/300 requeue without an explicit feature-flag name — remove or flag default off');
}

// Model default
assert(!/gemini-2\.0-flash/.test(app) || /gemini-3\.5-flash-lite/.test(app),
  'App should prefer gemini-3.5-flash-lite as fallback (remove or replace gemini-2.0-flash defaults)');
assert(/gemini-3\.5-flash-lite/.test(app), 'App.tsx missing gemini-3.5-flash-lite fallback');

// Retry log marker
assert(/\[Job\].*retry|retry attempt/i.test(app) || /\[Job\] retry/.test(app),
  'Missing [Job] retry log marker');

// Placeholder save path
assert(/onSave|pendingFoodLog/.test(card), 'TaskPlaceholderCard missing Save/pendingFoodLog');

// Executor still supports skipScout + checkpoint
assert(/skipScout/.test(executor) && /checkpoint/.test(executor), 'FoodAgentExecutor missing skipScout/checkpoint support');

// requestId reuse comment or stable use
assert(/requestId/.test(app), 'App.tsx missing requestId on executor path');

if (failed) process.exit(1);
console.log('PASS assert-unified-modal-r1');
