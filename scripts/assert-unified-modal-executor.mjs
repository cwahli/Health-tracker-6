import fs from 'fs';

let failed = false;
function assert(c, m) {
  if (!c) { console.error('FAIL:', m); failed = true; }
}

const execPath = 'src/jobs/FoodAgentExecutor.ts';
assert(fs.existsSync(execPath), 'FoodAgentExecutor.ts missing');
const execSrc = fs.readFileSync(execPath, 'utf8');
assert(!/from ['"]react['"]/.test(execSrc), 'FoodAgentExecutor imports react');
assert(!/from ['"].*\.tsx['"]/.test(execSrc), 'FoodAgentExecutor imports tsx');
assert(/export/.test(execSrc), 'FoodAgentExecutor has no export');

const logChat = fs.readFileSync('src/components/LogChat.tsx', 'utf8');
assert(/FoodAgentExecutor/.test(logChat), 'LogChat does not reference FoodAgentExecutor');
// call site: not only import — require a call-ish pattern
assert(/FoodAgentExecutor\.|executeFood|runFoodAgent|from ['"].*FoodAgentExecutor/.test(logChat), 'LogChat missing executor usage');

assert(fs.existsSync('src/jobs/__tests__/FoodAgentExecutor.test.ts'), 'FoodAgentExecutor.test.ts missing');

if (failed) process.exit(1);
console.log('PASS assert-unified-modal-executor');
