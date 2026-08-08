/**
 * Gate: B1 portion clarify — detect multi-serve packs, pause job, resume without re-scout.
 */
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
const clarify = fs.readFileSync(path.join(root, 'server_portion_clarify.ts'), 'utf-8');
const server = fs.readFileSync(path.join(root, 'server.ts'), 'utf-8');
const jobs = fs.readFileSync(path.join(root, 'serverJobs.ts'), 'utf-8');
const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf-8');
const logChat = fs.readFileSync(path.join(root, 'src/components/LogChat.tsx'), 'utf-8');
const types = fs.readFileSync(path.join(root, 'src/jobs/types.ts'), 'utf-8');
const ui = fs.readFileSync(path.join(root, 'src/components/PortionClarifyCard.tsx'), 'utf-8');

check(
  'B1 pure module detectPortionAmbiguity + applyPortionChoices',
  clarify.includes('export function detectPortionAmbiguity') &&
    clarify.includes('export function applyPortionChoices') &&
    clarify.includes('export function buildPortionClarifyPayload')
);

check(
  'B1 server pauses with needsPortionClarify before db_search',
  server.includes('buildPortionClarifyPayload') &&
    server.includes('needsPortionClarify: true') &&
    server.includes('[PortionClarify] Pausing for user input')
);

check(
  'B1 skipScout applies portionChoices',
  server.includes('applyPortionChoices') &&
    /skipScout[\s\S]{0,200}applyPortionChoices/.test(server)
);

check(
  'B1 job status awaiting_user on pause',
  jobs.includes("status: 'awaiting_user'") &&
    jobs.includes('needsPortionClarify') &&
    types.includes("'awaiting_user'")
);

check(
  'B1 client handles awaiting_user and shows PortionClarifyCard',
  app.includes("serverJob.status === 'awaiting_user'") &&
    logChat.includes('PortionClarifyCard') &&
    logChat.includes('portionChoices: choices') &&
    logChat.includes('skipScout: true')
);

check(
  'B1 UI has portion chips and continue button',
  ui.includes('Continue with these portions') && ui.includes('weightGrams')
);

check(
  'B1 serverJobs passes skipScout and portionChoices to food-analyze',
  jobs.includes('skipScout: payload.skipScout') &&
    jobs.includes('portionChoices: payload.portionChoices')
);

console.log(`\nResults: ${pass} passed, ${fail} failed.`);
process.exit(fail > 0 ? 1 : 0);
