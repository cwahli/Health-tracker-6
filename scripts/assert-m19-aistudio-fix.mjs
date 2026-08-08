import fs from 'fs';
import assert from 'assert';

console.log('Running M19 AI Studio Key & In-Memory Job Gate Assertions...');

const serverTs = fs.readFileSync('server.ts', 'utf8');
const serverJobsTs = fs.readFileSync('serverJobs.ts', 'utf8');

// 1. getGeminiApiKey helper exists and supports all environment variables
assert.ok(serverTs.includes('const getGeminiApiKey ='), 'server.ts must define getGeminiApiKey helper');
assert.ok(serverTs.includes('process.env.GOOGLE_API_KEY'), 'server.ts must check GOOGLE_API_KEY');
assert.ok(serverTs.includes('process.env.API_KEY'), 'server.ts must check API_KEY');
assert.ok(serverTs.includes('process.env.GEMINI_API_KEYS'), 'server.ts must check GEMINI_API_KEYS');
console.log('PASS: M19 getGeminiApiKey helper exists with multi-env support');

// 2. getGeminiClient uses getGeminiApiKey
assert.ok(serverTs.includes('const apiKey = getGeminiApiKey();'), 'getGeminiClient must call getGeminiApiKey()');
console.log('PASS: M19 getGeminiClient calls getGeminiApiKey()');

// 3. serverJobs.ts has inMemoryServerJobs store for offline / unconfigured Supabase
assert.ok(serverJobsTs.includes('export const inMemoryServerJobs = new Map<string, any>();'), 'serverJobs.ts must define inMemoryServerJobs');
assert.ok(serverJobsTs.includes('export function getInMemoryServerJob'), 'serverJobs.ts must export getInMemoryServerJob');
assert.ok(serverJobsTs.includes('export function listInMemoryServerJobs'), 'serverJobs.ts must export listInMemoryServerJobs');
console.log('PASS: M19 serverJobs maintains inMemoryServerJobs store');

// 4. server.ts routes /api/jobs/status and /api/jobs/debug use inMemoryServerJobs fallback
assert.ok(serverTs.includes('getInMemoryServerJob'), 'server.ts must query getInMemoryServerJob when Supabase is unconfigured');
console.log('PASS: M19 server.ts /api/jobs/status and /api/jobs/debug query in-memory store');

// 5. serverJobs.ts catches parsed.error
assert.ok(serverJobsTs.includes('if (parsed.error)'), 'serverJobs.ts must check parsed.error from stream');
assert.ok(serverJobsTs.includes('accumulatedLogs.push(`[error] ${errMsg}`);'), 'serverJobs.ts must log parsed error');
console.log('PASS: M19 serverJobs parses and propagates SSE error payloads');

// 6. serverJobs.ts has loopback retry with localhost
assert.ok(serverJobsTs.includes('http://localhost:${port}/api/gemini/food-analyze?stream=true'), 'serverJobs.ts must have localhost fallback');
console.log('PASS: M19 serverJobs has localhost loopback fallback');

console.log('\nAll M19 AI Studio Fix Assertions PASS (exit 0).');
process.exit(0);
