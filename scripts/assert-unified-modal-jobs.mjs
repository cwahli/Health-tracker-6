import fs from 'fs';

let failed = false;
function assert(condition, msg) {
  if (!condition) {
    console.error(`FAIL: ${msg}`);
    failed = true;
  }
}

const logChatSrc = fs.readFileSync('src/components/LogChat.tsx', 'utf8');
const appSrc = fs.readFileSync('src/App.tsx', 'utf8');
const executorSrc = fs.readFileSync('src/jobs/FoodAgentExecutor.ts', 'utf8');

// 1. Compare meal / Mode D queue integration
assert(appSrc.includes("kind: 'food_compare'") || appSrc.includes('food_compare'), 'App.tsx missing food_compare kind creation');
assert(logChatSrc.includes("kind: 'food_compare'") || logChatSrc.includes('food_compare'), 'LogChat.tsx missing food_compare kind support');

// 2. Family lock checks
assert(logChatSrc.includes("lockedModeFamily === 'D'") || logChatSrc.includes("lockedModeFamily: 'D'"), 'LogChat missing lockedModeFamily D handling');
assert(logChatSrc.includes("lockedModeFamily === 'A'") || logChatSrc.includes("lockedModeFamily: 'A'"), 'LogChat missing lockedModeFamily A handling');

// 3. Mode tags: review, compare, edit
assert(logChatSrc.includes("submissionMode = 'edit'") || logChatSrc.includes("mode: 'edit'") || logChatSrc.includes("mode: submissionMode"), 'LogChat missing edit mode submission');
assert(logChatSrc.includes("submissionMode = 'compare'") || logChatSrc.includes("family === 'D'"), 'LogChat missing compare mode submission');

// 4. FoodAgentExecutor mode support
assert(executorSrc.includes("'review' | 'compare' | 'edit'"), 'FoodAgentExecutor missing mode type definition');

if (failed) process.exit(1);
console.log('PASS assert-unified-modal-jobs');
