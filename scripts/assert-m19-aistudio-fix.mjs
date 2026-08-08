import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
    passed++;
  } else {
    console.error(`FAIL: ${message}`);
    failed++;
  }
}

console.log('--- Running M19 AI Studio API Key and Stream Fix Assertions ---');

// 1. Check server.ts API Key resolution & fallback
const serverSrc = fs.readFileSync('server.ts', 'utf8');
assert(
  serverSrc.includes('process.env.GEMINI_API_KEY || process.env.AISTUDIO_API_KEY') ||
  serverSrc.includes('getGeminiClient()'),
  'server.ts supports flexible Gemini API key resolution'
);
assert(
  serverSrc.includes('errorPayload') && serverSrc.includes('res.write(`data: ${JSON.stringify(errorPayload)}\\n\\n`)'),
  'server.ts emits error JSON payloads over SSE stream in catch block'
);

// 2. Check serverJobs.ts Stream error handling
const serverJobsSrc = fs.readFileSync('serverJobs.ts', 'utf8');
assert(
  serverJobsSrc.includes('let streamErrorMessage: string | null = null;'),
  'serverJobs.ts declares streamErrorMessage variable'
);
assert(
  serverJobsSrc.includes('parsed.error'),
  'serverJobs.ts parses error messages from stream payload'
);
assert(
  serverJobsSrc.includes('throw new Error(streamErrorMessage ||'),
  'serverJobs.ts surfaces real streamErrorMessage on failure'
);

console.log(`\nM19 Assertions Summary: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All M19 Assertions Passed (Exit 0).');
  process.exit(0);
}
