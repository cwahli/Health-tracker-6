/**
 * Gate: K1 — food + biomarker domain packs + a11y default for all agents
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
const read = (p) => fs.readFileSync(path.join(root, p), 'utf-8');

const packs = read('src/utils/bugDomainPacks.ts');
const snap = read('src/utils/bugSnapshot.ts');
const server = read('serverBugSnapshot.ts');
const fab = read('src/components/BugSnapshotFab.tsx');
const header = read('src/components/Header.tsx');

check(
  'K1 food + biomarker pack builders',
  packs.includes('export function buildFoodDomainPack') &&
    packs.includes('export function buildBiomarkerDomainPack') &&
    packs.includes('export function resolveDomainPack')
);

check(
  'K1 overview.md marks a11y primary for all agents',
  packs.includes('buildOverviewMarkdown') &&
    packs.includes('all agents') &&
    packs.includes('A11y')
);

check(
  'A11y default constants + system prompt for ALL models',
  snap.includes('AGENT_STRUCTURE_DEFAULT') &&
    snap.includes("'a11y'") &&
    snap.includes('ALL models') &&
    snap.includes('buildBugTriageSystemPrompt')
);

check(
  'User prompt puts a11y PRIMARY before logs',
  snap.includes('PRIMARY structure') &&
    snap.includes('domainPackJson') &&
    snap.includes('A11Y_AGENT_MAX_CHARS')
);

check(
  'Server stores domain_pack.json + accessibility_tree + overview.md',
  server.includes('domain_pack.json') &&
    server.includes('accessibility_tree.txt') &&
    server.includes('overview.md') &&
    server.includes('structure=') &&
    server.includes('AGENT_STRUCTURE_DEFAULT')
);

check(
  'Triage loads a11y + domain_pack before full payload',
  server.includes('domainPackJson') &&
    server.includes('a11y_tree.txt') &&
    server.includes('domain_pack=') &&
    (server.includes('structure=') || server.includes('AGENT_STRUCTURE_DEFAULT'))
);

check(
  'Fab resolves domain pack + a11y root dialog',
  fab.includes('resolveDomainPack') &&
    fab.includes('buildAccessibilityTree') &&
    fab.includes('domain_pack') &&
    fab.includes('AGENT_STRUCTURE_DEFAULT')
);

check(
  'Header wires JobStore context into Fab',
  header.includes('getModalContext') &&
    header.includes('JobStore.getAllJobs') &&
    header.includes('pendingFoodLog')
);

console.log(`\nResults: ${pass} passed, ${fail} failed.`);
process.exit(fail > 0 ? 1 : 0);
