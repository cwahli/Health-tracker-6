/**
 * Gate: B5 refine weight/portion without re-scouting (+ B6c portion status).
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
const refine = fs.readFileSync(path.join(root, 'server_refine_scale.ts'), 'utf-8');
const server = fs.readFileSync(path.join(root, 'server.ts'), 'utf-8');
const jobs = fs.readFileSync(path.join(root, 'serverJobs.ts'), 'utf-8');
const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf-8');
const logChat = fs.readFileSync(path.join(root, 'src/components/LogChat.tsx'), 'utf-8');

check(
  'B5 pure module detectWeightRefineIntent + applyWeightRefineToScoutItems',
  refine.includes('export function detectWeightRefineIntent') &&
    refine.includes('export function applyWeightRefineToScoutItems') &&
    refine.includes('export function shouldSkipScoutForWeightRefine') &&
    (refine.includes('REFINE_SCALE_ONLY_LOG') || refine.includes('[Refine] scale-only'))
);

check(
  'B5 server imports refine helpers',
  server.includes('shouldSkipScoutForWeightRefine') &&
    server.includes('applyWeightRefineToScoutItems') &&
    server.includes('REFINE_SCALE_ONLY_LOG')
);

check(
  'B5 server logs [Refine] scale-only on weight path',
  server.includes('REFINE_SCALE_ONLY_LOG') &&
    /isWeightModification[\s\S]{0,400}applyWeightRefineToScoutItems|applyWeightRefineToScoutItems[\s\S]{0,200}REFINE/.test(
      server
    )
);

check(
  'B5 path B: refine can skip scout even with images when locks exist',
  refine.includes('path_b_images_with_label_locks') &&
    refine.includes('priorScoutHasLabelLocks')
);

check(
  'B5 state isolation does not wipe meal on scale-only',
  server.includes('!isWeightModification') &&
    server.includes('[State Isolation]')
);

check(
  'B5 client sets skipScout for refine-like text with prior scout',
  logChat.includes('// B5') &&
    logChat.includes('skipScout = true') &&
    logChat.includes('skipScout: skipScout === true')
);

check(
  'B6c status Waiting for portion choice',
  app.includes("Waiting for portion choice") &&
    jobs.includes("Waiting for portion choice")
);

check(
  'B5f skip-dietitian on label-locked pure scale without LLM call',
  server.includes('[Refine] skip-dietitian') &&
    server.includes('canSkipDietitianForPureScale')
);

console.log(`\nResults: ${pass} passed, ${fail} failed.`);
process.exit(fail > 0 ? 1 : 0);
