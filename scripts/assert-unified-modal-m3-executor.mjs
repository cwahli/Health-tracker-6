import fs from 'fs';
import assert from 'assert';

console.log('Running M3 Executor Assertions...');

const executorCode = fs.readFileSync('src/jobs/FoodAgentExecutor.ts', 'utf8');
const runnerCode = fs.readFileSync('src/jobs/JobQueueRunner.ts', 'utf8');
const logChatCode = fs.readFileSync('src/components/LogChat.tsx', 'utf8');

// Check 1: FoodAgentExecutor exports executeFoodAgent
assert(executorCode.includes('export async function* executeFoodAgent'), 'M3.1 FoodAgentExecutor missing executeFoodAgent');

// Check 2: Checkpoint emission
assert(executorCode.includes('checkpoint') && executorCode.includes('scout'), 'M3.2 Missing scout checkpoint emission');

// Check 3: Runner connects FoodAgentExecutor
assert(runnerCode.includes('executeFoodAgent') || runnerCode.includes('setExecutor'), 'M3.3 Runner missing executeFoodAgent wiring');

// Check 4: LogChat uses ImageStore for async job images
assert(logChatCode.includes('ImageStore') || logChatCode.includes('JobStore'), 'M3.4 LogChat missing JobStore / ImageStore integration');

console.log('All M3 Executor assertions PASS (exit 0).');
process.exit(0);
